import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';
import { isTrialPeriod } from '../utils/trial-period.js';

const router = Router();

// 取得結算時間 (預設每月，第一個月由 2026-03-02 起算)
const getMonthDateRange = (period: 'current' | 'last_month' = 'current') => {
    const now = new Date();
    let start, end;

    if (period === 'current') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        if (now.getFullYear() === 2026 && now.getMonth() === 2) {
            // 2026 年 3 月的起點為 3/2
            start = new Date('2026-03-02T00:00:00+08:00');
        }
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
        // last_month
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (now.getFullYear() === 2026 && now.getMonth() === 3) {
            // 如果是 4 月想看 3 月的資料，3 月的起點是 3/2
            start = new Date('2026-03-02T00:00:00+08:00');
        }
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }
    return { start, end };
};

const COOL_TITLES = [
    '【傳說】LUMO 霸主',
    '【無雙】極限強者',
    '【神域】不敗戰神',
    '【聖耀】運動狂熱',
    '【星輝】全能超人',
    '【輝煌】熱血鬥士',
    '【閃耀】明日之星',
    '【精英】系館傳奇',
    '【卓越】不懈鐵人',
    '【新銳】黑馬逆襲',
];

/**
 * GET /leaderboard/departments
 * 系所排行榜 — 本週或總計揪團參與次數
 */
router.get('/departments', async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || 'current';
        const { start, end } = getMonthDateRange(period as 'current' | 'last_month');

        const results = await prisma.$queryRaw<
            { department: string; total_joins: bigint; unique_users: bigint; top_sport: string }[]
        >`
            SELECT 
                u."department",
                COUNT(gm.id)::bigint as total_joins,
                COUNT(DISTINCT u.id)::bigint as unique_users,
                MODE() WITHIN GROUP (ORDER BY g."sportType" DESC) as top_sport
            FROM group_members gm
            JOIN users u ON u.id = gm."userId"
            JOIN groups g ON g.id = gm."groupId"
            WHERE gm.status = 'JOINED'
              AND gm."joinedAt" >= ${start}
              AND gm."joinedAt" <= ${end}
              AND u."department" IS NOT NULL
              AND u."department" != ''
            GROUP BY u."department"
            ORDER BY total_joins DESC
            LIMIT 20
        `;

        // Convert BigInt to Number for JSON serialization
        const departments = results.map((r, index) => ({
            rank: index + 1,
            department: r.department,
            totalJoins: Number(r.total_joins),
            uniqueUsers: Number(r.unique_users),
            topSport: r.top_sport,
        }));

        res.json({ success: true, data: { period, departments } });
    } catch (error) {
        console.error('Leaderboard error:', error);
        // Fallback: 用 ORM 查詢
        try {
            const members = await prisma.groupMember.findMany({
                where: { status: 'JOINED' },
                include: {
                    user: { select: { department: true } },
                    group: { select: { sportType: true } }
                },
            });

            const deptMap = new Map<string, { joins: number; users: Set<string>; sports: Record<string, number> }>();
            for (const m of members) {
                const dept = (m as any).user?.department;
                const sport = (m as any).group?.sportType;
                if (!dept || !sport) continue;

                if (!deptMap.has(dept)) deptMap.set(dept, { joins: 0, users: new Set(), sports: {} });
                const entry = deptMap.get(dept)!;
                entry.joins++;
                entry.users.add(m.userId);
                entry.sports[sport] = (entry.sports[sport] || 0) + 1;
            }

            const departments = Array.from(deptMap.entries())
                .map(([dept, data], index) => {
                    // Find the sport with maximum count
                    const topSport = Object.entries(data.sports).sort((a, b) => b[1] - a[1])[0][0];
                    return {
                        rank: index + 1,
                        department: dept,
                        totalJoins: data.joins,
                        uniqueUsers: data.users.size,
                        topSport,
                    };
                })
                .sort((a, b) => b.totalJoins - a.totalJoins)
                .map((d, i) => ({ ...d, rank: i + 1 }));

            res.json({ success: true, data: { period: 'all', departments } });
        } catch (fallbackError) {
            console.error('Leaderboard fallback error:', fallbackError);
            res.status(500).json({
                success: false,
                error: { code: 'SERVER_ERROR', message: '排行榜載入失敗' },
            });
        }
    }
});

/**
 * GET /leaderboard/users
 * 個人排行榜 Top N
 */
router.get('/users', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const user = req.user!;

        // 檢查權限：必須是 PLUS 會員或是處於免費試用期
        if (user.planType !== 'PLUS' && !isTrialPeriod()) {
            return res.status(403).json({
                success: false,
                error: { code: 'PRO_REQUIRED', message: '只有 PLUS 會員可以解鎖個人排行榜特權' }
            });
        }

        const limit = parseInt(req.query.top as string) || 10;
        const { start, end } = getMonthDateRange('current');

        const members = await prisma.groupMember.groupBy({
            by: ['userId'],
            where: {
                status: 'JOINED',
                joinedAt: { gte: start, lte: end }
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: limit,
        });

        const userIds = members.map(m => m.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, nickname: true, department: true, avatarUrl: true, activeTitle: true, attendedCount: true, noShowCount: true },
        });

        const userMap = new Map(users.map(u => [u.id, u]));

        const rankings = members.map((m, index) => {
            const rank = index + 1;
            const topTitle = rank <= 10 ? COOL_TITLES[rank - 1] : undefined;
            const dbUser = userMap.get(m.userId);
            const attended = dbUser?.attendedCount ?? 0;
            const noShow = dbUser?.noShowCount ?? 0;
            const total = attended + noShow;

            return {
                rank,
                user: dbUser ? { id: dbUser.id, nickname: dbUser.nickname, avatarUrl: dbUser.avatarUrl, activeTitle: dbUser.activeTitle } : { id: m.userId, nickname: '匿名', avatarUrl: null, activeTitle: null },
                totalJoins: m._count.id,
                attendedCount: attended,
                noShowCount: noShow,
                attendanceRate: total > 0 ? Math.round((attended / total) * 100) : null,
                topTitle,
                activeTitle: dbUser?.activeTitle,
            };
        });

        res.json({ success: true, data: rankings });
    } catch (error) {
        console.error('User leaderboard error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: '排行榜載入失敗' },
        });
    }
});

export default router;
