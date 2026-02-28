import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';
import { validateBody } from '../middleware/validation.js';
import { createFeedbackSchema } from '../types/schemas.js';

const router = Router();

/**
 * POST /feedback
 * 提交意見回饋
 */
router.post(
    '/',
    firebaseAuthMiddleware,
    validateBody(createFeedbackSchema),
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { content } = req.body;

        const feedback = await prisma.feedback.create({
            data: {
                userId: user.id,
                content,
            },
        });

        res.status(201).json({
            success: true,
            data: feedback,
        });
    }
);

/**
 * GET /feedback
 * 取得所有回饋 (限管理員)
 */
router.get('/', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: { message: 'Forbiden: Admins only' } });
        return;
    }

    const feedbacks = await prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { id: true, nickname: true, email: true }
            }
        }
    });

    res.json({
        success: true,
        data: feedbacks,
    });
});

export default router;
