'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { api } from '@/lib/api-client';
import { getSocket } from '@/lib/socket';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown> | null;
    isRead: boolean;
    createdAt: string;
}

export function useNotifications() {
    const { user, getToken } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    // 取得未讀數量
    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        const token = await getToken();
        if (!token) return;
        const res = await api.getUnreadCount(token);
        if (res.success && res.data) {
            setUnreadCount(res.data.count);
        }
    }, [user, getToken]);

    // 取得通知列表
    const fetchNotifications = useCallback(async (page = 1) => {
        if (!user) return;
        setLoading(true);
        const token = await getToken();
        if (!token) { setLoading(false); return; }
        const res = await api.getNotifications(token, page);
        if (res.success && res.data) {
            if (page === 1) {
                setNotifications(res.data.items);
            } else {
                setNotifications(prev => [...prev, ...res.data!.items]);
            }
            setUnreadCount(res.data.unreadCount);
        }
        setLoading(false);
    }, [user, getToken]);

    // 標記單則已讀
    const markAsRead = useCallback(async (id: string) => {
        const token = await getToken();
        if (!token) return;
        await api.markNotificationRead(token, id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, [getToken]);

    // 全部標記已讀
    const markAllAsRead = useCallback(async () => {
        const token = await getToken();
        if (!token) return;
        await api.markAllNotificationsRead(token);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }, [getToken]);

    // 刪除所有已讀通知
    const deleteReadNotifications = useCallback(async () => {
        const token = await getToken();
        if (!token) return;
        const res = await api.deleteReadNotifications(token);
        if (res.success) {
            setNotifications(prev => prev.filter(n => !n.isRead));
        }
    }, [getToken]);

    // Socket.io 即時監聽 + 加入 user room
    useEffect(() => {
        if (!user) return;

        const socket = getSocket();

        // 加入使用者專屬 room
        socket.emit('join_user_room', user.id);

        const handleNotification = (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, [user]);

    // 登入後立即取得未讀數
    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    return {
        unreadCount,
        notifications,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteReadNotifications,
    };
}
