import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

/**
 * 所有可獲得的稱號定義
 * key 格式：{category}_{identifier}
 */
export interface TitleEntry {
    key: string;
    label: string;
    icon: string;
    category: 'pioneer' | 'leaderboard' | 'event' | 'achievement' | 'subscription' | 'reputation' | 'sport_rank' | 'social_rank' | 'dept_glory';
    description: string;
}

// ── 創始會員稱號 ──
const PIONEER_TITLES: TitleEntry[] = [
    { key: 'pioneer_1', label: '#001 破曉先驅', icon: 'WbTwilight', category: 'pioneer', description: '第 1 位加入的玩家' },
    { key: 'pioneer_2', label: '#002 閃電拓荒者', icon: 'Bolt', category: 'pioneer', description: '第 2 位加入的玩家' },
    { key: 'pioneer_3', label: '#003 燎原星火', icon: 'LocalFireDepartment', category: 'pioneer', description: '第 3 位加入的玩家' },
    { key: 'pioneer_4', label: '#004 航路開拓者', icon: 'Explore', category: 'pioneer', description: '第 4 位加入的玩家' },
    { key: 'pioneer_5', label: '#005 基石守護者', icon: 'Shield', category: 'pioneer', description: '第 5 位加入的玩家' },
    { key: 'pioneer_6', label: '#006 破浪遠征軍', icon: 'Waves', category: 'pioneer', description: '第 6 位加入的玩家' },
    { key: 'pioneer_7', label: '#007 精準狙擊手', icon: 'GpsFixed', category: 'pioneer', description: '第 7 位加入的玩家' },
    { key: 'pioneer_8', label: '#008 萌芽培育師', icon: 'Park', category: 'pioneer', description: '第 8 位加入的玩家' },
    { key: 'pioneer_9', label: '#009 未來預見者', icon: 'AutoAwesome', category: 'pioneer', description: '第 9 位加入的玩家' },
    { key: 'pioneer_10', label: '#010 巔峰攀登者', icon: 'Terrain', category: 'pioneer', description: '第 10 位加入的玩家' },
];

// ── 排行榜稱號（舊版 Top 10，保留向後相容） ──
const LEADERBOARD_TITLES: TitleEntry[] = [
    { key: 'leaderboard_1', label: '【神域】不敗戰神', icon: 'Security', category: 'leaderboard', description: '個人排行榜第 1 名' },
    { key: 'leaderboard_2', label: '【天界】無雙霸主', icon: 'EmojiEvents', category: 'leaderboard', description: '個人排行榜第 2 名' },
    { key: 'leaderboard_3', label: '【仙境】絕世強者', icon: 'Stars', category: 'leaderboard', description: '個人排行榜第 3 名' },
    { key: 'leaderboard_4', label: '【聖殿】傳奇勇者', icon: 'AccountBalance', category: 'leaderboard', description: '個人排行榜第 4 名' },
    { key: 'leaderboard_5', label: '【龍域】覺醒龍騎', icon: 'AutoAwesome', category: 'leaderboard', description: '個人排行榜第 5 名' },
    { key: 'leaderboard_6', label: '【幻境】影舞者', icon: 'Waves', category: 'leaderboard', description: '個人排行榜第 6 名' },
    { key: 'leaderboard_7', label: '【王座】榮耀騎士', icon: 'Shield', category: 'leaderboard', description: '個人排行榜第 7 名' },
    { key: 'leaderboard_8', label: '【風暴】雷霆行者', icon: 'Bolt', category: 'leaderboard', description: '個人排行榜第 8 名' },
    { key: 'leaderboard_9', label: '【星辰】月影獵人', icon: 'NightsStay', category: 'leaderboard', description: '個人排行榜第 9 名' },
    { key: 'leaderboard_10', label: '【曙光】破曉守望者', icon: 'WbTwilight', category: 'leaderboard', description: '個人排行榜第 10 名' },
];

// ── 運動排行稱號（每項運動 Top 3，上月結算） ──
const SPORT_RANK_TITLES: TitleEntry[] = [
    // 籃球
    { key: 'sport_basketball_1', label: '籃球之王', icon: 'SportsBasketball', category: 'sport_rank', description: '上月籃球排行第 1 名' },
    { key: 'sport_basketball_2', label: '灌籃悍將', icon: 'SportsBasketball', category: 'sport_rank', description: '上月籃球排行第 2 名' },
    { key: 'sport_basketball_3', label: '籃場新星', icon: 'SportsBasketball', category: 'sport_rank', description: '上月籃球排行第 3 名' },
    // 跑步
    { key: 'sport_running_1', label: '極速飛人', icon: 'DirectionsRun', category: 'sport_rank', description: '上月跑步排行第 1 名' },
    { key: 'sport_running_2', label: '疾風跑者', icon: 'DirectionsRun', category: 'sport_rank', description: '上月跑步排行第 2 名' },
    { key: 'sport_running_3', label: '耐力新星', icon: 'DirectionsRun', category: 'sport_rank', description: '上月跑步排行第 3 名' },
    // 羽球
    { key: 'sport_badminton_1', label: '羽球至尊', icon: 'SportsTennis', category: 'sport_rank', description: '上月羽球排行第 1 名' },
    { key: 'sport_badminton_2', label: '殺球悍將', icon: 'SportsTennis', category: 'sport_rank', description: '上月羽球排行第 2 名' },
    { key: 'sport_badminton_3', label: '羽場新星', icon: 'SportsTennis', category: 'sport_rank', description: '上月羽球排行第 3 名' },
    // 桌球
    { key: 'sport_table_tennis_1', label: '桌球至尊', icon: 'SportsCricket', category: 'sport_rank', description: '上月桌球排行第 1 名' },
    { key: 'sport_table_tennis_2', label: '旋球悍將', icon: 'SportsCricket', category: 'sport_rank', description: '上月桌球排行第 2 名' },
    { key: 'sport_table_tennis_3', label: '桌場新星', icon: 'SportsCricket', category: 'sport_rank', description: '上月桌球排行第 3 名' },
    // 健身
    { key: 'sport_gym_1', label: '鐵人霸主', icon: 'FitnessCenter', category: 'sport_rank', description: '上月健身排行第 1 名' },
    { key: 'sport_gym_2', label: '鋼鐵悍將', icon: 'FitnessCenter', category: 'sport_rank', description: '上月健身排行第 2 名' },
    { key: 'sport_gym_3', label: '健身新星', icon: 'FitnessCenter', category: 'sport_rank', description: '上月健身排行第 3 名' },
    // 排球
    { key: 'sport_volleyball_1', label: '排球至尊', icon: 'SportsVolleyball', category: 'sport_rank', description: '上月排球排行第 1 名' },
    { key: 'sport_volleyball_2', label: '扣殺悍將', icon: 'SportsVolleyball', category: 'sport_rank', description: '上月排球排行第 2 名' },
    { key: 'sport_volleyball_3', label: '排場新星', icon: 'SportsVolleyball', category: 'sport_rank', description: '上月排球排行第 3 名' },
    // 網球
    { key: 'sport_tennis_1', label: '網球至尊', icon: 'SportsTennis', category: 'sport_rank', description: '上月網球排行第 1 名' },
    { key: 'sport_tennis_2', label: 'ACE悍將', icon: 'SportsTennis', category: 'sport_rank', description: '上月網球排行第 2 名' },
    { key: 'sport_tennis_3', label: '網場新星', icon: 'SportsTennis', category: 'sport_rank', description: '上月網球排行第 3 名' },
];

// ── 社交活動排行稱號（每項活動 Top 3，上月結算） ──
const SOCIAL_RANK_TITLES: TitleEntry[] = [
    // 晚風漫遊
    { key: 'social_night_walk_1', label: '月夜行者', icon: 'NightsStay', category: 'social_rank', description: '上月晚風漫遊排行第 1 名' },
    { key: 'social_night_walk_2', label: '星夜漫遊', icon: 'NightsStay', category: 'social_rank', description: '上月晚風漫遊排行第 2 名' },
    { key: 'social_night_walk_3', label: '夜行新星', icon: 'NightsStay', category: 'social_rank', description: '上月晚風漫遊排行第 3 名' },
    // 飯飯之交
    { key: 'social_dining_1', label: '美食霸主', icon: 'Restaurant', category: 'social_rank', description: '上月飯飯之交排行第 1 名' },
    { key: 'social_dining_2', label: '饕餮使者', icon: 'Restaurant', category: 'social_rank', description: '上月飯飯之交排行第 2 名' },
    { key: 'social_dining_3', label: '覓食新星', icon: 'Restaurant', category: 'social_rank', description: '上月飯飯之交排行第 3 名' },
    // 讀家回憶
    { key: 'social_study_1', label: '學霸之王', icon: 'MenuBook', category: 'social_rank', description: '上月讀家回憶排行第 1 名' },
    { key: 'social_study_2', label: '書卷達人', icon: 'MenuBook', category: 'social_rank', description: '上月讀家回憶排行第 2 名' },
    { key: 'social_study_3', label: '學海新星', icon: 'MenuBook', category: 'social_rank', description: '上月讀家回憶排行第 3 名' },
];

// ── 系所之光稱號（動態，前 3 名系所成員可獲得） ──
const DEPT_GLORY_ICONS = ['School', 'School', 'School'];

// 所有活動類型常數
const PURE_SPORTS = ['BASKETBALL', 'RUNNING', 'BADMINTON', 'TABLE_TENNIS', 'GYM', 'VOLLEYBALL', 'TENNIS'] as const;
const SOCIAL_ACTIVITIES = ['NIGHT_WALK', 'DINING', 'STUDY'] as const;

// ── 限定活動稱號 ──
const EVENT_TITLES: TitleEntry[] = [
    { key: 'wbc_2026', label: '經典賽應援團 2026', icon: 'SportsBaseball', category: 'event', description: '3/5 經典賽當日成功揪團一次' },
];

// ── 訂閱方案稱號 ──
const SUBSCRIPTION_TITLES: TitleEntry[] = [
    { key: 'lifetime_blackgold', label: '黑金永恆', icon: 'Diamond', category: 'subscription', description: '終身黑金卡持有者' },
];

// ── 信譽獎勵稱號 ──
const REPUTATION_TITLES: TitleEntry[] = [
    { key: 'rep_week', label: '信譽見習生', icon: 'VerifiedUser', category: 'reputation', description: '連續 7 天信譽滿分' },
    { key: 'rep_month', label: '鋼鐵守則', icon: 'Security', category: 'reputation', description: '連續 30 天信譽滿分' },
    { key: 'rep_quarter', label: '鑽石意志', icon: 'Diamond', category: 'reputation', description: '連續 90 天信譽滿分' },
    { key: 'rep_year', label: '傳說之證', icon: 'AutoAwesome', category: 'reputation', description: '連續 365 天信譽滿分' },
];

// ── 全部稱號 Map ──
const ALL_TITLES_MAP = new Map<string, TitleEntry>();
[...PIONEER_TITLES, ...LEADERBOARD_TITLES, ...SPORT_RANK_TITLES, ...SOCIAL_RANK_TITLES, ...EVENT_TITLES, ...SUBSCRIPTION_TITLES, ...REPUTATION_TITLES].forEach(t => ALL_TITLES_MAP.set(t.key, t));

// ── 運動/社交排行稱號快速查詢 ──
const SPORT_RANK_MAP = new Map<string, TitleEntry>();
SPORT_RANK_TITLES.forEach(t => SPORT_RANK_MAP.set(t.key, t));
const SOCIAL_RANK_MAP = new Map<string, TitleEntry>();
SOCIAL_RANK_TITLES.forEach(t => SOCIAL_RANK_MAP.set(t.key, t));

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

// ── 活動排行快取（60 秒 TTL） ──
let activityTopCache: { data: Map<string, string[]>; ts: number } | null = null;
let deptTopCache: { data: { department: string }[]; ts: number } | null = null;
const CACHE_TTL = 60_000;

function getLastMonthRange() {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    if (start.getFullYear() === 2026 && start.getMonth() === 2) {
        start = new Date('2026-03-02T00:00:00+08:00');
    }
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
}

/** 每項活動 Top 3 userId — 上月結算（60s 快取） */
async function getActivityTopUsers(): Promise<Map<string, string[]>> {
    if (activityTopCache && Date.now() - activityTopCache.ts < CACHE_TTL) return activityTopCache.data;
    const { start, end } = getLastMonthRange();

    const rows = await prisma.$queryRaw<{ sportType: string; userId: string; cnt: bigint }[]>`
        SELECT g."sportType", gm."userId", COUNT(*)::bigint as cnt
        FROM group_members gm
        JOIN groups g ON g.id = gm."groupId"
        WHERE gm.status = 'JOINED'
          AND gm."joinedAt" >= ${start}
          AND gm."joinedAt" <= ${end}
        GROUP BY g."sportType", gm."userId"
        ORDER BY g."sportType", cnt DESC
    `;

    const map = new Map<string, string[]>();
    for (const row of rows) {
        const list = map.get(row.sportType) || [];
        if (list.length < 3) list.push(row.userId);
        map.set(row.sportType, list);
    }
    activityTopCache = { data: map, ts: Date.now() };
    return map;
}

/** 系所排行 Top 3 — 上月結算（只計純運動，60s 快取） */
async function getDeptTopRanks(): Promise<{ department: string }[]> {
    if (deptTopCache && Date.now() - deptTopCache.ts < CACHE_TTL) return deptTopCache.data;
    const { start, end } = getLastMonthRange();
    const pureSportsArray = [...PURE_SPORTS];

    const rows = await prisma.$queryRaw<{ department: string; cnt: bigint }[]>`
        SELECT u."department", COUNT(gm.id)::bigint as cnt
        FROM group_members gm
        JOIN users u ON u.id = gm."userId"
        JOIN groups g ON g.id = gm."groupId"
        WHERE gm.status = 'JOINED'
          AND gm."joinedAt" >= ${start}
          AND gm."joinedAt" <= ${end}
          AND u."department" IS NOT NULL
          AND u."department" != ''
          AND g."sportType"::text IN (${Prisma.join(pureSportsArray)})
        GROUP BY u."department"
        ORDER BY cnt DESC
        LIMIT 3
    `;

    const data = rows.map(r => ({ department: r.department }));
    deptTopCache = { data, ts: Date.now() };
    return data;
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

    // 2. 舊排行榜稱號 — 查「上個月」結算結果（稱號持續一個月）
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
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

    // 3. 運動 / 社交活動排行稱號（上月 Top 3）
    const activityTop = await getActivityTopUsers();
    for (const sport of PURE_SPORTS) {
        const topList = activityTop.get(sport) || [];
        const sportRank = topList.indexOf(userId);
        if (sportRank !== -1) {
            const key = `sport_${sport.toLowerCase()}_${sportRank + 1}`;
            const title = SPORT_RANK_MAP.get(key);
            if (title) titles.push(title);
        }
    }
    for (const activity of SOCIAL_ACTIVITIES) {
        const topList = activityTop.get(activity) || [];
        const actRank = topList.indexOf(userId);
        if (actRank !== -1) {
            const key = `social_${activity.toLowerCase()}_${actRank + 1}`;
            const title = SOCIAL_RANK_MAP.get(key);
            if (title) titles.push(title);
        }
    }

    // 4. 系所之光稱號（上月系所排行 Top 3 的所有成員）
    const deptTop = await getDeptTopRanks();
    if (deptTop.length > 0) {
        const userDept = await prisma.user.findUnique({ where: { id: userId }, select: { department: true } });
        if (userDept?.department) {
            const deptIdx = deptTop.findIndex(d => d.department === userDept.department);
            if (deptIdx !== -1 && deptIdx < 3) {
                const gloryTitle: TitleEntry = {
                    key: `dept_glory_${deptIdx + 1}`,
                    label: `${userDept.department}之光`,
                    icon: DEPT_GLORY_ICONS[deptIdx],
                    category: 'dept_glory',
                    description: `上月系所排行第 ${deptIdx + 1} 名的榮譽`,
                };
                titles.push(gloryTitle);
            }
        }
    }

    // 5. WBC 2026 限定稱號 — 3/5 當天有成功參加或發起揪團
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

    // 6. 終身黑金卡稱號
    const subRow = await prisma.$queryRaw<{ planType: string; endAt: Date | null }[]>`
        SELECT u."planType", ps."endAt"
        FROM users u
        LEFT JOIN plus_subscriptions ps ON ps."userId" = u.id
        WHERE u.id = ${userId} LIMIT 1
    `;
    if (subRow[0]?.planType === 'PLUS') {
        const exp = subRow[0].endAt;
        if (exp && new Date(exp).getFullYear() > 2070) {
            titles.push(SUBSCRIPTION_TITLES[0]);
        }
    }

    // 7. 信譽稱號 — 連續 N 天信譽 100
    const userInfo = await prisma.user.findUnique({
        where: { id: userId },
        select: { negativeRatings: true, createdAt: true },
    });
    if (userInfo && userInfo.negativeRatings === 0) {
        const lastNeg = await prisma.memberRating.findFirst({
            where: { ratedUserId: userId, isPositive: false },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        });
        const startDate = lastNeg ? lastNeg.createdAt : userInfo.createdAt;
        const daysSinceClean = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceClean >= 365) titles.push(REPUTATION_TITLES[3]);
        if (daysSinceClean >= 90) titles.push(REPUTATION_TITLES[2]);
        if (daysSinceClean >= 30) titles.push(REPUTATION_TITLES[1]);
        if (daysSinceClean >= 7) titles.push(REPUTATION_TITLES[0]);
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
        label: active.label,
        key: active.key,
    };
}
