import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';
import { validateBody } from '../middleware/validation.js';
import { updateProfileSchema } from '../types/schemas.js';

const router = Router();

// 所有路由都需要認證

/**
 * GET /me
 * 取得當前使用者資料
 */
router.get('/me', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;

    res.json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            school: user.school,
            role: user.role,
            planType: user.planType,
            preferences: user.preferences,
            createdAt: user.createdAt,
        },
    });
});

/**
 * POST /profile
 * 更新使用者個人檔案
 */
router.post(
    '/profile',
    firebaseAuthMiddleware,
    validateBody(updateProfileSchema),
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { nickname, preferences } = req.body;

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                ...(nickname !== undefined && { nickname }),
                ...(preferences !== undefined && { preferences }),
            },
        });

        res.json({
            success: true,
            data: {
                id: updated.id,
                email: updated.email,
                nickname: updated.nickname,
                preferences: updated.preferences,
                planType: updated.planType,
            },
        });
    }
);

/**
 * POST /plan/upgrade
 * 模擬升級為 PLUS（第一版不串金流）
 */
router.post('/plan/upgrade', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;

    // 如果已經是 PLUS，直接回傳
    if (user.planType === 'PLUS') {
        res.json({
            success: true,
            data: { planType: 'PLUS', message: '您已經是 PLUS 會員' },
        });
        return;
    }

    // 模擬升級：更新 planType 並建立訂閱記錄
    const [updated] = await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: { planType: 'PLUS' },
        }),
        prisma.plusSubscription.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                status: 'ACTIVE',
                planPrice: 20,
            },
            update: {
                status: 'ACTIVE',
                startAt: new Date(),
            },
        }),
    ]);

    res.json({
        success: true,
        data: {
            planType: updated.planType,
            message: '升級成功！您現在是 PLUS 會員',
        },
    });
});

export default router;
