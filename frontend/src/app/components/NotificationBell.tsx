'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    IconButton,
    Badge,
    Popover,
    Box,
    Typography,
    Stack,
    Button,
    Divider,
    CircularProgress,
} from '@mui/material';
import { Notifications, NotificationsNone, DoneAll } from '@mui/icons-material';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    body: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const { user, getToken } = useAuth();
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        const token = await getToken();
        if (!token) return;
        const res = await api.getUnreadCount(token);
        if (res.success && res.data) {
            setUnreadCount(res.data.unreadCount);
        }
    }, [user, getToken]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const token = await getToken();
        if (!token) return;
        const res = await api.getNotifications(token);
        if (res.success && res.data) {
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        }
        setLoading(false);
    }, [user, getToken]);

    // Poll unread count every 30 seconds
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        fetchNotifications();
    };

    const handleClose = () => setAnchorEl(null);

    const handleClick = async (notif: NotificationItem) => {
        if (!notif.isRead) {
            const token = await getToken();
            if (token) {
                await api.markNotificationRead(token, notif.id);
                setUnreadCount((c) => Math.max(0, c - 1));
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
                );
            }
        }
        handleClose();
        if (notif.link) router.push(notif.link);
    };

    const handleMarkAllRead = async () => {
        const token = await getToken();
        if (!token) return;
        await api.markAllNotificationsRead(token);
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '剛剛';
        if (mins < 60) return `${mins} 分鐘前`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} 小時前`;
        const days = Math.floor(hours / 24);
        return `${days} 天前`;
    };

    if (!user) return null;

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton
                onClick={handleOpen}
                size="small"
                sx={{ color: 'text.primary' }}
            >
                <Badge
                    badgeContent={unreadCount}
                    color="error"
                    max={99}
                    sx={{
                        '& .MuiBadge-badge': {
                            fontSize: '0.65rem',
                            height: 18,
                            minWidth: 18,
                        },
                    }}
                >
                    {unreadCount > 0 ? (
                        <Notifications />
                    ) : (
                        <NotificationsNone />
                    )}
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        width: 360,
                        maxHeight: 480,
                        borderRadius: 3,
                        mt: 1,
                    },
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, pb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        🔔 通知
                    </Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            startIcon={<DoneAll />}
                            onClick={handleMarkAllRead}
                            sx={{ fontSize: '0.75rem' }}
                        >
                            全部已讀
                        </Button>
                    )}
                </Stack>
                <Divider />

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            目前沒有通知
                        </Typography>
                    </Box>
                ) : (
                    <Stack sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {notifications.map((notif) => (
                            <Box
                                key={notif.id}
                                onClick={() => handleClick(notif)}
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    cursor: 'pointer',
                                    bgcolor: notif.isRead ? 'transparent' : 'action.hover',
                                    borderLeft: notif.isRead ? 'none' : '3px solid',
                                    borderLeftColor: 'primary.main',
                                    transition: 'background 0.2s',
                                    '&:hover': { bgcolor: 'action.selected' },
                                }}
                            >
                                <Typography variant="body2" fontWeight={notif.isRead ? 'normal' : 'bold'}>
                                    {notif.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                                    {notif.body}
                                </Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                    {formatTime(notif.createdAt)}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Popover>
        </>
    );
}
