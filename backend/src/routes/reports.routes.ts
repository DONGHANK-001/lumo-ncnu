import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';
import { validateBody } from '../middleware/validation.js';
import { createReportSchema } from '../types/schemas.js';

const router = Router();

/**
 * POST /reports
 * 送出檢舉
 */
router.post(
    '/',
    firebaseAuthMiddleware,
    validateBody(createReportSchema),
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { targetType, targetId, reason, details } = req.body;

        // 驗證 target 存在
        if (targetType === 'USER') {
            const target = await prisma.user.findUnique({ where: { id: targetId } });
            if (!target) {
                res.status(404).json({
                    success: false,
                    error: { code: 'USER_NOT_FOUND', message: '找不到被檢舉的使用者' },
                });
                return;
            }
        } else if (targetType === 'GROUP') {
            const target = await prisma.group.findUnique({ where: { id: targetId } });
            if (!target) {
                res.status(404).json({
                    success: false,
                    error: { code: 'GROUP_NOT_FOUND', message: '找不到被檢舉的揪團' },
                });
                return;
            }
        }

        const report = await prisma.report.create({
            data: {
                reporterId: user.id,
                targetType,
                targetId,
                reason,
                details,
            },
        });

        res.status(201).json({
            success: true,
            data: {
                id: report.id,
                message: '檢舉已送出，我們會盡快處理',
            },
        });
    }
);

/**
 * GET /safety
 * 取得安全規範版本（可選）
 */
router.get('/safety', (_req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            version: '1.0.0',
            rules: [
                '請在公共場所進行運動活動',
                '首次見面建議選擇人多的場地',
                '告知親友您的活動時間與地點',
                '遵守場地使用規則與禮儀',
                '尊重每位參與者的程度差異',
                '如遇不當行為請立即離開並檢舉',
                '請勿進行金錢交易或借貸',
                '保護個人隱私資訊',
            ],
        },
    });
});

export default router;
