import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';

const router = Router();

const SPORT_LABELS: Record<string, string> = {
    BASKETBALL: '籃球',
    RUNNING: '跑步',
    BADMINTON: '羽球',
    TABLE_TENNIS: '桌球',
    GYM: '健身',
    VOLLEYBALL: '排球',
    TENNIS: '網球',
    NIGHT_WALK: '夜走',
    DINING: '吃飯',
    STUDY: '讀書',
};

function readArrayPreference(preferences: unknown, key: string): string[] {
    if (!preferences || typeof preferences !== 'object') {
        return [];
    }

    const value = (preferences as Record<string, unknown>)[key];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function readStringPreference(preferences: unknown, key: string): string | null {
    if (!preferences || typeof preferences !== 'object') {
        return null;
    }

    const value = (preferences as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : null;
}

router.get('/partners', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    const mySports = readArrayPreference(user.preferences, 'sports');
    const myLocations = readArrayPreference(user.preferences, 'usualLocations');
    const myTimes = readArrayPreference(user.preferences, 'availableTimes');
    const mySocialPreference = readStringPreference(user.preferences, 'socialPreference');

    const users = await prisma.user.findMany({
        where: {
            id: { not: user.id },
        },
        select: {
            id: true,
            nickname: true,
            email: true,
            attendedCount: true,
            noShowCount: true,
            badges: true,
            preferences: true,
        },
        take: 30,
        orderBy: {
            attendedCount: 'desc',
        },
    });

    const scoredUsers = users.map((candidate) => {
        let score = 0;
        let matchedTags: string[] = [];

        const otherSports = readArrayPreference(candidate.preferences, 'sports');
        const otherLocations = readArrayPreference(candidate.preferences, 'usualLocations');
        const otherTimes = readArrayPreference(candidate.preferences, 'availableTimes');
        const otherSocialPreference = readStringPreference(candidate.preferences, 'socialPreference');

        mySports.forEach((sport) => {
            if (otherSports.includes(sport)) {
                score += 3;
                matchedTags.push(`同運動:${SPORT_LABELS[sport] || sport}`);
            }
        });

        myLocations.forEach((location) => {
            if (otherLocations.includes(location)) {
                score += 2;
                matchedTags.push(`同地點:${location}`);
            }
        });

        myTimes.forEach((time) => {
            if (otherTimes.includes(time)) {
                score += 1;
                matchedTags.push(`同時段:${time}`);
            }
        });

        if (mySocialPreference && otherSocialPreference && mySocialPreference === otherSocialPreference) {
            score += 1;
            matchedTags.push('社交節奏接近');
        }

        matchedTags = [...new Set(matchedTags)].slice(0, 3);

        return {
            id: candidate.id,
            nickname: candidate.nickname || candidate.email.split('@')[0],
            attendedCount: candidate.attendedCount,
            noShowCount: candidate.noShowCount,
            matchedTags,
            score,
        };
    });

    let recommended = scoredUsers.filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score);
    if (recommended.length === 0) {
        recommended = scoredUsers
            .sort((a, b) => b.attendedCount - a.attendedCount)
            .slice(0, 10);
    }

    res.json({
        success: true,
        data: recommended.slice(0, 15),
    });
});

export default router;
