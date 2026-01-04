'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
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
    Divider
} from '@mui/material';
import {
    CalendarToday,
    LocationOn,
    Group as GroupIcon,
    ArrowBack,
    Security
} from '@mui/icons-material';

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
    createdBy: { id: string; nickname: string | null; email: string };
    members: Array<{
        user: { id: string; nickname: string | null; email: string };
        status: string;
        joinedAt: string;
    }>;
}

const SPORT_NAMES: Record<string, string> = {
    BASKETBALL: '籃球',
    RUNNING: '跑步',
    BADMINTON: '羽球',
    TABLE_TENNIS: '桌球',
    GYM: '健身',
};

const LEVEL_NAMES: Record<string, string> = {
    BEGINNER: '初學者',
    INTERMEDIATE: '中級',
    ADVANCED: '進階',
    ANY: '不限',
};

export default function GroupDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user, getToken } = useAuth();

    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchGroup();
    }, [id]);

    const fetchGroup = async () => {
        setLoading(true);
        const token = await getToken();
        const response = await api.getGroup(id, token || undefined);

        if (response.success && response.data) {
            setGroup(response.data as GroupDetail);
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
                    <Chip
                        label={SPORT_NAMES[group.sportType]}
                        color="primary"
                        variant="filled"
                    />
                    <Chip
                        label={LEVEL_NAMES[group.level]}
                        // @ts-ignore
                        color={getLevelColor(group.level)}
                        variant="outlined"
                    />
                </Stack>

                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {group.title}
                </Typography>

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

                <Stack direction="row" flexWrap="wrap" gap={2}>
                    {!user && (
                        <Button variant="contained" component={Link} href="/">
                            登入後加入揪團
                        </Button>
                    )}

                    {user && !isJoined && !isWaitlist && !isFull && (
                        <Button
                            variant="contained"
                            onClick={handleJoin}
                            disabled={actionLoading}
                        >
                            {actionLoading ? '處理中...' : '加入揪團'}
                        </Button>
                    )}

                    {user && !isJoined && !isWaitlist && isFull && (
                        <Button
                            variant="outlined"
                            onClick={handleWaitlist}
                            disabled={actionLoading}
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
                        >
                            {actionLoading ? '處理中...' : '退出揪團'}
                        </Button>
                    )}

                    {user && isWaitlist && (
                        <Chip label="您在候補名單中" color="warning" variant="outlined" />
                    )}

                    {isCreator && (
                        <Chip label="您是揪團發起人" color="primary" variant="outlined" />
                    )}

                    <Button startIcon={<Security />} component={Link} href="/safety" color="inherit">
                        安全提醒
                    </Button>
                </Stack>
            </Paper>

            <Card sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" alignItems="center" gap={1} mb={3}>
                        <GroupIcon color="action" />
                        <Typography variant="h6">
                            參與成員 ({joinedMembers.length})
                        </Typography>
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
                                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                        {(member.user.nickname || member.user.email)[0].toUpperCase()}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body1" fontWeight="medium">
                                            {member.user.nickname || member.user.email.split('@')[0]}
                                            {member.user.id === group.createdBy.id && (
                                                <Typography component="span" variant="caption" color="primary" sx={{ ml: 1, fontWeight: 'bold' }}>
                                                    發起人
                                                </Typography>
                                            )}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {index === 0 ? '第一位' : `第 ${index + 1} 位`}
                                        </Typography>
                                    </Box>
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
                                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                            {index + 1}
                                        </Avatar>
                                        <Typography color="text.secondary">
                                            {member.user.nickname || member.user.email.split('@')[0]}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
}
