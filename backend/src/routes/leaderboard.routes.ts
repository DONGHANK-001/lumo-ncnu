import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * GET /leaderboard/departments
 * 系所排行榜 — 本週或總計揪團參與次數
 */
router.get('/departments', async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || 'weekly';

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
              AND u."department" IS NOT NULL
              AND u."department" != ''
              ${period === 'weekly' ? prisma.$queryRaw`AND gm."joinedAt" >= date_trunc('week', NOW())` : prisma.$queryRaw``}
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
router.get('/users', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.top as string) || 10;

        const members = await prisma.groupMember.groupBy({
            by: ['userId'],
            where: { status: 'JOINED' },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: limit,
        });

        const userIds = members.map(m => m.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, nickname: true, department: true },
        });

        const userMap = new Map(users.map(u => [u.id, u]));

        const rankings = members.map((m, index) => ({
            rank: index + 1,
            user: userMap.get(m.userId) || { id: m.userId, nickname: '匿名' },
            totalJoins: m._count.id,
        }));

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
