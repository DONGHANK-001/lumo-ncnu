import { prisma } from './prisma.js';
import { getIO } from '../socket.js';
import { NotificationType, Prisma } from '@prisma/client';
import { notificationLogger } from './logger.js';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

/**
 * 建立通知並透過 Socket.io 即時推送
 */
export async function createNotification({ userId, type, title, body, data }: CreateNotificationParams) {
    const notification = await prisma.notification.create({
        data: {
            userId,
            type,
            title,
            body,
            data: data ? (data as Prisma.InputJsonValue) : undefined,
        },
    });

    // Socket.io 即時推送到使用者專屬 room
    try {
        getIO().to(`user:${userId}`).emit('notification', notification);
    } catch (err) {
        notificationLogger.error({ err, userId }, 'Socket.io emit failed');
    }

    return notification;
}

/**
 * 通知揪團所有成員（排除特定使用者，通常是觸發者自己）
 */
export async function notifyGroupMembers(
    groupId: string,
    excludeUserId: string,
    params: Omit<CreateNotificationParams, 'userId'>
) {
    const members = await prisma.groupMember.findMany({
        where: { groupId, status: 'JOINED', userId: { not: excludeUserId } },
        select: { userId: true },
    });

    await Promise.allSettled(
        members.map((m) => createNotification({ ...params, userId: m.userId }))
    );
}
