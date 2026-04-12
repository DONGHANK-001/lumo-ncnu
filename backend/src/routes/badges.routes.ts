import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';
import { logger } from '../lib/logger.js';

const router = Router();

const ADDITIONAL_BADGES = [
    {
        code: 'campus_explorer',
        name: '校園探索家',
        description: '參與 4 個不同地點的揪團',
        icon: '🧭',
    },
    {
        code: 'night_owl',
        name: '夜行動物',
        description: '參與 5 場晚上 8 點後開始的揪團',
        icon: '🌙',
    },
] as const;

async function ensureAdditionalBadges() {
    await prisma.badge.createMany({
        data: [...ADDITIONAL_BADGES],
        skipDuplicates: true,
    });
}

router.get('/', async (_req: Request, res: Response) => {
    try {
        await ensureAdditionalBadges();

        const badges = await prisma.$queryRaw<any[]>`
            SELECT id, code, name, description, icon FROM badges ORDER BY created_at ASC
        `;

        res.json({ success: true, data: badges });
    } catch (error) {
        logger.error({ err: error }, 'Badges list error');
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: '勳章列表載入失敗' },
        });
    }
});

router.get('/me', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    try {
        await ensureAdditionalBadges();
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
        req.log.error({ err: error }, 'User badges error');
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: '我的勳章載入失敗' },
        });
    }
});

router.get('/user/:id', async (req: Request, res: Response) => {
    try {
        await ensureAdditionalBadges();
        const userId = req.params.id;

        const userBadges = await prisma.$queryRaw<any[]>`
            SELECT b.id, b.code, b.name, b.description, b.icon, ub."unlockedAt"
            FROM user_badges ub
            JOIN badges b ON b.id = ub."badgeId"
            WHERE ub."userId" = ${userId}
            ORDER BY ub."unlockedAt" DESC
        `;

        res.json({ success: true, data: userBadges });
    } catch (error) {
        logger.error({ err: error }, 'Public user badges error');
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: '勳章載入失敗' },
        });
    }
});

router.post('/check', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    try {
        await ensureAdditionalBadges();

        const userId = req.user!.id;
        const newlyUnlocked: string[] = [];

        const existing = await prisma.$queryRaw<{ code: string }[]>`
            SELECT b.code
            FROM user_badges ub
            JOIN badges b ON b.id = ub."badgeId"
            WHERE ub."userId" = ${userId}
        `;
        const unlockedCodes = new Set(existing.map((item) => item.code));

        if (!unlockedCodes.has('first_step')) {
            const joinCount = await prisma.groupMember.count({ where: { userId, status: 'JOINED' } });
            if (joinCount >= 1) {
                await unlockBadge(userId, 'first_step');
                newlyUnlocked.push('first_step');
            }
        }

        if (!unlockedCodes.has('social_butterfly')) {
            const joinCount = await prisma.groupMember.count({ where: { userId, status: 'JOINED' } });
            if (joinCount >= 10) {
                await unlockBadge(userId, 'social_butterfly');
                newlyUnlocked.push('social_butterfly');
            }
        }

        if (!unlockedCodes.has('team_leader')) {
            const createdCount = await prisma.group.count({ where: { createdById: userId } });
            if (createdCount >= 5) {
                await unlockBadge(userId, 'team_leader');
                newlyUnlocked.push('team_leader');
            }
        }

        if (!unlockedCodes.has('iron_man')) {
            const joinedGroups = await prisma.groupMember.findMany({
                where: { userId, status: 'JOINED' },
                include: { group: { select: { sportType: true } } },
            });
            const uniqueSports = new Set(joinedGroups.map((member) => member.group.sportType));
            if (uniqueSports.size >= 3) {
                await unlockBadge(userId, 'iron_man');
                newlyUnlocked.push('iron_man');
            }
        }

        if (!unlockedCodes.has('early_bird')) {
            const joinedGroups = await prisma.groupMember.findMany({
                where: { userId, status: 'JOINED' },
                include: { group: { select: { time: true } } },
            });
            const earlyCount = joinedGroups.filter((member) => new Date(member.group.time).getHours() < 8).length;
            if (earlyCount >= 5) {
                await unlockBadge(userId, 'early_bird');
                newlyUnlocked.push('early_bird');
            }
        }

        if (!unlockedCodes.has('consistent')) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { attendedCount: true },
            });
            if (user && user.attendedCount >= 5) {
                await unlockBadge(userId, 'consistent');
                newlyUnlocked.push('consistent');
            }
        }

        if (!unlockedCodes.has('campus_explorer')) {
            const joinedGroups = await prisma.groupMember.findMany({
                where: { userId, status: 'JOINED' },
                include: { group: { select: { location: true } } },
            });
            const uniqueLocations = new Set(
                joinedGroups
                    .map((member) => member.group.location)
                    .filter((location): location is string => Boolean(location))
            );
            if (uniqueLocations.size >= 4) {
                await unlockBadge(userId, 'campus_explorer');
                newlyUnlocked.push('campus_explorer');
            }
        }

        if (!unlockedCodes.has('night_owl')) {
            const joinedGroups = await prisma.groupMember.findMany({
                where: { userId, status: 'JOINED' },
                include: { group: { select: { time: true } } },
            });
            const lateNightCount = joinedGroups.filter((member) => new Date(member.group.time).getHours() >= 20).length;
            if (lateNightCount >= 5) {
                await unlockBadge(userId, 'night_owl');
                newlyUnlocked.push('night_owl');
            }
        }

        let unlockedBadges: any[] = [];
        if (newlyUnlocked.length > 0) {
            unlockedBadges = await prisma.$queryRaw<any[]>`
                SELECT id, code, name, description, icon
                FROM badges
                WHERE code = ANY(${newlyUnlocked})
            `;
        }

        res.json({ success: true, data: { newlyUnlocked: unlockedBadges } });
    } catch (error) {
        req.log.error({ err: error }, 'Badge check error');
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: '勳章檢查失敗' },
        });
    }
});

async function unlockBadge(userId: string, badgeCode: string) {
    await prisma.$executeRaw`
        INSERT INTO user_badges ("id", "userId", "badgeId", "unlockedAt")
        SELECT gen_random_uuid()::text, ${userId}, id, NOW()
        FROM badges
        WHERE code = ${badgeCode}
        ON CONFLICT ("userId", "badgeId") DO NOTHING
    `;
}

export default router;
