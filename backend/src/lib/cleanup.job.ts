import { prisma } from './prisma.js';
import { createNotification } from './notification.service.js';
import { cleanupLogger, attendanceLogger, reminderLogger } from './logger.js';

/**
 * 清理過期揪團
 * 將時間已過且狀態為 OPEN/FULL 的揪團標記為 COMPLETED
 */
export async function cleanupExpiredGroups(): Promise<number> {
    const now = new Date();

    const result = await prisma.group.updateMany({
        where: {
            time: { lt: now },
            status: { in: ['OPEN', 'FULL'] },
        },
        data: { status: 'COMPLETED' },
    });

    if (result.count > 0) {
        cleanupLogger.info({ count: result.count }, 'Marked expired groups as completed');
    }

    return result.count;
}

/**
 * 自動結算出席紀錄
 * 活動結束超過 24 小時後，將未標記（isAttended=null）的 JOINED 成員自動標記為出席
 * 並更新對應 user 的 attendedCount
 */
export async function autoFinalizeAttendance(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 小時前

    // 找出已完成 / 已逾時、且有未標記出席成員的揪團
    const groups = await prisma.group.findMany({
        where: {
            status: { in: ['COMPLETED', 'CANCELLED'] },
            time: { lt: cutoff },
            members: {
                some: { status: 'JOINED', isAttended: null },
            },
        },
        include: {
            members: {
                where: { status: 'JOINED', isAttended: null },
                select: { id: true, userId: true },
            },
        },
    });

    if (groups.length === 0) return 0;

    let updatedCount = 0;

    for (const group of groups) {
        await prisma.$transaction(async (tx) => {
            // 批次將未標記成員設為出席
            const memberIds = group.members.map(m => m.id);
            await tx.groupMember.updateMany({
                where: { id: { in: memberIds } },
                data: { isAttended: true },
            });

            // 逐一更新 user.attendedCount（同一使用者可能出現在多個揪團）
            const userIds = [...new Set(group.members.map(m => m.userId))];
            for (const userId of userIds) {
                const count = group.members.filter(m => m.userId === userId).length;
                await tx.user.update({
                    where: { id: userId },
                    data: { attendedCount: { increment: count } },
                });
            }

            updatedCount += memberIds.length;
        });
    }

    if (updatedCount > 0) {
        attendanceLogger.info({ updatedCount, groupCount: groups.length }, 'Auto-finalized attendance records');
    }

    return updatedCount;
}

/**
 * 揪團即將開始提醒（30 分鐘前）
 * 檢查即將在 30 分鐘內開始的揪團，發送提醒通知
 */
export async function sendGroupReminders(): Promise<number> {
    const now = new Date();
    const in30min = new Date(now.getTime() + 30 * 60 * 1000);

    // 找出 30 分鐘內即將開始、且尚未發過提醒的揪團
    const upcomingGroups = await prisma.group.findMany({
        where: {
            status: { in: ['OPEN', 'FULL'] },
            time: { gte: now, lte: in30min },
        },
        include: {
            members: {
                where: { status: 'JOINED' },
                select: { userId: true },
            },
        },
    });

    let sentCount = 0;

    for (const group of upcomingGroups) {
        // 用 data 中的 reminderType 欄位來避免重複推送
        // 檢查是否已經發過此揪團的提醒
        const alreadySent = await prisma.notification.findFirst({
            where: {
                type: 'GROUP_REMINDER',
                data: { path: ['groupId'], equals: group.id },
            },
        });
        if (alreadySent) continue;

        for (const member of group.members) {
            await createNotification({
                userId: member.userId,
                type: 'GROUP_REMINDER',
                title: '揪團即將開始！⏰',
                body: `「${group.title}」將在 30 分鐘內開始，地點：${group.location}`,
                data: { groupId: group.id },
            }).catch((err) => reminderLogger.error({ err, groupId: group.id }, 'Notification send failed'));
            sentCount++;
        }
    }

    if (sentCount > 0) {
        reminderLogger.info({ sentCount }, 'Group reminder notifications sent');
    }

    return sentCount;
}

/**
 * 啟動定時清理任務
 * 清理：每 12 小時執行一次
 * 提醒：每 10 分鐘執行一次
 * 出席結算：每 6 小時執行一次
 */
export function startCleanupJob(): void {
    const CLEANUP_INTERVAL = 12 * 60 * 60 * 1000; // 12 小時
    const REMINDER_INTERVAL = 10 * 60 * 1000; // 10 分鐘
    const ATTENDANCE_INTERVAL = 6 * 60 * 60 * 1000; // 6 小時

    cleanupLogger.info('Cleanup job started (every 12h)');
    reminderLogger.info('Reminder job started (every 10min)');
    attendanceLogger.info('Attendance finalization job started (every 6h)');

    // 啟動時先執行一次
    cleanupExpiredGroups().catch(err => cleanupLogger.error({ err }, 'Initial cleanup failed'));
    sendGroupReminders().catch(err => reminderLogger.error({ err }, 'Initial reminders failed'));
    autoFinalizeAttendance().catch(err => attendanceLogger.error({ err }, 'Initial attendance finalization failed'));

    // 每 12 小時執行清理
    setInterval(() => {
        cleanupExpiredGroups().catch(err => cleanupLogger.error({ err }, 'Cleanup failed'));
    }, CLEANUP_INTERVAL);

    // 每 10 分鐘執行提醒
    setInterval(() => {
        sendGroupReminders().catch(err => reminderLogger.error({ err }, 'Reminders failed'));
    }, REMINDER_INTERVAL);

    // 每 6 小時自動結算出席
    setInterval(() => {
        autoFinalizeAttendance().catch(err => attendanceLogger.error({ err }, 'Attendance finalization failed'));
    }, ATTENDANCE_INTERVAL);
}
