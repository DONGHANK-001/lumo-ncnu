import { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
    method?: HttpMethod;
    body?: unknown;
    token?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
        const { method = 'GET', body, token } = options;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const maxRetries = 2;
        const backoffMs = [100, 500, 2500]; // exponential backoff
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 秒 timeout

                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                const data = await response.json();

                if (!response.ok) {
                    return {
                        success: false,
                        error: data.error || { code: 'UNKNOWN_ERROR', message: '發生未知錯誤' },
                    };
                }

                return data;
            } catch (error) {
                lastError = error as Error;

                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, backoffMs[attempt]));
                    continue;
                }
            }
        }

        // 所有重試都失敗
        const isTimeout = lastError?.name === 'AbortError';
        return {
            success: false,
            error: {
                code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
                message: isTimeout
                    ? '伺服器回應逾時，請稍後再試（伺服器可能正在啟動中）'
                    : '網路連線失敗，請檢查網路後再試'
            },
        };
    }

    // Auth
    getMe(token: string) {
        return this.request<{
            id: string;
            email: string;
            nickname: string | null;
            gender: string | null;
            gradeLabel: string | null;
            department: string | null;
            planType: string;
            role: string;
            attendedCount: number;
            noShowCount: number;
        }>('/me', { token });
    }

    updateProfile(token: string, data: { nickname?: string; preferences?: unknown; department?: string; gender?: string; gradeLabel?: string }) {
        return this.request('/profile', { method: 'POST', token, body: data });
    }

    updateAvatar(token: string, avatarUrl: string) {
        return this.request<{ id: string; avatarUrl: string }>('/users/me/avatar', { method: 'PUT', token, body: { avatarUrl } });
    }

    getUserProfile(id: string, token?: string) {
        return this.request<{
            id: string;
            nickname: string | null;
            department: string | null;
            gender: string | null;
            gradeLabel: string | null;
            school: string;
            avatarUrl: string | null;
            planType: string;
            preferences: unknown;
            attendedCount: number;
            noShowCount: number;
            createdAt: string;
        }>(`/users/${id}`, { token });
    }

    submitOnboarding(token: string, data: {
        realName: string;
        studentId: string;
        department: string;
        gender: 'FEMALE' | 'MALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
        gradeLabel: string;
        disclaimerAccepted: boolean;
    }) {
        return this.request<{ id: string; onboardingCompleted: boolean }>('/onboarding', { method: 'POST', token, body: data });
    }

    getMyStats(token: string) {
        return this.request<{
            currentStreak: number;
            longestStreak: number;
            weeklyHours: number;
            monthlyHours: number;
            totalCalories: number;
            sportDistribution: { id: number; label: string; value: number }[];
            weeklyData: { day: string; hours: number }[];
        }>('/me/stats', { token });
    }

    upgradePlan(token: string) {
        return this.request<{ planType: string; message: string }>('/plan/upgrade', { method: 'POST', token });
    }

    // Groups
    getGroupQuota(token: string) {
        return this.request<{ hostedThisWeek: number; joinedThisWeek: number; currentStreak: number; limit: number; remaining: number; }>('/groups/quota/me', { token });
    }

    getGroups(query?: Record<string, string>) {
        const params = query ? `?${new URLSearchParams(query)}` : '';
        return this.request<{ items: unknown[]; total: number; page: number; hasMore: boolean }>(`/groups${params}`);
    }

    getGroup(id: string, token?: string) {
        return this.request(`/groups/${id}`, { token });
    }

    createGroup(token: string, data: unknown) {
        return this.request('/groups', { method: 'POST', token, body: data });
    }

    joinGroup(token: string, id: string) {
        return this.request(`/groups/${id}/join`, { method: 'POST', token });
    }

    leaveGroup(token: string, id: string) {
        return this.request(`/groups/${id}/leave`, { method: 'POST', token });
    }

    waitlistGroup(token: string, id: string) {
        return this.request(`/groups/${id}/waitlist`, { method: 'POST', token });
    }

    cancelGroup(token: string, id: string) {
        return this.request(`/groups/${id}/cancel`, { method: 'POST', token });
    }

    // Group Comments
    getGroupComments(id: string) {
        return this.request<any[]>(`/groups/${id}/comments`);
    }

    postGroupComment(token: string, id: string, content: string) {
        return this.request<any>(`/groups/${id}/comments`, { method: 'POST', token, body: { content } });
    }

    // Reports
    createReport(token: string, data: unknown) {
        return this.request('/reports', { method: 'POST', token, body: data });
    }

    getSafetyRules() {
        return this.request<{ version: string; rules: string[] }>('/reports/safety');
    }

    // Attendance
    updateGroupAttendance(token: string, id: string, records: { userId: string, isAttended: boolean | null }[]) {
        return this.request(`/groups/${id}/attendance`, { method: 'PUT', token, body: { records } });
    }

    // Admin
    getAdminGroups(token: string) {
        return this.request<{ items: unknown[] }>('/admin/groups', { token });
    }

    getAdminStats(token: string) {
        return this.request<{ totalGroups: number; activeGroups: number; totalUsers: number; expiredGroups: number }>('/admin/stats', { token });
    }

    deleteGroup(token: string, id: string) {
        return this.request(`/admin/groups/${id}`, { method: 'DELETE', token });
    }

    updateGroup(token: string, id: string, data: { title: string; status: string }) {
        return this.request(`/admin/groups/${id}`, { method: 'PATCH', token, body: data });
    }

    cleanupGroups(token: string) {
        return this.request<{ message: string }>('/admin/groups/cleanup', { method: 'POST', token });
    }

    getAdminReports(token: string) {
        return this.request<{ items: unknown[] }>('/admin/reports', { token });
    }

    deleteReport(token: string, id: string) {
        return this.request(`/admin/reports/${id}`, { method: 'DELETE', token });
    }

    confirmReport(token: string, id: string) {
        return this.request<{ message: string; userId: string; newScore: number; banned: boolean; banDays: number | null }>(`/admin/reports/${id}/confirm`, { method: 'POST', token });
    }

    getAdminUsers(token: string, params?: { search?: string; role?: string; banned?: string; identity?: 'complete' | 'incomplete'; pageSize?: string }) {
        const query = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][])}` : '';
        return this.request<{ items: any[]; total: number }>(`/admin/users${query}`, { token });
    }

    updateAdminUserProfile(
        token: string,
        id: string,
        data: {
            department?: string | null;
            gender?: 'FEMALE' | 'MALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY' | null;
            gradeLabel?: string | null;
        }
    ) {
        return this.request(`/admin/users/${id}/profile`, { method: 'PATCH', token, body: data });
    }

    banUser(token: string, id: string, isBanned: boolean, banReason?: string) {
        return this.request(`/admin/users/${id}/ban`, { method: 'PATCH', token, body: { isBanned, banReason } });
    }

    changeUserRole(token: string, id: string, role: string) {
        return this.request(`/admin/users/${id}/role`, { method: 'PATCH', token, body: { role } });
    }

    // Badges
    getBadges() {
        return this.request<any[]>('/badges');
    }

    getMyBadges(token: string) {
        return this.request<any[]>('/badges/me', { token });
    }

    checkBadges(token: string) {
        return this.request<{ newlyUnlocked: any[] }>('/badges/check', { method: 'POST', token });
    }

    // Match
    getMatchPartners(token: string) {
        return this.request<any[]>('/match/partners', { token });
    }

    // Member Ratings
    rateGroupMember(token: string, groupId: string, ratedUserId: string, isPositive: boolean) {
        return this.request<{ message: string }>(`/groups/${groupId}/rate`, {
            method: 'POST', token, body: { ratedUserId, isPositive },
        });
    }

    getGroupRatings(token: string, groupId: string) {
        return this.request<Record<string, boolean>>(`/groups/${groupId}/ratings`, { token });
    }

    // Payment
    checkoutSubscription(token: string, planType: string) {
        return this.request<any>('/payment/checkout', { method: 'POST', token, body: { planType } });
    }

    // Titles
    getMyTitles(token: string) {
        return this.request<any>('/me/titles', { token });
    }

    setActiveTitle(token: string, titleKey: string) {
        return this.request<any>('/me/title', { method: 'PUT', token, body: { titleKey } });
    }

    // Notifications
    getNotifications(token: string, page = 1) {
        return this.request<{ items: any[]; total: number; unreadCount: number; page: number; pageSize: number }>(`/notifications?page=${page}`, { token });
    }

    getUnreadCount(token: string) {
        return this.request<{ count: number }>('/notifications/unread-count', { token });
    }

    markNotificationRead(token: string, id: string) {
        return this.request<{ message: string }>(`/notifications/${id}/read`, { method: 'PUT', token });
    }

    markAllNotificationsRead(token: string) {
        return this.request<{ message: string }>('/notifications/read-all', { method: 'PUT', token });
    }

    deleteReadNotifications(token: string) {
        return this.request<{ deletedCount: number }>('/notifications/read', { method: 'DELETE', token });
    }

    // My Groups History
    getMyGroups(token: string, type?: string, page?: number) {
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        if (page) params.set('page', String(page));
        return this.request<{ items: any[]; total: number; page: number; hasMore: boolean }>(`/me/groups?${params}`, { token });
    }
}

export const api = new ApiClient(API_BASE_URL);
