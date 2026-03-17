import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';

const router = Router();

/**
 * GET /notifications
 * 取得目前使用者的通知列表
 */
router.get('/', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.notification.count({ where: { userId: user.id } }),
        prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    res.json({
        success: true,
        data: {
            notifications,
            unreadCount,
            pagination: { page, pageSize, total, hasMore: page * pageSize < total },
        },
    });
});

/**
 * GET /notifications/unread-count
 * 快速取得未讀通知數量（輕量 API，給 Navbar 輪詢用）
 */
router.get('/unread-count', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    const count = await prisma.notification.count({
        where: { userId: user.id, isRead: false },
    });
    res.json({ success: true, data: { unreadCount: count } });
});

/**
 * PUT /notifications/:id/read
 * 標記單則通知為已讀
 */
router.put('/:id/read', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;

    await prisma.notification.updateMany({
        where: { id, userId: user.id },
        data: { isRead: true },
    });

    res.json({ success: true });
});

/**
 * PUT /notifications/read-all
 * 全部標記已讀
 */
router.put('/read-all', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;

    await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
    });

    res.json({ success: true });
});

export default router;
