import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';
import { getPioneerTitle } from '../utils/pioneer-titles.js';
import { isTrialPeriod } from '../utils/trial-period.js';

const router = Router();

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nickname: true,
                department: true,
                gender: true,
                gradeLabel: true,
                school: true,
                avatarUrl: true,
                planType: true,
                preferences: true,
                attendedCount: true,
                noShowCount: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ success: false, error: { message: '找不到此使用者' } });
            return;
        }

        const pioneerTitle = await getPioneerTitle(user.id);

        res.json({
            success: true,
            data: {
                ...user,
                planType: isTrialPeriod() ? 'PLUS' : user.planType,
                pioneerTitle,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.put('/me/avatar', firebaseAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user!;
        const googleAvatarUrl = req.firebaseUser?.picture || null;

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: googleAvatarUrl },
        });

        res.json({
            success: true,
            data: {
                id: updated.id,
                avatarUrl: updated.avatarUrl,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
