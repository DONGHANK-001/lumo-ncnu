import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const router = Router();

// 純運動 & 社交活動常數
const PURE_SPORTS = ['BASKETBALL', 'RUNNING', 'BADMINTON', 'TABLE_TENNIS', 'GYM', 'VOLLEYBALL', 'TENNIS'] as const;
const SOCIAL_ACTIVITIES = ['NIGHT_WALK', 'DINING', 'STUDY'] as const;
const ALL_ACTIVITY_TYPES = [...PURE_SPORTS, ...SOCIAL_ACTIVITIES] as const;

// ===== 讀家回憶活動 4/7~4/17 =====
type EventState = 'normal' | 'study_only' | 'frozen';

const getEventState = (): EventState => {
    const now = new Date();
    const eventStart  = new Date('2026-04-07T00:00:00+08:00');
    const freezeStart = new Date('2026-04-17T12:00:00+08:00');
    const freezeEnd   = new Date('2026-04-17T13:00:00+08:00');

    if (now >= freezeStart && now < freezeEnd) return 'frozen';
    if (now >= eventStart && now < freezeStart) return 'study_only';
    return 'normal';
};

// 取得結算時間 (預設每月，第一個月由 2026-03-02 起算)
const getMonthDateRange = (period: 'current' | 'last_month' = 'current') => {
    const now = new Date();
    let start, end;

    if (period === 'current') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        if (now.getFullYear() === 2026 && now.getMonth() === 2) {
            start = new Date('2026-03-02T00:00:00+08:00');
        }
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (now.getFullYear() === 2026 && now.getMonth() === 3) {
            start = new Date('2026-03-02T00:00:00+08:00');
        }
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }
    return { start, end };
};

// 系所之光稱號對照
const DEPT_GLORY_LABELS = ['🌟 之光', '✨ 之光', '💫 之光'];

/**
 * GET /leaderboard/departments
 * 系所排行榜 — 只計算純運動（排除社交活動）
 */
router.get('/departments', async (req: Request, res: Response) => {
    try {
        const eventState = getEventState();
        const period = (req.query.period as string) || 'current';
        const { start, end } = getMonthDateRange(period as 'current' | 'last_month');

        // 活動期間或凍結期間只計算 STUDY
        const studyOnly = eventState === 'study_only' || eventState === 'frozen';
        const resultLimit = eventState === 'frozen' ? 3 : 20;

        // 正常時期只計算純運動，活動時期只計算 STUDY
        const sportFilter = studyOnly
            ? Prisma.sql`AND g."sportType" = 'STUDY'`
            : Prisma.sql`AND g."sportType" IN (${Prisma.join([...PURE_SPORTS])})`;

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
              ${sportFilter}
            GROUP BY u."department"
            ORDER BY total_joins DESC
            LIMIT ${resultLimit}
        `;

        const departments = results.map((r, index) => ({
            rank: index + 1,
            department: r.department,
            totalJoins: Number(r.total_joins),
            uniqueUsers: Number(r.unique_users),
            topSport: r.top_sport,
            // 前 3 名附加系所之光稱號
            ...(index < 3 && { gloryTitle: `${r.department}${DEPT_GLORY_LABELS[index]}` }),
        }));

        res.json({
            success: true,
            data: {
                period,
                departments,
                eventState,
                ...(eventState === 'frozen' && {
                    frozen: true,
                    message: '📚 讀家回憶活動結算中！以下是前三名，13:00 恢復完整排行榜',
                }),
                ...(eventState === 'study_only' && {
                    message: '📚 4/7~4/17 讀家回憶活動期間 — 排行榜僅計算讀家回憶揪團！',
                }),
            },
        });
    } catch (error) {
        req.log.error({ err: error }, 'Leaderboard error');
        try {
            const members = await prisma.groupMember.findMany({
                where: { status: 'JOINED' },
                include: {
                    user: { select: { department: true } },
                    group: { select: { sportType: true } }
                },
            });

            const pureSportsSet = new Set<string>(PURE_SPORTS);
            const deptMap = new Map<string, { joins: number; users: Set<string>; sports: Record<string, number> }>();
            for (const m of members) {
                const dept = (m as any).user?.department;
                const sport = (m as any).group?.sportType;
                if (!dept || !sport || !pureSportsSet.has(sport)) continue;

                if (!deptMap.has(dept)) deptMap.set(dept, { joins: 0, users: new Set(), sports: {} });
                const entry = deptMap.get(dept)!;
                entry.joins++;
                entry.users.add(m.userId);
                entry.sports[sport] = (entry.sports[sport] || 0) + 1;
            }

            const departments = Array.from(deptMap.entries())
                .map(([dept, data], index) => {
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
            req.log.error({ err: fallbackError }, 'Leaderboard fallback error');
            res.status(500).json({
                success: false,
                error: { code: 'SERVER_ERROR', message: '排行榜載入失敗' },
            });
        }
    }
});

/**
 * GET /leaderboard/by-activity?type=BASKETBALL
 * 個別運動/社交活動排行榜（公開，無需登入）
 */
router.get('/by-activity', async (req: Request, res: Response) => {
    try {
        const sportType = req.query.type as string;
        if (!sportType || !ALL_ACTIVITY_TYPES.includes(sportType as any)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_TYPE', message: '無效的活動類型' },
            });
        }

        const eventState = getEventState();
        const limit = eventState === 'frozen' ? 3 : 20;
        const { start, end } = getMonthDateRange('current');

        const members = await prisma.$queryRaw<{ userId: string; cnt: bigint }[]>`
            SELECT gm."userId", COUNT(*)::bigint as cnt
            FROM group_members gm
            JOIN groups g ON g.id = gm."groupId"
            WHERE gm.status = 'JOINED'
              AND gm."joinedAt" >= ${start}
              AND gm."joinedAt" <= ${end}
              AND g."sportType" = ${sportType}
            GROUP BY gm."userId"
            ORDER BY cnt DESC
            LIMIT ${limit}
        `;

        const userIds = members.map(m => m.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, nickname: true, department: true, avatarUrl: true, activeTitle: true },
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        // 活動稱號 key 前綴
        const isSocial = (SOCIAL_ACTIVITIES as readonly string[]).includes(sportType);
        const prefix = isSocial ? 'social' : 'sport';

        const rankings = members.map((m, index) => {
            const rank = index + 1;
            const dbUser = userMap.get(m.userId);
            const activityTitle = rank <= 3
                ? `${prefix}_${sportType.toLowerCase()}_${rank}`
                : undefined;

            return {
                rank,
                user: dbUser
                    ? { id: dbUser.id, nickname: dbUser.nickname, avatarUrl: dbUser.avatarUrl, department: dbUser.department, activeTitle: dbUser.activeTitle }
                    : { id: m.userId, nickname: '匿名', avatarUrl: null, department: null, activeTitle: null },
                totalJoins: Number(m.cnt),
                activityTitle,
            };
        });

        res.json({
            success: true,
            data: rankings,
            sportType,
            eventState,
        });
    } catch (error) {
        req.log.error({ err: error }, 'Activity leaderboard error');
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: '排行榜載入失敗' },
        });
    }
});

export default router;
