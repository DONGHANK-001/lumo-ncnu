import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';

const router = Router();

// 所有通知路由都需要登入
router.use(firebaseAuthMiddleware);

/**
 * GET /notifications
 * 取得通知列表（分頁）
 */
router.get('/', async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const [items, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
        success: true,
        data: { items, total, unreadCount, page, pageSize },
    });
});

/**
 * GET /notifications/unread-count
 * 取得未讀通知數量（輕量查詢，給前端 badge 用）
 */
router.get('/unread-count', async (req: Request, res: Response) => {
    const count = await prisma.notification.count({
        where: { userId: req.user!.id, isRead: false },
    });
    res.json({ success: true, data: { count } });
});

/**
 * PUT /notifications/:id/read
 * 標記單則通知為已讀
 */
router.put('/:id/read', async (req: Request, res: Response) => {
    await prisma.notification.updateMany({
        where: { id: req.params.id, userId: req.user!.id },
        data: { isRead: true },
    });
    res.json({ success: true, data: { message: '已讀' } });
});

/**
 * PUT /notifications/read-all
 * 全部標記為已讀
 */
router.put('/read-all', async (req: Request, res: Response) => {
    await prisma.notification.updateMany({
        where: { userId: req.user!.id, isRead: false },
        data: { isRead: true },
    });
    res.json({ success: true, data: { message: '全部已讀' } });
});

/**
 * DELETE /notifications/read
 * 刪除所有已讀通知
 */
router.delete('/read', async (req: Request, res: Response) => {
    const deleted = await prisma.notification.deleteMany({
        where: { userId: req.user!.id, isRead: true },
    });
    res.json({ success: true, data: { deletedCount: deleted.count } });
});

export default router;
