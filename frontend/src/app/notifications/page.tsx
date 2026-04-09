'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Container,
    Typography,
    Box,
    Stack,
    Paper,
    Button,
    IconButton,
    Chip,
    Skeleton,
    Divider,
} from '@mui/material';
import {
    ArrowBack,
    DoneAll,
    GroupAdd,
    GroupRemove,
    Cancel,
    AccessTime,
    EmojiEvents,
    Info,
    Circle,
    DeleteSweep,
    ChatBubbleOutline,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { shouldShowReadingEventNotification, isReadingEventNotifReadToday, markReadingEventNotifRead } from '@/lib/constants';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
    GROUP_JOIN: { icon: <GroupAdd />, color: '#4CAF50' },
    GROUP_LEAVE: { icon: <GroupRemove />, color: '#FF9800' },
    GROUP_FULL: { icon: <EmojiEvents />, color: '#FFD700' },
    GROUP_CANCELLED: { icon: <Cancel />, color: '#f44336' },
    GROUP_REMINDER: { icon: <AccessTime />, color: '#2196F3' },
    GROUP_COMMENT: { icon: <ChatBubbleOutline />, color: '#00BCD4' },
    WAITLIST_PROMOTED: { icon: <EmojiEvents />, color: '#9C27B0' },
    BADGE_UNLOCKED: { icon: <EmojiEvents />, color: '#FFD700' },
    SYSTEM: { icon: <Info />, color: '#607D8B' },
};

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes} 分鐘前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小時前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteReadNotifications,
    } = useNotifications();
    const [page, setPage] = useState(1);
    const [eventNotifRead, setEventNotifRead] = useState(true);

    // 檢查活動虛擬通知是否應顯示為未讀
    useEffect(() => {
        if (shouldShowReadingEventNotification()) {
            setEventNotifRead(isReadingEventNotifReadToday());
        }
    }, []);

    useEffect(() => {
        fetchNotifications(1);
    }, [fetchNotifications]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNotifications(nextPage);
    };

    const handleNotificationClick = (notification: any) => {
        // 虛擬活動通知特殊處理
        if (notification.id === 'reading-event-virtual') {
            markReadingEventNotifRead();
            setEventNotifRead(true);
            router.push('/sports/STUDY');
            return;
        }
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        // 如果通知有 groupId，跳轉到揪團詳情
        if (notification.data?.groupId) {
            router.push(`/groups/${notification.data.groupId}`);
        }
    };

    if (authLoading) {
        return (
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Skeleton variant="text" width={200} height={40} />
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2, mt: 2 }} />
                ))}
            </Container>
        );
    }

    if (!user) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    請先登入以查看通知
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton component={Link} href="/" sx={{ color: 'text.secondary' }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">
                        通知中心
                    </Typography>
                    {unreadCount > 0 && (
                        <Chip label={`${unreadCount} 則未讀`} color="error" size="small" />
                    )}
                </Stack>
                <Stack direction="row" spacing={1}>
                    {unreadCount > 0 && (
                        <Button
                            startIcon={<DoneAll />}
                            size="small"
                            onClick={markAllAsRead}
                            sx={{ color: 'text.secondary' }}
                        >
                            全部已讀
                        </Button>
                    )}
                    {notifications.some(n => n.isRead) && (
                        <Button
                            startIcon={<DeleteSweep />}
                            size="small"
                            color="error"
                            onClick={deleteReadNotifications}
                        >
                            清除已讀
                        </Button>
                    )}
                </Stack>
            </Stack>

            {/* Notification List */}
            {loading && notifications.length === 0 ? (
                <Stack spacing={2}>
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                    ))}
                </Stack>
            ) : notifications.length === 0 && !shouldShowReadingEventNotification() ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                        🔔 目前沒有通知
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        當有人加入你的揪團或活動即將開始時，你會在這裡收到通知
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={1}>
                    {/* 📚 讀家回憶虛擬活動通知 (4/7-4/17 每天 9:00 後顯示) */}
                    {shouldShowReadingEventNotification() && (
                        <Paper
                            elevation={0}
                            onClick={() => handleNotificationClick({ id: 'reading-event-virtual', isRead: eventNotifRead })}
                            sx={{
                                p: 2,
                                cursor: 'pointer',
                                borderRadius: 3,
                                bgcolor: eventNotifRead ? 'background.paper' : 'action.hover',
                                border: '1px solid',
                                borderColor: eventNotifRead ? 'divider' : 'primary.main',
                                transition: 'all 0.2s',
                                background: eventNotifRead
                                    ? undefined
                                    : 'linear-gradient(135deg, rgba(13,27,42,0.05) 0%, rgba(39,76,119,0.08) 100%)',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                    transform: 'translateX(4px)',
                                },
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'rgba(255,215,0,0.15)',
                                        color: '#FFD700',
                                        flexShrink: 0,
                                        mt: 0.5,
                                        fontSize: 20,
                                    }}
                                >
                                    🏆
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="subtitle2" fontWeight={eventNotifRead ? 'normal' : 'bold'} noWrap>
                                            📚 讀家回憶｜系所對抗賽進行中！
                                        </Typography>
                                        {!eventNotifRead && (
                                            <Circle sx={{ fontSize: 8, color: 'primary.main' }} />
                                        )}
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        衝上個人排行榜前三名，最高可獲 300 元禮券！4/17 中午截止，立即參賽 🔥
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                        活動期間：4/7 – 4/17
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}

                    {notifications.map((notification) => {
                        const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.SYSTEM;
                        return (
                            <Paper
                                key={notification.id}
                                elevation={0}
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    p: 2,
                                    cursor: 'pointer',
                                    borderRadius: 3,
                                    bgcolor: notification.isRead ? 'background.paper' : 'action.hover',
                                    border: '1px solid',
                                    borderColor: notification.isRead ? 'divider' : 'primary.main',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                        transform: 'translateX(4px)',
                                    },
                                }}
                            >
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: `${config.color}20`,
                                            color: config.color,
                                            flexShrink: 0,
                                            mt: 0.5,
                                        }}
                                    >
                                        {config.icon}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography variant="subtitle2" fontWeight={notification.isRead ? 'normal' : 'bold'} noWrap>
                                                {notification.title}
                                            </Typography>
                                            {!notification.isRead && (
                                                <Circle sx={{ fontSize: 8, color: 'primary.main' }} />
                                            )}
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {notification.body}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                            {timeAgo(notification.createdAt)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        );
                    })}

                    {/* Load More */}
                    <Box sx={{ textAlign: 'center', pt: 2 }}>
                        <Button
                            variant="text"
                            onClick={handleLoadMore}
                            disabled={loading}
                            sx={{ color: 'text.secondary' }}
                        >
                            {loading ? '載入中...' : '載入更多'}
                        </Button>
                    </Box>
                </Stack>
            )}
        </Container>
    );
}
