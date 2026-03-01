import { prisma } from '../lib/prisma.js';

/**
 * 前十位註冊玩家的創始會員稱號
 * 根據 createdAt 排序，最早的 10 位使用者各獲得獨特編號 + 稱號
 */
const PIONEER_TITLES: Record<number, { number: string; title: string; icon: string }> = {
    1: { number: '#001', title: '破曉先驅', icon: '🌅' },
    2: { number: '#002', title: '閃電拓荒者', icon: '⚡' },
    3: { number: '#003', title: '燎原星火', icon: '🔥' },
    4: { number: '#004', title: '航路開拓者', icon: '🧭' },
    5: { number: '#005', title: '基石守護者', icon: '🛡️' },
    6: { number: '#006', title: '破浪遠征軍', icon: '🌊' },
    7: { number: '#007', title: '精準狙擊手', icon: '🎯' },
    8: { number: '#008', title: '萌芽培育師', icon: '🌿' },
    9: { number: '#009', title: '未來預見者', icon: '🔮' },
    10: { number: '#010', title: '巔峰攀登者', icon: '🏔️' },
};

/** 快取前 10 位使用者的 ID 清單（伺服器啟動期間有效） */
let pioneerCache: string[] | null = null;

async function getPioneerIds(): Promise<string[]> {
    if (pioneerCache) return pioneerCache;

    const pioneers = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
        take: 10,
        select: { id: true },
    });

    pioneerCache = pioneers.map(p => p.id);
    return pioneerCache;
}

/**
 * 給定 userId，回傳該使用者的創始稱號（若有），否則 null
 */
export async function getPioneerTitle(userId: string): Promise<{ number: string; title: string; icon: string; label: string } | null> {
    const ids = await getPioneerIds();
    const rank = ids.indexOf(userId);
    if (rank === -1) return null;

    const entry = PIONEER_TITLES[rank + 1];
    if (!entry) return null;

    return {
        ...entry,
        label: `${entry.icon} ${entry.number} ${entry.title}`,
    };
}

/** 清除快取（例如管理員刪除使用者後） */
export function clearPioneerCache() {
    pioneerCache = null;
}
