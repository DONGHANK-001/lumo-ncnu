import { prisma } from './prisma.js';
import { sendReminderEmail } from './mailer.js';

/**
 * 建立通知（寫入 DB）
 */
export async function createNotification(params: {
    userId: string;
    type: string;
    title: string;
    body: string;
    link?: string;
}) {
    return prisma.notification.create({
        data: {
            userId: params.userId,
            type: params.type,
            title: params.title,
            body: params.body,
            link: params.link,
        },
    });
}

/**
 * 檢查即將開始的揪團，發送提醒通知
 * - 活動前 1 小時發送提醒
 * - 只通知尚未收到提醒的成員
 */
async function sendUpcomingReminders() {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const thirtyMinLater = new Date(now.getTime() + 30 * 60 * 1000);

    // 找出 30 分鐘 ~ 1 小時後開始的揪團
    const upcomingGroups = await prisma.group.findMany({
        where: {
            time: {
                gte: thirtyMinLater,
                lte: oneHourLater,
            },
            status: { in: ['OPEN', 'FULL'] },
        },
        include: {
            members: {
                where: { status: 'JOINED' },
                include: {
                    user: { select: { id: true, email: true, nickname: true } },
                },
            },
        },
    });

    let notifCount = 0;

    for (const group of upcomingGroups) {
        const timeStr = new Date(group.time).toLocaleString('zh-TW', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        for (const member of group.members) {
            // 檢查是否已經發過這個揪團的提醒
            const existing = await prisma.notification.findFirst({
                where: {
                    userId: member.user.id,
                    type: 'REMINDER',
                    link: `/groups/${group.id}`,
                },
            });

            if (existing) continue;

            // 建立通知
            await createNotification({
                userId: member.user.id,
                type: 'REMINDER',
                title: `⏰ 揪團即將開始！`,
                body: `「${group.title}」將在 ${timeStr} 於 ${group.location} 開始，記得準時到場！`,
                link: `/groups/${group.id}`,
            });

            // 發送 Email 提醒
            sendReminderEmail({
                toEmail: member.user.email,
                userName: member.user.nickname || '同學',
                groupTitle: group.title,
                time: timeStr,
                location: group.location,
                groupId: group.id,
            }).catch(console.error);

            notifCount++;
        }
    }

    if (notifCount > 0) {
        console.log(`[Reminder] 已發送 ${notifCount} 則揪團提醒通知`);
    }
}

/**
 * 啟動提醒排程任務
 * 每 10 分鐘檢查一次是否有即將開始的揪團
 */
export function startReminderJob(): void {
    const INTERVAL_MS = 10 * 60 * 1000; // 10 分鐘

    console.log('[Reminder] 活動提醒排程已啟動 (每 10 分鐘檢查)');

    // 啟動時先執行一次
    sendUpcomingReminders().catch(console.error);

    setInterval(() => {
        sendUpcomingReminders().catch(console.error);
    }, INTERVAL_MS);
}
