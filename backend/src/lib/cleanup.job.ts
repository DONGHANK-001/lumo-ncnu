import { prisma } from './prisma.js';
import { createNotification } from './notification.service.js';
import { cleanupLogger, reminderLogger } from './logger.js';

/**
 * 清理過期揪團
 * 將時間已過且狀態為 OPEN/FULL 的揪團標記為 COMPLETED
 * 同時自動標記所有已加入成員為「出席」並更新 attendedCount
 */
export async function cleanupExpiredGroups(): Promise<number> {
    const now = new Date();

    // 先找出即將被標記為 COMPLETED 的揪團（含成員）
    const expiredGroups = await prisma.group.findMany({
        where: {
            time: { lt: now },
            status: { in: ['OPEN', 'FULL'] },
        },
        include: {
            members: {
                where: { status: 'JOINED', isAttended: null },
                select: { id: true, userId: true },
            },
        },
    });

    if (expiredGroups.length === 0) return 0;

    await prisma.$transaction(async (tx) => {
        // 1. 標記揪團為 COMPLETED
        await tx.group.updateMany({
            where: {
                id: { in: expiredGroups.map(g => g.id) },
            },
            data: { status: 'COMPLETED' },
        });

        // 2. 自動標記所有 JOINED 且尚未記錄的成員為出席
        const allMemberIds = expiredGroups.flatMap(g => g.members.map(m => m.id));
        if (allMemberIds.length > 0) {
            await tx.groupMember.updateMany({
                where: { id: { in: allMemberIds } },
                data: { isAttended: true },
            });

            // 3. 每位使用者的 attendedCount +1（可能參與多個揪團）
            const userIdCounts = new Map<string, number>();
            for (const group of expiredGroups) {
                for (const member of group.members) {
                    userIdCounts.set(member.userId, (userIdCounts.get(member.userId) || 0) + 1);
                }
            }
            for (const [userId, count] of userIdCounts) {
                await tx.user.update({
                    where: { id: userId },
                    data: { attendedCount: { increment: count } },
                });
            }
        }
    });

    cleanupLogger.info({ count: expiredGroups.length }, 'Marked expired groups as completed with auto-attendance');

    return expiredGroups.length;
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
 * 清理超過 3 天的通知
 */
export async function cleanupOldNotifications(): Promise<number> {
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 天前

    const result = await prisma.notification.deleteMany({
        where: { createdAt: { lt: cutoff } },
    });

    if (result.count > 0) {
        cleanupLogger.info({ count: result.count }, 'Deleted old notifications (>3 days)');
    }

    return result.count;
}

/**
 * 啟動定時清理任務
 * 清理：每 12 小時執行一次
 * 提醒：每 10 分鐘執行一次
 * 出席結算：每 6 小時執行一次
 * 通知清理：每 12 小時執行一次
 */
export function startCleanupJob(): void {
    const CLEANUP_INTERVAL = 12 * 60 * 60 * 1000; // 12 小時
    const REMINDER_INTERVAL = 10 * 60 * 1000; // 10 分鐘

    cleanupLogger.info('Cleanup job started (every 12h)');
    reminderLogger.info('Reminder job started (every 10min)');
    cleanupLogger.info('Notification cleanup job started (every 12h)');

    // 啟動時先執行一次
    cleanupExpiredGroups().catch(err => cleanupLogger.error({ err }, 'Initial cleanup failed'));
    sendGroupReminders().catch(err => reminderLogger.error({ err }, 'Initial reminders failed'));
    cleanupOldNotifications().catch(err => cleanupLogger.error({ err }, 'Initial notification cleanup failed'));

    // 每 12 小時執行清理
    setInterval(() => {
        cleanupExpiredGroups().catch(err => cleanupLogger.error({ err }, 'Cleanup failed'));
    }, CLEANUP_INTERVAL);

    // 每 10 分鐘執行提醒
    setInterval(() => {
        sendGroupReminders().catch(err => reminderLogger.error({ err }, 'Reminders failed'));
    }, REMINDER_INTERVAL);

    // 每 12 小時清理舊通知
    setInterval(() => {
        cleanupOldNotifications().catch(err => cleanupLogger.error({ err }, 'Notification cleanup failed'));
    }, CLEANUP_INTERVAL);
}
