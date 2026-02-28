import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';

const router = Router();

/**
 * GET /users/:id
 * 取得指定使用者的公開個人檔案
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nickname: true,
                department: true,
                school: true,
                avatarUrl: true,
                planType: true,
                preferences: true,
                attendedCount: true,
                noShowCount: true,
                createdAt: true,
                // Do not select sensitive data like email, firebaseUid, studentId, realName
            }
        });

        if (!user) {
            res.status(404).json({ success: false, error: { message: '找不到此使用者' } });
            return;
        }

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /users/me/avatar
 * 更新自己的頭像 URL (使用 DiceBear 或其他線上圖片)
 */
router.put('/me/avatar', firebaseAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user!;
        const { avatarUrl } = req.body;

        if (typeof avatarUrl !== 'string') {
            res.status(400).json({ success: false, error: { message: '無效的頭像網址' } });
            return;
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl },
        });

        res.json({
            success: true,
            data: {
                id: updated.id,
                avatarUrl: updated.avatarUrl
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
