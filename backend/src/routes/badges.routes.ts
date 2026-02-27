import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';

const router = Router();

/**
 * GET /badges
 * 所有勳章列表
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        const badges = await prisma.$queryRaw<any[]>`
            SELECT id, code, name, description, icon FROM badges ORDER BY created_at ASC
        `;
        res.json({ success: true, data: badges });
    } catch (error) {
        console.error('Badges list error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: '勳章載入失敗' },
        });
    }
});

/**
 * GET /badges/me
 * 使用者已解鎖勳章
 */
router.get('/me', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        const userBadges = await prisma.$queryRaw<any[]>`
            SELECT b.id, b.code, b.name, b.description, b.icon, ub."unlockedAt"
            FROM user_badges ub
            JOIN badges b ON b.id = ub."badgeId"
            WHERE ub."userId" = ${userId}
            ORDER BY ub."unlockedAt" DESC
        `;

        res.json({ success: true, data: userBadges });
    } catch (error) {
        console.error('User badges error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: '勳章載入失敗' },
        });
    }
});

/**
 * POST /badges/check
 * 檢查並解鎖勳章 (每次出席/加入揪團後呼叫)
 */
router.post('/check', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const newlyUnlocked: any[] = [];

        // 取得使用者已解鎖的勳章
        const existing = await prisma.$queryRaw<{ code: string }[]>`
            SELECT b.code FROM user_badges ub JOIN badges b ON b.id = ub."badgeId" WHERE ub."userId" = ${userId}
        `;
        const unlockedCodes = new Set(existing.map(e => e.code));

        // 1. first_step: 完成第一次揪團
        if (!unlockedCodes.has('first_step')) {
            const joinCount = await prisma.groupMember.count({ where: { userId, status: 'JOINED' } });
            if (joinCount >= 1) {
                await unlockBadge(userId, 'first_step');
                newlyUnlocked.push('first_step');
            }
        }

        // 2. social_butterfly: 加入 10 個不同揪團
        if (!unlockedCodes.has('social_butterfly')) {
            const joinCount = await prisma.groupMember.count({ where: { userId, status: 'JOINED' } });
            if (joinCount >= 10) {
                await unlockBadge(userId, 'social_butterfly');
                newlyUnlocked.push('social_butterfly');
            }
        }

        // 3. team_leader: 發起 5 個揪團
        if (!unlockedCodes.has('team_leader')) {
            const createdCount = await prisma.group.count({ where: { createdById: userId } });
            if (createdCount >= 5) {
                await unlockBadge(userId, 'team_leader');
                newlyUnlocked.push('team_leader');
            }
        }

        // 4. iron_man: 集滿 3 種不同運動
        if (!unlockedCodes.has('iron_man')) {
            const sportTypes = await prisma.groupMember.findMany({
                where: { userId, status: 'JOINED' },
                include: { group: { select: { sportType: true } } },
            });
            const uniqueSports = new Set(sportTypes.map(m => m.group.sportType));
            if (uniqueSports.size >= 3) {
                await unlockBadge(userId, 'iron_man');
                newlyUnlocked.push('iron_man');
            }
        }

        // 5. early_bird: 參加 5 場 08:00 前的運動
        if (!unlockedCodes.has('early_bird')) {
            const earlyGroups = await prisma.groupMember.findMany({
                where: { userId, status: 'JOINED' },
                include: { group: { select: { time: true } } },
            });
            const earlyCount = earlyGroups.filter(m => new Date(m.group.time).getHours() < 8).length;
            if (earlyCount >= 5) {
                await unlockBadge(userId, 'early_bird');
                newlyUnlocked.push('early_bird');
            }
        }

        // 6. consistent: 連續 5 場都出席 (基於 attendedCount)
        if (!unlockedCodes.has('consistent')) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { attendedCount: true } });
            if (user && user.attendedCount >= 5) {
                await unlockBadge(userId, 'consistent');
                newlyUnlocked.push('consistent');
            }
        }

        // 回傳新解鎖的勳章資訊
        let unlockedBadges: any[] = [];
        if (newlyUnlocked.length > 0) {
            unlockedBadges = await prisma.$queryRaw<any[]>`
                SELECT id, code, name, description, icon FROM badges WHERE code = ANY(${newlyUnlocked})
            `;
        }

        res.json({ success: true, data: { newlyUnlocked: unlockedBadges } });
    } catch (error) {
        console.error('Badge check error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: '勳章檢查失敗' },
        });
    }
});

async function unlockBadge(userId: string, badgeCode: string) {
    await prisma.$executeRaw`
        INSERT INTO user_badges ("id", "userId", "badgeId", "unlockedAt")
        SELECT gen_random_uuid()::text, ${userId}, id, NOW() FROM badges WHERE code = ${badgeCode}
        ON CONFLICT ("userId", "badgeId") DO NOTHING
    `;
}

export default router;
