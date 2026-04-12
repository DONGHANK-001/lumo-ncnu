'use client';

import useSWR, { mutate, SWRConfiguration } from 'swr';
import { api } from '@/lib/api-client';
import { useAuth } from './useAuth';

// ─── SWR Key 常數 ──────────────────────────────
export const SWR_KEYS = {
    badges: '/badges',
    myBadges: '/badges/me',
    myStats: '/me/stats',
    myTitles: '/me/titles',
    deptLeaderboard: '/leaderboard/departments',
    activityLeaderboard: (type: string) => `/leaderboard/by-activity?type=${type}`,
    groups: (filters: Record<string, string>) => `/groups?${new URLSearchParams(filters).toString()}`,
    userProfile: (id: string) => `/users/${id}`,
    userBadges: (id: string) => `/badges/user/${id}`,
    myGroups: (tab?: string) => `/me/groups${tab ? `?type=${tab}` : ''}`,
} as const;

// ─── 共用 SWR 設定 ──────────────────────────────
const DEFAULT_CONFIG: SWRConfiguration = {
    revalidateOnFocus: false,
    dedupingInterval: 10000, // 10 秒內不重複請求
};

// ─── 不需 Token 的 Hooks ────────────────────────

/** 取得所有徽章定義 */
export function useAllBadges() {
    return useSWR(
        SWR_KEYS.badges,
        async () => {
            const res = await api.getBadges();
            if (res.success && res.data) return res.data as any[];
            throw new Error('Failed to fetch badges');
        },
        { ...DEFAULT_CONFIG, revalidateOnMount: true }
    );
}

/** 取得系所排行榜 */
export function useDeptLeaderboard() {
    return useSWR(
        SWR_KEYS.deptLeaderboard,
        async () => {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
            const res = await fetch(`${API_BASE_URL}/leaderboard/departments?period=current`);
            const json = await res.json();
            if (json.success) return json.data;
            throw new Error('Failed to fetch dept leaderboard');
        },
        DEFAULT_CONFIG
    );
}

/** 取得活動排行榜 */
export function useActivityLeaderboard(type: string | null) {
    return useSWR(
        type ? SWR_KEYS.activityLeaderboard(type) : null,
        async () => {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
            const res = await fetch(`${API_BASE_URL}/leaderboard/by-activity?type=${type}`);
            const json = await res.json();
            if (json.success) return json.data;
            throw new Error('Failed to fetch activity leaderboard');
        },
        DEFAULT_CONFIG
    );
}

/** 取得揪團列表 */
export function useGroups(filters: Record<string, string>) {
    const key = SWR_KEYS.groups(filters);
    return useSWR(
        key,
        async () => {
            const res = await api.getGroups(filters);
            if (res.success && res.data) return res.data.items as any[];
            throw new Error('Failed to fetch groups');
        },
        DEFAULT_CONFIG
    );
}

/** 取得公開使用者檔案 */
export function useUserProfile(id: string) {
    return useSWR<any>(
        SWR_KEYS.userProfile(id),
        async () => {
            const res = await api.getUserProfile(id);
            if (res.success && res.data) return res.data;
            throw new Error(res.error?.message || '無此用戶');
        },
        DEFAULT_CONFIG
    );
}

/** 取得使用者徽章 */
export function useUserBadges(id: string) {
    return useSWR(
        SWR_KEYS.userBadges(id),
        async () => {
            const res = await api.getUserBadges(id);
            if (res.success && res.data) return res.data as any[];
            throw new Error('Failed to fetch user badges');
        },
        DEFAULT_CONFIG
    );
}

// ─── 需要 Token 的 Hooks ────────────────────────

/** 取得我的徽章 */
export function useMyBadges() {
    const { user, getToken } = useAuth();
    return useSWR(
        user ? SWR_KEYS.myBadges : null,
        async () => {
            const token = await getToken();
            if (!token) throw new Error('No token');
            const res = await api.getMyBadges(token);
            if (res.success && res.data) return res.data as any[];
            throw new Error('Failed to fetch my badges');
        },
        DEFAULT_CONFIG
    );
}

/** 取得我的統計 */
export function useMyStats() {
    const { user, getToken } = useAuth();
    return useSWR<any>(
        user ? SWR_KEYS.myStats : null,
        async () => {
            const token = await getToken();
            if (!token) throw new Error('No token');
            const res = await api.getMyStats(token);
            if (res.success && res.data) return res.data;
            throw new Error('Failed to fetch my stats');
        },
        DEFAULT_CONFIG
    );
}

/** 取得我的稱號 */
export function useMyTitles() {
    const { user, getToken } = useAuth();
    return useSWR(
        user ? SWR_KEYS.myTitles : null,
        async () => {
            const token = await getToken();
            if (!token) throw new Error('No token');
            const res = await api.getMyTitles(token);
            if (res.success && res.data) return res.data;
            throw new Error('Failed to fetch my titles');
        },
        DEFAULT_CONFIG
    );
}

/** 取得我的揪團紀錄 */
export function useMyGroups(tab?: string) {
    const { user, getToken } = useAuth();
    const type = tab === 'all' ? undefined : tab;
    return useSWR(
        user ? SWR_KEYS.myGroups(type) : null,
        async () => {
            const token = await getToken();
            if (!token) throw new Error('No token');
            const res = await api.getMyGroups(token, type);
            if (res.success && res.data) return res.data.items;
            throw new Error('Failed to fetch my groups');
        },
        DEFAULT_CONFIG
    );
}

// ─── Prefetch（登入後預載資料） ──────────────────

/** 登入後一次預載關鍵資料，填入 SWR cache */
export async function prefetchAfterLogin(getToken: () => Promise<string | null>) {
    const token = await getToken();
    if (!token) return;

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

    // 並行預載不需互相等待的資料
    const [badgesRes, myBadgesRes, myStatsRes, myTitlesRes, deptRes] = await Promise.allSettled([
        api.getBadges(),
        api.getMyBadges(token),
        api.getMyStats(token),
        api.getMyTitles(token),
        fetch(`${API_BASE_URL}/leaderboard/departments?period=current`).then(r => r.json()),
    ]);

    // 將成功的結果塞入 SWR cache
    if (badgesRes.status === 'fulfilled' && badgesRes.value.success) {
        mutate(SWR_KEYS.badges, badgesRes.value.data, false);
    }
    if (myBadgesRes.status === 'fulfilled' && myBadgesRes.value.success) {
        mutate(SWR_KEYS.myBadges, myBadgesRes.value.data, false);
    }
    if (myStatsRes.status === 'fulfilled' && myStatsRes.value.success) {
        mutate(SWR_KEYS.myStats, myStatsRes.value.data, false);
    }
    if (myTitlesRes.status === 'fulfilled' && myTitlesRes.value.success) {
        mutate(SWR_KEYS.myTitles, myTitlesRes.value.data, false);
    }
    if (deptRes.status === 'fulfilled' && deptRes.value.success) {
        mutate(SWR_KEYS.deptLeaderboard, deptRes.value.data, false);
    }

    // 順便 auto-check badges
    api.checkBadges(token).catch(() => {});
}

/** 登出時清除所有 SWR cache */
export function clearSWRCache() {
    mutate(() => true, undefined, { revalidate: false });
}
