import { prisma } from '../lib/prisma.js';

/**
 * 所有可獲得的稱號定義
 * key 格式：{category}_{identifier}
 */
export interface TitleEntry {
    key: string;
    label: string;
    icon: string;
    category: 'pioneer' | 'leaderboard' | 'event' | 'achievement';
    description: string;
}

// ── 創始會員稱號 ──
const PIONEER_TITLES: TitleEntry[] = [
    { key: 'pioneer_1', label: '#001 破曉先驅', icon: '🌅', category: 'pioneer', description: '第 1 位加入的玩家' },
    { key: 'pioneer_2', label: '#002 閃電拓荒者', icon: '⚡', category: 'pioneer', description: '第 2 位加入的玩家' },
    { key: 'pioneer_3', label: '#003 燎原星火', icon: '🔥', category: 'pioneer', description: '第 3 位加入的玩家' },
    { key: 'pioneer_4', label: '#004 航路開拓者', icon: '🧭', category: 'pioneer', description: '第 4 位加入的玩家' },
    { key: 'pioneer_5', label: '#005 基石守護者', icon: '🛡️', category: 'pioneer', description: '第 5 位加入的玩家' },
    { key: 'pioneer_6', label: '#006 破浪遠征軍', icon: '🌊', category: 'pioneer', description: '第 6 位加入的玩家' },
    { key: 'pioneer_7', label: '#007 精準狙擊手', icon: '🎯', category: 'pioneer', description: '第 7 位加入的玩家' },
    { key: 'pioneer_8', label: '#008 萌芽培育師', icon: '🌿', category: 'pioneer', description: '第 8 位加入的玩家' },
    { key: 'pioneer_9', label: '#009 未來預見者', icon: '🔮', category: 'pioneer', description: '第 9 位加入的玩家' },
    { key: 'pioneer_10', label: '#010 巔峰攀登者', icon: '🏔️', category: 'pioneer', description: '第 10 位加入的玩家' },
];

// ── 排行榜稱號（Top 10） ──
const LEADERBOARD_TITLES: TitleEntry[] = [
    { key: 'leaderboard_1', label: '【神域】不敗戰神', icon: '⚔️', category: 'leaderboard', description: '個人排行榜第 1 名' },
    { key: 'leaderboard_2', label: '【天界】無雙霸主', icon: '👑', category: 'leaderboard', description: '個人排行榜第 2 名' },
    { key: 'leaderboard_3', label: '【仙境】絕世強者', icon: '🌟', category: 'leaderboard', description: '個人排行榜第 3 名' },
    { key: 'leaderboard_4', label: '【聖殿】傳奇勇者', icon: '🏛️', category: 'leaderboard', description: '個人排行榜第 4 名' },
    { key: 'leaderboard_5', label: '【龍域】覺醒龍騎', icon: '🐉', category: 'leaderboard', description: '個人排行榜第 5 名' },
    { key: 'leaderboard_6', label: '【幻境】影舞者', icon: '🌀', category: 'leaderboard', description: '個人排行榜第 6 名' },
    { key: 'leaderboard_7', label: '【王座】榮耀騎士', icon: '🛡️', category: 'leaderboard', description: '個人排行榜第 7 名' },
    { key: 'leaderboard_8', label: '【風暴】雷霆行者', icon: '⚡', category: 'leaderboard', description: '個人排行榜第 8 名' },
    { key: 'leaderboard_9', label: '【星辰】月影獵人', icon: '🌙', category: 'leaderboard', description: '個人排行榜第 9 名' },
    { key: 'leaderboard_10', label: '【曙光】破曉守望者', icon: '🌅', category: 'leaderboard', description: '個人排行榜第 10 名' },
];

// ── 限定活動稱號 ──
const EVENT_TITLES: TitleEntry[] = [
    { key: 'wbc_2026', label: '⚾ 經典賽應援團 2026', icon: '⚾', category: 'event', description: '3/5 經典賽當日成功揪團一次' },
];

// ── 全部稱號 Map ──
const ALL_TITLES_MAP = new Map<string, TitleEntry>();
[...PIONEER_TITLES, ...LEADERBOARD_TITLES, ...EVENT_TITLES].forEach(t => ALL_TITLES_MAP.set(t.key, t));

export function getTitleByKey(key: string): TitleEntry | undefined {
    return ALL_TITLES_MAP.get(key);
}

// ── 快取前 10 位使用者 ──
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

export function clearPioneerCache() {
    pioneerCache = null;
}

/**
 * 取得使用者的所有已獲得稱號
 */
export async function getUserTitles(userId: string): Promise<TitleEntry[]> {
    const titles: TitleEntry[] = [];

    // 1. 創始會員
    const ids = await getPioneerIds();
    const rank = ids.indexOf(userId);
    if (rank !== -1 && PIONEER_TITLES[rank]) {
        titles.push(PIONEER_TITLES[rank]);
    }

    // 2. 排行榜稱號 — 查「上個月」結算結果（稱號持續一個月）
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // 2026 年 3 月的起點為 3/2
    const adjustedStart = (lastMonthStart.getFullYear() === 2026 && lastMonthStart.getMonth() === 2)
        ? new Date('2026-03-02T00:00:00+08:00')
        : lastMonthStart;
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const topUsers = await prisma.$queryRaw<{ userId: string }[]>`
        SELECT gm."userId", COUNT(*)::int as cnt
        FROM group_members gm
        WHERE gm.status = 'JOINED'
          AND gm."joinedAt" >= ${adjustedStart}
          AND gm."joinedAt" <= ${lastMonthEnd}
        GROUP BY gm."userId"
        ORDER BY cnt DESC
        LIMIT 10
    `;
    const lbRank = topUsers.findIndex(u => u.userId === userId);
    if (lbRank !== -1 && LEADERBOARD_TITLES[lbRank]) {
        titles.push(LEADERBOARD_TITLES[lbRank]);
    }

    // 3. WBC 2026 限定稱號 — 3/5 當天有成功參加或發起揪團
    const wbcDate = new Date('2026-03-05T00:00:00+08:00');
    const wbcEnd = new Date('2026-03-06T00:00:00+08:00');
    const wbcParticipation = await prisma.groupMember.count({
        where: {
            userId,
            status: 'JOINED',
            group: {
                time: { gte: wbcDate, lt: wbcEnd },
            },
        },
    });
    const wbcCreated = await prisma.group.count({
        where: {
            createdById: userId,
            time: { gte: wbcDate, lt: wbcEnd },
        },
    });
    if (wbcParticipation > 0 || wbcCreated > 0) {
        titles.push(EVENT_TITLES[0]); // wbc_2026
    }

    return titles;
}

/**
 * 取得使用者的「目前展示的稱號」（activeTitle 或預設第一個）
 */
export async function getActiveTitle(userId: string): Promise<TitleEntry | null> {
    const rows = await prisma.$queryRaw<{ activeTitle: string | null }[]>`
        SELECT "activeTitle" FROM users WHERE id = ${userId} LIMIT 1
    `;

    const allTitles = await getUserTitles(userId);
    if (allTitles.length === 0) return null;

    const activeKey = rows[0]?.activeTitle;
    if (activeKey) {
        const active = allTitles.find(t => t.key === activeKey);
        if (active) return active;
    }

    return allTitles[0];
}

// 向後相容的舊 API
export async function getPioneerTitle(userId: string) {
    const active = await getActiveTitle(userId);
    if (!active) return null;
    return {
        number: '',
        title: active.label,
        icon: active.icon,
        label: `${active.icon} ${active.label}`,
        key: active.key,
    };
}
