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

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || { code: 'UNKNOWN_ERROR', message: '發生未知錯誤' },
                };
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            return {
                success: false,
                error: { code: 'NETWORK_ERROR', message: '網路連線失敗，請稍後再試' },
            };
        }
    }

    // Auth
    getMe(token: string) {
        return this.request<{ id: string; email: string; nickname: string | null; planType: string }>('/me', { token });
    }

    updateProfile(token: string, data: { nickname?: string; preferences?: unknown }) {
        return this.request('/profile', { method: 'POST', token, body: data });
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

    // Reports
    createReport(token: string, data: unknown) {
        return this.request('/reports', { method: 'POST', token, body: data });
    }

    getSafetyRules() {
        return this.request<{ version: string; rules: string[] }>('/reports/safety');
    }
}

export const api = new ApiClient(API_BASE_URL);
