import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';
import { validateBody } from '../middleware/validation.js';
import { updateProfileSchema } from '../types/schemas.js';
import { getPioneerTitle, getUserTitles } from '../utils/pioneer-titles.js';

const router = Router();

// 所有路由都需要認證

/**
 * GET /me
 * 取得當前使用者資料
 */
router.get('/me', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;

    const pioneerTitle = await getPioneerTitle(user.id);

    res.json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            realName: user.realName,
            studentId: user.studentId,
            department: user.department,
            school: user.school,
            role: user.role,
            planType: user.planType,
            preferences: user.preferences,
            attendedCount: user.attendedCount,
            noShowCount: user.noShowCount,
            disclaimerAccepted: user.disclaimerAccepted,
            disclaimerAcceptedAt: user.disclaimerAcceptedAt,
            onboardingCompleted: user.onboardingCompleted,
            createdAt: user.createdAt,
            avatarUrl: user.avatarUrl,
            pioneerTitle,
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
                avatarUrl: updated.avatarUrl,
            },
        });
    }
);

/**
 * POST /onboarding
 * 新用戶引導流程完成
 */
router.post(
    '/onboarding',
    firebaseAuthMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user!;
            const { realName, studentId, department, disclaimerAccepted } = req.body;

            if (!realName || !studentId || !department || !disclaimerAccepted) {
                res.status(400).json({
                    success: false,
                    error: { code: 'MISSING_FIELDS', message: '請填寫所有必填欄位' },
                });
                return;
            }

            const updated = await prisma.user.update({
                where: { id: user.id },
                data: {
                    realName,
                    studentId,
                    department,
                    disclaimerAccepted: true,
                    disclaimerAcceptedAt: new Date(),
                    onboardingCompleted: true,
                },
            });

            res.json({
                success: true,
                data: {
                    id: updated.id,
                    onboardingCompleted: updated.onboardingCompleted,
                },
            });
        } catch (error) {
            next(error);
        }
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

/**
 * GET /me/stats
 * 取得個人運動數據 (熱量、圖表、Streak)
 */
router.get('/me/stats', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    const now = new Date();

    // 1. 處理簽到 (Check-in) 邏輯
    // 先把今天的簽到記錄寫入 (upsert)
    const today = new Date(now);
    today.setHours(0, 0, 0, 0); // 取今天的凌晨 0點0分0秒 作為純日期

    await prisma.userCheckIn.upsert({
        where: {
            userId_date: {
                userId: user.id,
                date: today
            }
        },
        update: {},
        create: {
            userId: user.id,
            date: today
        }
    });

    // 取得使用者所有的簽到紀錄來計算 streak
    const checkIns = await prisma.userCheckIn.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        select: { date: true }
    });

    const dates = checkIns.map(c => c.date.toISOString().split('T')[0]);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    if (dates.length > 0) {
        let prevDate = new Date(dates[0]);
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const isCurrentActive = dates[0] === todayStr || dates[0] === yesterdayStr;

        tempStreak = 1;
        for (let i = 1; i < dates.length; i++) {
            const currDate = new Date(dates[i]);
            const diffTime = Math.abs(prevDate.getTime() - currDate.getTime());
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
            } else {
                if (tempStreak > longestStreak) longestStreak = tempStreak;
                if (i === 1 && isCurrentActive) currentStreak = tempStreak;
                tempStreak = 1;
            }
            prevDate = currDate;
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        // 如果迴圈跑完還是目前活躍
        if (isCurrentActive && currentStreak === 0) currentStreak = tempStreak;
        // 邊界：只有一天
        if (dates.length === 1 && isCurrentActive) currentStreak = 1;
    }

    // 2. 處理運動分布與熱量 (依然看有參加的揪團)
    // 取得所有已加入且時間早於現在的揪團
    const mbs = await prisma.groupMember.findMany({
        where: {
            userId: user.id,
            status: 'JOINED',
            group: { time: { lt: now } }
        },
        include: { group: true }
    });

    // 每種運動的預估消耗大卡 (每場預設 2 小時算)
    const kcalPerEvent: Record<string, number> = {
        BASKETBALL: 1200,
        RUNNING: 1000,
        BADMINTON: 900,
        TABLE_TENNIS: 600,
        GYM: 800,
        VOLLEYBALL: 800,
    };

    let totalCalories = 0;
    const sportCounts: Record<string, number> = {};

    mbs.forEach(mb => {
        const sport = mb.group.sportType;
        totalCalories += (kcalPerEvent[sport] || 800);
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
    });

    // 格式化回傳資料
    const sportDistribution = Object.entries(sportCounts).map(([label, value], id) => ({ id, label, value }));

    res.json({
        success: true,
        data: {
            currentStreak,
            longestStreak,
            totalCalories,
            sportDistribution,
        }
    });
});

/**
 * GET /me/titles
 * 取得使用者已擁有的所有稱號
 */
router.get('/me/titles', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const titles = await getUserTitles(user.id);
        const rows = await prisma.$queryRaw<{ activeTitle: string | null }[]>`
            SELECT "activeTitle" FROM users WHERE id = ${user.id} LIMIT 1
        `;
        const activeTitle = rows[0]?.activeTitle || (titles.length > 0 ? titles[0].key : null);
        res.json({ success: true, data: { titles, activeTitle } });
    } catch (error) {
        console.error('Titles error:', error);
        res.status(500).json({ success: false, error: { message: '稱號載入失敗' } });
    }
});

/**
 * PUT /me/title
 * 設定使用者展示的稱號
 */
router.put('/me/title', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const { titleKey } = req.body;

        if (!titleKey || typeof titleKey !== 'string') {
            res.status(400).json({ success: false, error: { message: '請選擇一個稱號' } });
            return;
        }

        // 確認此稱號使用者是否有資格使用
        const titles = await getUserTitles(user.id);
        const valid = titles.find(t => t.key === titleKey);
        if (!valid) {
            res.status(403).json({ success: false, error: { message: '您尚未獲得此稱號' } });
            return;
        }

        await prisma.$executeRaw`
            UPDATE users SET "activeTitle" = ${titleKey} WHERE id = ${user.id}
        `;

        res.json({ success: true, data: { activeTitle: titleKey, title: valid } });
    } catch (error) {
        console.error('Set title error:', error);
        res.status(500).json({ success: false, error: { message: '稱號設定失敗' } });
    }
});

export default router;
