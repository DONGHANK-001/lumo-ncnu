import { prisma } from '../lib/prisma.js';

/** 計算連續活躍天數 (使用台灣時間 UTC+8) */
export function calculateStreak(dates: string[], now: Date): number {
    if (dates.length === 0) return 0;

    // 換算為台灣時間
    const taiwanNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const todayStr = taiwanNow.toISOString().split('T')[0];
    const yesterdayDate = new Date(new Date(todayStr + 'T00:00:00Z').getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
    const isCurrentActive = dates[0] === todayStr || dates[0] === yesterdayStr;

    let tempStreak = 1;
    for (let i = 1; i < dates.length; i++) {
        const d1 = new Date(dates[i - 1] + 'T00:00:00Z');
        const d2 = new Date(dates[i] + 'T00:00:00Z');
        const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) tempStreak++;
        else break;
    }

    return isCurrentActive ? tempStreak : 0;
}

/** 計算揪團額度上限 */
export function calculateQuotaLimit(hostedThisWeek: number, joinedThisWeek: number, currentStreak: number): number {
    return 4 + Math.floor(hostedThisWeek / 2) + Math.floor(joinedThisWeek / 2) + Math.floor(currentStreak / 2);
}

/** 查詢使用者本週的揪團統計數據 */
export async function getUserWeeklyStats(userId: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);

    const [hostedThisWeek, joinedThisWeek, mbs] = await Promise.all([
        prisma.group.count({
            where: { createdById: userId, createdAt: { gte: startOfWeek } }
        }),
        prisma.groupMember.count({
            where: {
                userId,
                status: 'JOINED',
                joinedAt: { gte: startOfWeek },
                group: { createdById: { not: userId } }
            }
        }),
        prisma.groupMember.findMany({
            where: { userId, status: 'JOINED', group: { time: { lt: now } } },
            include: { group: { select: { time: true } } },
            orderBy: { group: { time: 'desc' } }
        })
    ]);

    const dateSet = new Set<string>();
    mbs.forEach(mb => dateSet.add(mb.group.time.toISOString().split('T')[0]));
    const dates = Array.from(dateSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const currentStreak = calculateStreak(dates, now);

    return { hostedThisWeek, joinedThisWeek, currentStreak };
}
