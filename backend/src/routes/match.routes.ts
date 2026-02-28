import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';

const router = Router();

/**
 * GET /match/partners
 * 尋找合適夥伴 (不含自己)
 */
router.get('/partners', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;

    // 取得當前使用者偏好與設定
    const mySports = user.preferences && typeof user.preferences === 'object' && Array.isArray((user.preferences as any).sports)
        ? (user.preferences as any).sports as string[]
        : [];

    const myLocations = user.preferences && typeof user.preferences === 'object' && Array.isArray((user.preferences as any).usualLocations)
        ? (user.preferences as any).usualLocations as string[]
        : [];

    const myTimes = user.preferences && typeof user.preferences === 'object' && Array.isArray((user.preferences as any).availableTimes)
        ? (user.preferences as any).availableTimes as string[]
        : [];

    let partnersQuery: any = {
        where: {
            id: { not: user.id }, // 不要配對到自己
            // 以下條件非常開放，只要有任何一項中就列出（或者在應用層排序）
        },
        select: {
            id: true,
            nickname: true,
            email: true,
            attendedCount: true,
            noShowCount: true,
            badges: true,     // 目前我們 badges 不在 User 表裡面，不過前端通常只需要信譽
            preferences: true,
            // 如果要更聰明，後勤可以算互通點數
        },
        take: 30, // 暫定最多拿 30 個活躍的使用者出來推薦
        orderBy: {
            attendedCount: 'desc' // 優先推薦高出席率的
        }
    };

    const users = await prisma.user.findMany(partnersQuery);

    // 我們在 Node 端進行比對計分，比較好處理 JSON 邏輯
    const scoredUsers = users.map((u) => {
        let score = 0;
        let matchedTags: string[] = [];

        const otherPrefs = u.preferences as any || {};
        const otherSports = Array.isArray(otherPrefs.sports) ? otherPrefs.sports : [];
        const otherLocations = Array.isArray(otherPrefs.usualLocations) ? otherPrefs.usualLocations : [];
        const otherTimes = Array.isArray(otherPrefs.availableTimes) ? otherPrefs.availableTimes : [];

        // 比對運動
        mySports.forEach(s => {
            if (otherSports.includes(s)) {
                score += 3;
                matchedTags.push(`愛打${s === 'BASKETBALL' ? '籃球' : s === 'BADMINTON' ? '羽球' : s === 'VOLLEYBALL' ? '排球' : s}`);
            }
        });

        // 比對地點
        myLocations.forEach(loc => {
            if (otherLocations.includes(loc)) {
                score += 2;
                matchedTags.push(`常去${loc}`);
            }
        });

        // 比對時間
        myTimes.forEach(t => {
            if (otherTimes.includes(t)) {
                score += 1;
                matchedTags.push(`${t}活躍`);
            }
        });

        // 取前 3 個標籤就好，避免版面太雜
        matchedTags = [...new Set(matchedTags)].slice(0, 3);

        return {
            id: u.id,
            nickname: u.nickname || u.email.split('@')[0],
            attendedCount: u.attendedCount,
            noShowCount: u.noShowCount,
            matchedTags,
            score
        };
    });

    // 只回傳分數 > 0 的人，並由高到低排序，如果都沒有，回報基礎活躍清單也可以
    let recommended = scoredUsers.filter(u => u.score > 0).sort((a, b) => b.score - a.score);
    if (recommended.length === 0) {
        // 退而求其次，顯示最常出席球局的活躍使用者
        recommended = scoredUsers.sort((a, b) => b.attendedCount - a.attendedCount).slice(0, 10);
    }

    res.json({
        success: true,
        data: recommended.slice(0, 15) // 最多呈現 15 位
    });
});

export default router;
