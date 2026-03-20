import { prisma } from '../lib/prisma.js';

/** 計算連續活躍天數 */
export function calculateStreak(dates: string[], now: Date): number {
    if (dates.length === 0) return 0;

    let currentStreak = 0;
    let prevDate = new Date(dates[0]);
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const isCurrentActive = dates[0] === todayStr || dates[0] === yesterdayStr;

    let tempStreak = 1;
    for (let i = 1; i < dates.length; i++) {
        const currDate = new Date(dates[i]);
        const diffTime = Math.abs(prevDate.getTime() - currDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) tempStreak++;
        else {
            if (i === 1 && isCurrentActive) currentStreak = tempStreak;
            break;
        }
        prevDate = currDate;
    }
    if (isCurrentActive && currentStreak === 0) currentStreak = tempStreak;
    if (dates.length === 1 && isCurrentActive) currentStreak = 1;

    return currentStreak;
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
