'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';
import { SPORT_NAMES, LEVEL_NAMES } from '@/lib/constants';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Stack,
    Chip,
    LinearProgress,
    Avatar,
    Grid,
    CircularProgress,
    Alert,
    Paper,
    Divider,
    TextField,
    IconButton,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    MenuItem
} from '@mui/material';
import {
    CalendarToday,
    LocationOn,
    Group as GroupIcon,
    ArrowBack,
    Security,
    Send as SendIcon,
    ChatBubbleOutline,
    Share as ShareIcon,
    ThumbUp,
    ThumbDown,
    Flag
} from '@mui/icons-material';
import SafetyNoticeDialog from '@/app/components/SafetyNoticeDialog';
import ShareButtons from '@/app/components/ShareButtons';
import CrownBadge from '@/app/components/CrownBadge';

interface GroupDetail {
    id: string;
    sportType: string;
    title: string;
    description: string | null;
    time: string;
    location: string;
    level: string;
    capacity: number;
    currentCount: number;
    status: string;
    tags: string[];
    createdBy: { id: string; nickname: string | null; email: string; attendedCount: number; noShowCount: number; planType?: string; positiveRatings?: number; negativeRatings?: number };
    members: Array<{
        user: { id: string; nickname: string | null; email: string; attendedCount: number; noShowCount: number; planType?: string; positiveRatings?: number; negativeRatings?: number };
        status: string;
        joinedAt: string;
        isAttended: boolean | null;
    }>;
}

interface CommentDetail {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; nickname: string | null; email: string };
}

export default function GroupDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user, getToken } = useAuth();

    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [comments, setComments] = useState<CommentDetail[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, boolean | null>>({});
    const [myRatings, setMyRatings] = useState<Record<string, boolean>>({});
    const [showSafetyNotice, setShowSafetyNotice] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showReportRules, setShowReportRules] = useState(false);
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportRulesAccepted, setReportRulesAccepted] = useState(false);
    const [reportTarget, setReportTarget] = useState<'GROUP' | 'USER'>('GROUP');
    const [reportTargetUserId, setReportTargetUserId] = useState('');
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [reportLoading, setReportLoading] = useState(false);

    useEffect(() => {
        fetchGroup();
        fetchComments();
        fetchRatings();

        // Socket.io for Real-time Comments
        const socket = getSocket();
        const groupRoom = `group:${id}`;
        joinRoom(groupRoom);

        const handleNewComment = (comment: CommentDetail & { groupId: string }) => {
            if (comment.groupId === id) {
                setComments(prev => {
                    // 避免重複加入
                    if (prev.some(c => c.id === comment.id)) return prev;
                    return [...prev, comment];
                });
            }
        };

        socket.on('new_comment', handleNewComment);

        return () => {
            socket.off('new_comment', handleNewComment);
            leaveRoom(groupRoom);
        };
    }, [id]);

    const fetchComments = async () => {
        const response = await api.getGroupComments(id);
        if (response.success && response.data) {
            setComments(response.data);
        }
    };

    const fetchRatings = async () => {
        if (!user) return;
        const token = await getToken();
        if (!token) return;
        const res = await api.getGroupRatings(token, id);
        if (res.success && res.data) setMyRatings(res.data);
    };

    const handleRate = async (ratedUserId: string, isPositive: boolean) => {
        const token = await getToken();
        if (!token) return;
        const res = await api.rateGroupMember(token, id, ratedUserId, isPositive);
        if (res.success) {
            setMyRatings(prev => ({ ...prev, [ratedUserId]: isPositive }));
            setSnackbarMessage(isPositive ? '已給予 👍' : '已給予 👎');
        }
    };

    const handleSendComment = async () => {
        if (!user || !newComment.trim()) return;

        setCommentLoading(true);
        const token = await getToken();
        if (token) {
            const response = await api.postGroupComment(token, id, newComment);
            if (response.success) {
                setNewComment('');
                // 由於 socket 會推播回來，這裡不需要立即加進 state 除非需要 optimistic UI
            } else {
                setError(response.error?.message || '留言失敗');
            }
        }
        setCommentLoading(false);
    };

    const fetchGroup = async () => {
        setLoading(true);
        const token = await getToken();
        const response = await api.getGroup(id, token || undefined);

        if (response.success && response.data) {
            const groupData = response.data as GroupDetail;
            setGroup(groupData);

            const initialAttendance: Record<string, boolean | null> = {};
            groupData.members.forEach(m => {
                if (m.status === 'JOINED') {
                    initialAttendance[m.user.id] = m.isAttended;
                }
            });
            setAttendanceRecords(initialAttendance);
        } else {
            setError(response.error?.message || '無法載入揪團');
        }
        setLoading(false);
    };

    const handleJoin = async () => {
        if (!user) {
            setError('請先登入');
            return;
        }
        // 先彈出安全須知
        setShowSafetyNotice(true);
    };

    const confirmJoin = async () => {
        setShowSafetyNotice(false);
        setActionLoading(true);
        setError(null);

        const token = await getToken();
        const response = await api.joinGroup(token!, id);

        if (response.success) {
            await fetchGroup();
        } else {
            setError(response.error?.message || '加入失敗');
        }
        setActionLoading(false);
    };

    const handleLeave = async () => {
        if (!user) return;

        setActionLoading(true);
        setError(null);

        const token = await getToken();
        const response = await api.leaveGroup(token!, id);

        if (response.success) {
            await fetchGroup();
        } else {
            setError(response.error?.message || '退出失敗');
        }
        setActionLoading(false);
    };

    const handleWaitlist = async () => {
        if (!user) {
            setError('請先登入');
            return;
        }

        if (user.planType !== 'PLUS') {
            router.push('/pricing');
            return;
        }

        setActionLoading(true);
        setError(null);

        const token = await getToken();
        const response = await api.waitlistGroup(token!, id);

        if (response.success) {
            await fetchGroup();
        } else {
            setError(response.error?.message || '候補失敗');
        }
        setActionLoading(false);
    };

    const handleShare = async () => {
        if (!group) return;

        const shareData = {
            title: `LUMO - ${group.title}`,
            text: `🏀 快來一起打 ${SPORT_NAMES[group.sportType] || group.sportType} 吧！\n時間：${new Date(group.time).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit' })}\n地點：${group.location}`,
            url: window.location.href,
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setSnackbarMessage('連結已複製到剪貼簿！');
            }
        } catch (err) {
            console.error('Share failed', err);
            // Ignore user cancellation errors
        }
    };

    const handleCancelGroup = async () => {
        setShowCancelConfirm(false);
        setActionLoading(true);
        setError(null);

        const token = await getToken();
        const response = await api.cancelGroup(token!, id);

        if (response.success) {
            setSnackbarMessage('揪團已取消');
            await fetchGroup();
        } else {
            setError(response.error?.message || '取消失敗');
        }
        setActionLoading(false);
    };

    const handleAttendanceChange = (userId: string, isAttended: boolean | null) => {
        setAttendanceRecords(prev => ({ ...prev, [userId]: isAttended }));
    };

    const handleSaveAttendance = async () => {
        if (!group) return;
        setActionLoading(true);
        const token = await getToken();
        const records = Object.entries(attendanceRecords).map(([userId, isAttended]) => ({ userId, isAttended }));

        const response = await api.updateGroupAttendance(token!, group.id, records);
        if (response.success) {
            setSnackbarMessage('出缺席紀錄已儲存！');
            await fetchGroup();
        } else {
            setError(response.error?.message || '儲存失敗');
        }
        setActionLoading(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'BEGINNER': return 'success';
            case 'INTERMEDIATE': return 'warning';
            case 'ADVANCED': return 'error';
            default: return 'default';
        }
    };

    const actionPillSx = {
        borderRadius: 999,
        minHeight: 44,
        px: 2.5,
        fontWeight: 700,
        textTransform: 'none' as const,
        letterSpacing: '0.02em',
        borderWidth: 1.5,
        '&.MuiButton-outlined': { borderWidth: 1.5 },
    };

    const statusPillSx = {
        height: 44,
        borderRadius: 999,
        px: 1.6,
        fontWeight: 700,
        fontSize: '0.9rem',
        letterSpacing: '0.02em',
        borderWidth: 1.5,
    };

    // 計算使用者狀態
    const userMember = group?.members.find((m) => m.user.id === user?.id);
    const isJoined = userMember?.status === 'JOINED';
    const isWaitlist = userMember?.status === 'WAITLIST';
    const isCreator = group?.createdBy.id === user?.id;
    const isFull = group ? group.currentCount >= group.capacity : false;
    const joinedMembers = group?.members.filter((m) => m.status === 'JOINED') || [];
    const waitlistMembers = group?.members.filter((m) => m.status === 'WAITLIST') || [];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!group) {
        return (
            <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
                <Typography variant="h2" mb={2}>😕</Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                    {error || '找不到此揪團'}
                </Typography>
                <Button variant="contained" component={Link} href="/groups">
                    返回列表
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4, pb: 10 }}>
            <Link href="/groups" style={{ textDecoration: 'none' }}>
                <Button
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2, color: 'text.secondary' }}
                >
                    返回列表
                </Button>
            </Link>

            <Paper sx={{ p: 4, mb: 4, borderRadius: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                    <Box>
                        <Chip
                            label={SPORT_NAMES[group.sportType]}
                            color="primary"
                            variant="filled"
                            sx={{ mr: 1 }}
                        />
                        <Chip
                            label={LEVEL_NAMES[group.level]}
                            // @ts-ignore
                            color={getLevelColor(group.level)}
                            variant="outlined"
                        />
                    </Box>
                    <ShareButtons
                        url={typeof window !== 'undefined' ? window.location.href : ''}
                        title={`LUMO - ${group.title}`}
                        text={`🏀 快來一起打 ${SPORT_NAMES[group.sportType] || group.sportType} 吧！\n時間：${new Date(group.time).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit' })}\n地點：${group.location}`}
                    />
                </Stack>

                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {group.title}
                </Typography>

                {group.tags && group.tags.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={1} mb={3}>
                        {group.tags.map((tag: string) => (
                            <Chip key={tag} label={tag} size="small" variant="filled" sx={{ bgcolor: 'action.hover', color: 'primary.main', fontWeight: 'bold' }} />
                        ))}
                    </Stack>
                )}

                {group.description && (
                    <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                        {group.description}
                    </Typography>
                )}

                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main' }}>
                                <CalendarToday />
                            </Avatar>
                            <Box>
                                <Typography variant="caption" color="text.secondary">時間</Typography>
                                <Typography variant="body1" fontWeight="medium">{formatDate(group.time)}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main' }}>
                                <LocationOn />
                            </Avatar>
                            <Box>
                                <Typography variant="caption" color="text.secondary">地點</Typography>
                                <Typography variant="body1" fontWeight="medium">{group.location}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">參與人數</Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {group.currentCount}/{group.capacity} 人
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={(group.currentCount / group.capacity) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
                )}

                <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
                    {!user && (
                        <Button variant="contained" component={Link} href="/" sx={actionPillSx}>
                            登入後加入揪團
                        </Button>
                    )}

                    {user && !isJoined && !isWaitlist && !isFull && (
                        <Button
                            variant="contained"
                            onClick={handleJoin}
                            disabled={actionLoading}
                            sx={actionPillSx}
                        >
                            {actionLoading ? '處理中...' : '加入揪團'}
                        </Button>
                    )}

                    {user && !isJoined && !isWaitlist && isFull && (
                        <Button
                            variant="outlined"
                            onClick={handleWaitlist}
                            disabled={actionLoading}
                            sx={actionPillSx}
                        >
                            {user.planType === 'PLUS' ? (
                                actionLoading ? '處理中...' : '加入候補'
                            ) : (
                                '🔓 升級 PLUS 可候補'
                            )}
                        </Button>
                    )}

                    {user && isJoined && !isCreator && (
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleLeave}
                            disabled={actionLoading}
                            sx={actionPillSx}
                        >
                            {actionLoading ? '處理中...' : '退出揪團'}
                        </Button>
                    )}

                    {user && isWaitlist && (
                        <Chip label="您在候補名單中" color="warning" variant="outlined" sx={statusPillSx} />
                    )}

                    {isCreator && group.status !== 'CANCELLED' && (
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={actionLoading}
                            sx={actionPillSx}
                        >
                            {actionLoading ? '處理中...' : '取消揪團'}
                        </Button>
                    )}

                    {isCreator && group.status === 'CANCELLED' && (
                        <Chip label="此揪團已取消" color="error" variant="outlined" sx={statusPillSx} />
                    )}

                    {isCreator && group.status !== 'CANCELLED' && (
                        <Chip label="您是揪團發起人" color="primary" variant="outlined" sx={statusPillSx} />
                    )}

                    {user && (
                        <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<Flag />}
                            onClick={() => { setReportRulesAccepted(false); setShowReportRules(true); }}
                            sx={{ ...actionPillSx, color: 'text.secondary', borderColor: 'divider' }}
                        >
                            檢舉
                        </Button>
                    )}
                </Stack>
            </Paper>

            <Card sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <GroupIcon color="action" />
                            <Typography variant="h6">
                                參與成員 ({joinedMembers.length})
                            </Typography>
                        </Stack>

                        {isCreator && group && (new Date(group.time) < new Date() || group.status === 'COMPLETED') && (
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={handleSaveAttendance}
                                disabled={actionLoading}
                            >
                                儲存紀錄
                            </Button>
                        )}
                    </Stack>

                    <Stack spacing={2}>
                        {joinedMembers.map((member, index) => (
                            <Stack
                                key={member.user.id}
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}
                            >
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar component={Link} href={`/users/${member.user.id}`} sx={{ bgcolor: 'secondary.main', textDecoration: 'none', cursor: 'pointer' }}>
                                        {(member.user.nickname || member.user.email)[0].toUpperCase()}
                                    </Avatar>
                                    <Box>
                                        <Typography component={Link} href={`/users/${member.user.id}`} variant="body1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                                            {member.user.nickname || member.user.email.split('@')[0]}
                                            <CrownBadge isPlus={member.user.planType === 'PLUS'} />
                                            {member.user.id === group.createdBy.id && (
                                                <Typography component="span" variant="caption" color="primary" sx={{ ml: 1, fontWeight: 'bold' }}>
                                                    發起人
                                                </Typography>
                                            )}
                                            {(member.user.attendedCount + member.user.noShowCount) > 0 && (
                                                <Chip
                                                    size="small"
                                                    label={`🔥 ${Math.round((member.user.attendedCount / (member.user.attendedCount + member.user.noShowCount)) * 100)}%`}
                                                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            )}
                                            {((member.user.positiveRatings || 0) + (member.user.negativeRatings || 0)) > 0 && (
                                                <Chip
                                                    size="small"
                                                    label={`👍 ${member.user.positiveRatings || 0}`}
                                                    sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }}
                                                    color="info"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {index === 0 ? '第一位' : `第 ${index + 1} 位`}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Stack direction="column" spacing={0.5} alignItems="flex-end">
                                    {isCreator && group && (new Date(group.time) < new Date() || group.status === 'COMPLETED') && member.user.id !== user?.id && (
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant={attendanceRecords[member.user.id] === true ? "contained" : "outlined"}
                                                color="success"
                                                onClick={() => handleAttendanceChange(member.user.id, true)}
                                                sx={{ minWidth: 48, px: 1 }}
                                            >
                                                出席
                                            </Button>
                                            <Button
                                                size="small"
                                                variant={attendanceRecords[member.user.id] === false ? "contained" : "outlined"}
                                                color="error"
                                                onClick={() => handleAttendanceChange(member.user.id, false)}
                                                sx={{ minWidth: 48, px: 1 }}
                                            >
                                                缺席
                                            </Button>
                                        </Stack>
                                    )}
                                    {user && member.user.id !== user.id && isJoined
                                        && (new Date(group.time) < new Date() || group.status === 'COMPLETED') && (
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                color={myRatings[member.user.id] === true ? 'success' : 'default'}
                                                onClick={() => handleRate(member.user.id, true)}
                                            >
                                                <ThumbUp fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color={myRatings[member.user.id] === false ? 'error' : 'default'}
                                                onClick={() => handleRate(member.user.id, false)}
                                            >
                                                <ThumbDown fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    )}
                                </Stack>
                            </Stack>
                        ))}
                    </Stack>

                    {waitlistMembers.length > 0 && (
                        <>
                            <Divider sx={{ my: 4 }} />
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                候補名單 ({waitlistMembers.length})
                            </Typography>
                            <Stack spacing={1}>
                                {waitlistMembers.map((member, index) => (
                                    <Stack
                                        key={member.user.id}
                                        direction="row"
                                        alignItems="center"
                                        spacing={2}
                                        sx={{ p: 1 }}
                                    >
                                        <Avatar component={Link} href={`/users/${member.user.id}`} sx={{ width: 32, height: 32, fontSize: '0.875rem', textDecoration: 'none', cursor: 'pointer' }}>
                                            {index + 1}
                                        </Avatar>
                                        <Typography component={Link} href={`/users/${member.user.id}`} color="text.secondary" sx={{ textDecoration: 'none' }}>
                                            {member.user.nickname || member.user.email.split('@')[0]}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 留言板 */}
            <Card sx={{ borderRadius: 4, mt: 4 }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" alignItems="center" gap={1} mb={3}>
                        <ChatBubbleOutline color="action" />
                        <Typography variant="h6">留言板 ({comments.length})</Typography>
                    </Stack>

                    <Stack spacing={3} sx={{ mb: 4, maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                        {comments.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                目前還沒有討論，來當第一個留言的人吧！
                            </Typography>
                        ) : (
                            comments.map((comment) => (
                                <Stack key={comment.id} direction="row" spacing={2} alignItems="flex-start">
                                    <Avatar component={Link} href={`/users/${comment.user.id}`} sx={{ bgcolor: comment.user.id === group.createdBy.id ? 'primary.main' : 'secondary.main', width: 40, height: 40, textDecoration: 'none', cursor: 'pointer' }}>
                                        {(comment.user.nickname || comment.user.email)[0].toUpperCase()}
                                    </Avatar>
                                    <Box sx={{
                                        bgcolor: 'background.default',
                                        px: 2,
                                        py: 1.5,
                                        borderRadius: 3,
                                        borderTopLeftRadius: 0,
                                        maxWidth: '85%'
                                    }}>
                                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                            <Typography component={Link} href={`/users/${comment.user.id}`} variant="subtitle2" fontWeight="bold" sx={{ textDecoration: 'none', color: 'inherit' }}>
                                                {comment.user.nickname || comment.user.email.split('@')[0]}
                                            </Typography>
                                            {comment.user.id === group.createdBy.id && (
                                                <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                                                    (發起人)
                                                </Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary">
                                                ・{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {comment.content}
                                        </Typography>
                                    </Box>
                                </Stack>
                            ))
                        )}
                    </Stack>

                    {user ? (
                        <Stack direction="row" spacing={2} alignItems="flex-end">
                            <TextField
                                fullWidth
                                placeholder="問問大家有沒有帶球、集合地點等細節..."
                                variant="outlined"
                                size="small"
                                multiline
                                maxRows={3}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={commentLoading}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendComment();
                                    }
                                }}
                            />
                            <IconButton
                                color="primary"
                                onClick={handleSendComment}
                                disabled={!newComment.trim() || commentLoading}
                                sx={{ bgcolor: 'action.hover' }}
                            >
                                <SendIcon />
                            </IconButton>
                        </Stack>
                    ) : (
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            請登入後參與討論
                        </Typography>
                    )}
                </CardContent>
            </Card>

            <Snackbar
                open={!!snackbarMessage}
                autoHideDuration={3000}
                onClose={() => setSnackbarMessage(null)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
            <SafetyNoticeDialog
                open={showSafetyNotice}
                onConfirm={confirmJoin}
                onCancel={() => setShowSafetyNotice(false)}
            />
            <Dialog open={showCancelConfirm} onClose={() => setShowCancelConfirm(false)}>
                <DialogTitle>確定要取消揪團嗎？</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        取消後所有成員將被移除，此操作無法復原。
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCancelConfirm(false)}>返回</Button>
                    <Button onClick={handleCancelGroup} color="error" variant="contained">
                        確定取消
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 檢舉規則 Dialog */}
            <Dialog open={showReportRules} onClose={() => setShowReportRules(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>📋 檢舉須知</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Typography variant="subtitle2" fontWeight="bold">✅ 可檢舉的行為：</Typography>
                        <Stack spacing={0.5} sx={{ pl: 2 }}>
                            {['騷擾、歧視或不當言論', '惡意放鴿子（約好卻不出席）', '詐騙行為或金錢糾紛', '冒充身份', '危害人身安全之行為'].map(r => (
                                <Typography key={r} variant="body2" color="text.secondary">• {r}</Typography>
                            ))}
                        </Stack>
                        <Typography variant="subtitle2" fontWeight="bold">⚠️ 注意事項：</Typography>
                        <Stack spacing={0.5} sx={{ pl: 2 }}>
                            {['每則檢舉由管理員人工審核', '經確認的檢舉將扣除被檢舉者信譽分', '請提供具體事實描述，增加審核效率'].map(r => (
                                <Typography key={r} variant="body2" color="text.secondary">• {r}</Typography>
                            ))}
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <input type="checkbox" checked={reportRulesAccepted} onChange={e => setReportRulesAccepted(e.target.checked)} />
                            <Typography variant="body2">我已閱讀並理解以上規則</Typography>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowReportRules(false)} color="inherit">取消</Button>
                    <Button
                        variant="contained"
                        disabled={!reportRulesAccepted}
                        onClick={() => {
                            const firstReportableMemberId = joinedMembers.find((m) => m.user.id !== user?.id)?.user.id || '';
                            setShowReportRules(false);
                            if (isCreator) {
                                setReportTarget('USER');
                                setReportTargetUserId(firstReportableMemberId);
                            } else {
                                setReportTarget('GROUP');
                                setReportTargetUserId('');
                            }
                            setReportReason('');
                            setReportDetails('');
                            setShowReportForm(true);
                        }}
                    >
                        下一步
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 檢舉表單 Dialog */}
            <Dialog open={showReportForm} onClose={() => setShowReportForm(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>🚩 提交檢舉</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            label="檢舉對象"
                            select
                            fullWidth
                            value={reportTarget === 'GROUP' ? '__GROUP__' : reportTargetUserId}
                            onChange={e => {
                                if (e.target.value === '__GROUP__') {
                                    setReportTarget('GROUP');
                                    setReportTargetUserId('');
                                } else {
                                    setReportTarget('USER');
                                    setReportTargetUserId(e.target.value);
                                }
                            }}
                        >
                            {!isCreator && <MenuItem value="__GROUP__">整個揪團</MenuItem>}
                            {joinedMembers.filter(m => m.user.id !== user?.id).map(m => (
                                <MenuItem key={m.user.id} value={m.user.id}>
                                    {m.user.nickname || m.user.email.split('@')[0]}
                                    {m.user.id === group?.createdBy.id ? ' (發起人)' : ''}
                                </MenuItem>
                            ))}
                            {joinedMembers.filter(m => m.user.id !== user?.id).length === 0 && (
                                <MenuItem value="" disabled>目前無可檢舉對象</MenuItem>
                            )}
                        </TextField>
                        <TextField
                            label="檢舉原因"
                            select
                            fullWidth
                            required
                            value={reportReason}
                            onChange={e => setReportReason(e.target.value)}
                        >
                            {['騷擾或不當言論', '惡意放鴿子', '詐騙或金錢糾紛', '冒充身份', '危害安全', '其他'].map(r => (
                                <MenuItem key={r} value={r}>{r}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="詳細說明（選填）"
                            multiline
                            rows={3}
                            fullWidth
                            value={reportDetails}
                            onChange={e => setReportDetails(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowReportForm(false)} color="inherit">取消</Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={!reportReason || reportLoading || (reportTarget === 'USER' && !reportTargetUserId)}
                        onClick={async () => {
                            setReportLoading(true);
                            const token = await getToken();
                            if (!token) {
                                setReportLoading(false);
                                return;
                            }
                            if (isCreator && reportTarget === 'GROUP') {
                                setSnackbarMessage('發起人請選擇成員作為檢舉對象');
                                setReportLoading(false);
                                return;
                            }
                            if (reportTarget === 'USER' && !reportTargetUserId) {
                                setSnackbarMessage('請先選擇檢舉對象');
                                setReportLoading(false);
                                return;
                            }
                            const targetId = reportTarget === 'GROUP' ? group!.id : reportTargetUserId;
                            const res = await api.createReport(token, {
                                targetType: reportTarget,
                                targetId,
                                reason: reportReason,
                                details: reportDetails || undefined,
                            });
                            if (res.success) {
                                setSnackbarMessage('檢舉已送出，我們會盡快處理');
                                setShowReportForm(false);
                            } else {
                                setSnackbarMessage((res as any).error?.message || '檢舉失敗');
                            }
                            setReportLoading(false);
                        }}
                    >
                        {reportLoading ? '送出中...' : '送出檢舉'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
