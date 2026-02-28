import { Router, Request, Response, NextFunction } from 'express';
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
            onboardingCompleted: user.onboardingCompleted,
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
 * 取得個人運動數據 (時數、熱量、圖表、Streak)
 */
router.get('/me/stats', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;

    // 取得所有已加入且時間早於現在的揪團
    const mbs = await prisma.groupMember.findMany({
        where: {
            userId: user.id,
            status: 'JOINED',
            group: { time: { lt: new Date() } }
        },
        include: { group: true },
        orderBy: { group: { time: 'desc' } }
    });

    const now = new Date();
    // 本週一 00:00
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);

    // 本月一日 00:00
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 每種運動的預估消耗大卡 (每小時)
    const kcalPerHour: Record<string, number> = {
        BASKETBALL: 600,
        RUNNING: 500,
        BADMINTON: 450,
        TABLE_TENNIS: 300,
        GYM: 400,
        VOLLEYBALL: 400,
    };

    let weeklyHours = 0;
    let monthlyHours = 0;
    let totalCalories = 0;
    const sportCounts: Record<string, number> = {};

    // 存放本週每天的時數 (0: 星期一, 6: 星期日)
    const weeklyDataArr = new Array(7).fill(0);
    const dayNames = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

    // 收集打卡日期字串用來算 streak
    const dateSet = new Set<string>();

    mbs.forEach(mb => {
        const t = mb.group.time;
        const sport = mb.group.sportType;
        const hours = 2; // 預設一場 2 小時

        // 總熱量
        totalCalories += (kcalPerHour[sport] || 400) * hours;

        // 圓餅圖分佈
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;

        // 紀錄活動日期
        const dateStr = t.toISOString().split('T')[0];
        dateSet.add(dateStr);

        // 週時數與圖表
        if (t >= startOfWeek) {
            weeklyHours += hours;
            const eventDay = t.getDay() || 7;
            weeklyDataArr[eventDay - 1] += hours;
        }

        // 月時數
        if (t >= startOfMonth) {
            monthlyHours += hours;
        }
    });

    // 計算 Streak
    const dates = Array.from(dateSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    if (dates.length > 0) {
        let prevDate = new Date(dates[0]);
        // 檢查昨天或今天是否有運動，決定目前的 streak 斷了沒
        const todayStr = now.toISOString().split('T')[0];
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const isCurrentActive = dates[0] === todayStr || dates[0] === yesterdayStr;

        tempStreak = 1;
        for (let i = 1; i < dates.length; i++) {
            const currDate = new Date(dates[i]);
            const diffTime = Math.abs(prevDate.getTime() - currDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

    // 格式化回傳資料
    const sportDistribution = Object.entries(sportCounts).map(([label, value], id) => ({ id, label, value }));
    const weeklyData = weeklyDataArr.map((hours, index) => ({ day: dayNames[index], hours }));

    res.json({
        success: true,
        data: {
            currentStreak,
            longestStreak,
            weeklyHours,
            monthlyHours,
            totalCalories,
            sportDistribution,
            weeklyData
        }
    });
});

export default router;
