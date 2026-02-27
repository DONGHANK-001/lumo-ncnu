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
                console.error(`API request error (attempt ${attempt + 1}):`, error);

                // 如果是 abort (timeout)，retry
                if ((error as Error).name === 'AbortError' && attempt < maxRetries) {
                    console.log('Request timeout, retrying...');
                    continue;
                }

                // 其他錯誤也 retry（可能是冷啟動）
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, 1000)); // 等 1 秒後重試
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
        return this.request<{ id: string; email: string; nickname: string | null; planType: string; role: string; attendedCount: number; noShowCount: number; }>('/me', { token });
    }

    updateProfile(token: string, data: { nickname?: string; preferences?: unknown }) {
        return this.request('/profile', { method: 'POST', token, body: data });
    }

    submitOnboarding(token: string, data: { realName: string; studentId: string; department: string; disclaimerAccepted: boolean }) {
        return this.request<{ id: string; onboardingCompleted: boolean }>('/onboarding', { method: 'POST', token, body: data });
    }

    upgradePlan(token: string) {
        return this.request<{ planType: string; message: string }>('/plan/upgrade', { method: 'POST', token });
    }

    // Groups
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
}

export const api = new ApiClient(API_BASE_URL);
