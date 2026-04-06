'use client';

import {
    Box,
    Typography,
    Button,
    Container,
    Stack,
    Card,
    CardContent,
    AppBar,
    Toolbar,
    Chip,
    Grid,
    Alert,
    Snackbar,
    Paper,
    useTheme,
    IconButton,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Divider,
    Skeleton,
    Badge
} from '@mui/material';
import {
    SportsBasketball,
    DirectionsRun,
    SportsTennis,
    FitnessCenter,
    School,
    Group,
    Security,
    DarkMode,
    LightMode,
    Instagram,
    SportsVolleyball,
    NightsStay,
    Restaurant,
    Notifications as NotificationsIcon,
    MenuBook,
    ChevronLeft,
    ChevronRight,
    Event,
    LocationOn,
    People,
    ArrowForward
} from '@mui/icons-material';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { usePwaInstallPrompt } from '@/hooks/usePwaInstallPrompt';
import { useWakeupBackend } from '@/hooks/useWakeupBackend';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useState, useEffect, useRef } from 'react';
import { useThemeMode } from '@/theme/ThemeModeContext';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import OnboardingDialog from './components/OnboardingDialog';
import { DISCLAIMER_TEXT } from './components/OnboardingDialog';
import DepartmentUpdateDialog, { DEPARTMENT_VERSION } from './components/DepartmentUpdateDialog';
import IdentityUpdateDialog from './components/IdentityUpdateDialog';
import PwaInstallDialog from './components/PwaInstallDialog';
import { useNotifications } from '@/hooks/useNotifications';
import { SPORT_NAMES, DEPARTMENTS } from '@/lib/constants';

const SPORTS = [
    { type: 'BASKETBALL', icon: <SportsBasketball fontSize="large" />, name: '籃球' },
    { type: 'RUNNING', icon: <DirectionsRun fontSize="large" />, name: '跑步' },
    { type: 'BADMINTON', icon: <SportsTennis fontSize="large" />, name: '羽球' },
    { type: 'TABLE_TENNIS', icon: <SportsTennis fontSize="large" />, name: '桌球' },
    { type: 'GYM', icon: <FitnessCenter fontSize="large" />, name: '健身' },
    { type: 'VOLLEYBALL', icon: <SportsVolleyball fontSize="large" />, name: '排球' },
    { type: 'TENNIS', icon: <SportsTennis fontSize="large" />, name: '網球' },
];

interface LatestGroup {
    id: string;
    sportType: string;
    title: string;
    description?: string | null;
    time: string;
    location: string;
    capacity: number;
    currentCount: number;
    status: string;
    createdAt?: string;
    createdBy: {
        nickname: string | null;
        email: string;
        planType?: string;
    };
}

const LATEST_GROUP_LIMIT = 8;
const LATEST_GROUP_FETCH_SIZE = 50;

function sortLatestGroups(groups: LatestGroup[]) {
    return [...groups].sort((a, b) => {
        const aTime = new Date(a.createdAt || a.time).getTime();
        const bTime = new Date(b.createdAt || b.time).getTime();
        return bTime - aTime;
    });
}

function normalizeLatestGroups(groups: LatestGroup[]) {
    return sortLatestGroups(groups).slice(0, LATEST_GROUP_LIMIT);
}

function formatLatestGroupTime(time: string) {
    return new Date(time).toLocaleString('zh-TW', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function LandingPage() {
    const theme = useTheme();
    const { user, loading, error, signIn, getToken, refreshUser } = useAuth();
    const { mode, toggleMode } = useThemeMode();
    const [showError, setShowError] = useState(false);

    // 預先喚醒後端 (Render 冷啟動優化)
    useWakeupBackend();

    // 註冊 Service Worker (PWA)
    useServiceWorker();

    const installPrompt = usePwaInstallPrompt();

    // Live Feed State
    const [liveFeed, setLiveFeed] = useState<{ message: string; open: boolean }>({ message: '', open: false });
    const [latestGroups, setLatestGroups] = useState<LatestGroup[]>([]);
    const [latestGroupsLoading, setLatestGroupsLoading] = useState(true);
    const latestGroupsRef = useRef<HTMLDivElement | null>(null);

    // Onboarding Dialog
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showIdentityUpdate, setShowIdentityUpdate] = useState(false);

    // Notifications
    const { unreadCount } = useNotifications();

    useEffect(() => {
        if (user && !user.onboardingCompleted) {
            setShowOnboarding(true);
        }
    }, [user]);

    useEffect(() => {
        if (!user || !user.onboardingCompleted) return;
        const missingIdentity = !user.department || !user.gender || !user.gradeLabel;
        setShowIdentityUpdate(missingIdentity);
    }, [user]);

    // Department version check
    const [showDeptUpdate, setShowDeptUpdate] = useState(false);
    useEffect(() => {
        if (!user || !user.onboardingCompleted) return;
        if (!user.department || !user.gender || !user.gradeLabel) return;
        const savedVersion = localStorage.getItem('lumo_dept_version');
        if (savedVersion && Number(savedVersion) >= DEPARTMENT_VERSION) return;
        // Check if user's current department is NOT in the new list
        if (!user.department || !DEPARTMENTS.includes(user.department)) {
            setShowDeptUpdate(true);
        } else {
            // Department is valid, mark as up-to-date
            localStorage.setItem('lumo_dept_version', String(DEPARTMENT_VERSION));
        }
    }, [user]);
    useEffect(() => {
        const fetchLatestGroups = async () => {
            setLatestGroupsLoading(true);
            const response = await api.getGroups({
                page: '1',
                pageSize: String(LATEST_GROUP_FETCH_SIZE),
                dateFrom: new Date().toISOString(),
            });

            if (response.success && response.data) {
                setLatestGroups(normalizeLatestGroups(response.data.items as LatestGroup[]));
            }

            setLatestGroupsLoading(false);
        };

        fetchLatestGroups();
    }, []);

    const scrollLatestGroups = (direction: 1 | -1) => {
        if (!latestGroupsRef.current) return;
        latestGroupsRef.current.scrollBy({
            left: direction * latestGroupsRef.current.clientWidth * 0.85,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        const socket = getSocket();
        joinRoom('groups');

        const handleGroupCreated = (group: any) => {
            const organizer = group.createdBy?.nickname || '有人';
            const sportName = SPORT_NAMES[group.sportType] || group.sportType;
            setLiveFeed({
                message: `⚡ ${organizer} 剛發起了 ${group.capacity} 人的${sportName}局`,
                open: true
            });
        };

        const handleGroupUpdated = (group: any) => {
            if (group.status === 'FULL') {
                setLiveFeed({
                    message: `🔥 一個揪團剛剛滿團了！`,
                    open: true
                });
            }
        };

        socket.on('group_created', handleGroupCreated);
        socket.on('group_updated', handleGroupUpdated);

        return () => {
            socket.off('group_created', handleGroupCreated);
            socket.off('group_updated', handleGroupUpdated);
            leaveRoom('groups');
        };
    }, []);

    useEffect(() => {
        const socket = getSocket();

        const handleLatestGroupCreated = (group: LatestGroup) => {
            setLatestGroups((prev) =>
                normalizeLatestGroups([
                    group,
                    ...prev.filter((item) => item.id !== group.id),
                ])
            );
        };

        const handleLatestGroupUpdated = (group: Partial<LatestGroup> & { id: string }) => {
            setLatestGroups((prev) =>
                prev.map((item) =>
                    item.id === group.id
                        ? {
                            ...item,
                            currentCount: group.currentCount ?? item.currentCount,
                            status: group.status ?? item.status,
                        }
                        : item
                )
            );
        };

        socket.on('group_created', handleLatestGroupCreated);
        socket.on('group_updated', handleLatestGroupUpdated);

        return () => {
            socket.off('group_created', handleLatestGroupCreated);
            socket.off('group_updated', handleLatestGroupUpdated);
        };
    }, []);

    useEffect(() => {
        if (error) {
            setShowError(true);
        }
    }, [error]);

    // Fetch Last Month's Top 3 Departments
    const [lastMonthTopDepts, setLastMonthTopDepts] = useState<any[]>([]);
    const [termsOpen, setTermsOpen] = useState(false);
    useEffect(() => {
        const fetchLastMonth = async () => {
            try {
                const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/leaderboard/departments?period=last_month`;
                const res = await fetch(url);
                const json = await res.json();
                if (json.success && json.data.departments) {
                    setLastMonthTopDepts(json.data.departments.slice(0, 3));
                }
            } catch (e) {
                console.error('Failed to fetch last month top depts', e);
            }
        };
        fetchLastMonth();
    }, []);

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
            {/* AppBar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    backdropFilter: 'blur(10px)',
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1} component={Link} href="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                LUMO NCNU
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                            {mode && (
                                <IconButton
                                    onClick={toggleMode}
                                    size="small"
                                    sx={{
                                        mr: 1,
                                        color: 'text.primary',
                                    }}
                                    aria-label={mode === 'dark' ? '切換成混迷洛日加亮模式' : '切換成混迷洛漂亮模式'}
                                >
                                    {mode === 'dark' ? <LightMode /> : <DarkMode />}
                                </IconButton>
                            )}
                            {user && (
                                <IconButton
                                    component={Link}
                                    href="/notifications"
                                    size="small"
                                    sx={{ color: 'text.primary' }}
                                    aria-label="通知"
                                >
                                    <Badge badgeContent={unreadCount} color="error" max={99}>
                                        <NotificationsIcon />
                                    </Badge>
                                </IconButton>
                            )}
                            <Button
                                component={Link}
                                href="/groups"
                                sx={{ color: 'text.primary' }}
                                aria-label="查看揪團列表"
                            >
                                揪團列表
                            </Button>

                            {loading ? (
                                <Skeleton variant="text" width={100} height={36} sx={{ borderRadius: 2 }} />
                            ) : user ? (
                                <Button
                                    component={Link}
                                    href="/profile"
                                    variant="outlined"
                                    sx={{ borderRadius: 4 }}
                                >
                                    {user.nickname || '我的帳號'}
                                </Button>
                            ) : (
                                <Button variant="contained" onClick={signIn}>登入</Button>
                            )}
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Hero Section */}
            <Box sx={{ pt: 15, pb: 10, position: 'relative', overflow: 'hidden' }}>
                {/* Background Blobs (Optional: Recreate with Box or keep CSS) */}
                <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <Typography variant="h2" gutterBottom component="h1" fontWeight="bold">
                        找到你的 <br />
                        <Box component="span" sx={{ color: 'primary.main' }}>運動夥伴</Box>
                    </Typography>
                    <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
                        暨南大學專屬運動配對平台。<br />
                        揪團、配對、一起動起來！
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            size="large"
                            component={Link}
                            href="/groups"
                            sx={{ fontSize: '1.2rem', py: 1.5, px: 4 }}
                        >
                            瀏覽揪團
                        </Button>
                        {!user ? (
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={signIn}
                                sx={{ fontSize: '1.2rem', py: 1.5, px: 4 }}
                            >
                                學生登入
                            </Button>
                        ) : (
                            <Button
                                variant="outlined"
                                size="large"
                                component={Link}
                                href="/create"
                                sx={{ fontSize: '1.2rem', py: 1.5, px: 4 }}
                            >
                                發起揪團
                            </Button>
                        )}
                        <Button
                            variant="outlined"
                            size="large"
                            component={Link}
                            href="/leaderboard"
                            sx={{ fontSize: '1.2rem', py: 1.5, px: 4, borderColor: 'warning.main', color: 'warning.main' }}
                        >
                            🏆 排行榜
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* Last Month Top 3 Banner */}
            <Container maxWidth="md" sx={{ mt: -6, mb: 6, position: 'relative', zIndex: 2 }}>
                <Card sx={{
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                    color: theme.palette.warning.contrastText || 'black',
                    boxShadow: `0 8px 32px ${theme.palette.mode === 'dark' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(255, 165, 0, 0.3)'}`,
                }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h5" fontWeight="900" gutterBottom>
                            🏆 上月最強熱血系所 🏆
                        </Typography>
                        {lastMonthTopDepts.length >= 3 ? (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    🥇 {lastMonthTopDepts[0].department}
                                </Typography>
                                <Typography variant="subtitle1" fontWeight="bold" color="rgba(0,0,0,0.7)">
                                    🥈 {lastMonthTopDepts[1].department}
                                </Typography>
                                <Typography variant="subtitle1" fontWeight="bold" color="rgba(0,0,0,0.7)">
                                    🥉 {lastMonthTopDepts[2].department}
                                </Typography>
                            </Stack>
                        ) : (
                            <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.7 }}>
                                暫無資料 — 本月結算後將於下月公佈
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Container>

            {/* Latest Groups */}
            <Container maxWidth="lg" sx={{ mb: 8 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 3 },
                        borderRadius: 5,
                        border: '1px solid',
                        borderColor: 'divider',
                        background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
                            : 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(245,243,255,0.92) 100%)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                        mb={3}
                    >
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                最新活動
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                左右滑動看看最近剛發布的揪團，
                                <Box component="br" sx={{ display: { xs: 'block', md: 'none' } }} />
                                找到順眼的就直接加入。
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
                                <IconButton
                                    onClick={() => scrollLatestGroups(-1)}
                                    sx={{ border: '1px solid', borderColor: 'divider' }}
                                    aria-label="向左查看最新活動"
                                >
                                    <ChevronLeft />
                                </IconButton>
                                <IconButton
                                    onClick={() => scrollLatestGroups(1)}
                                    sx={{ border: '1px solid', borderColor: 'divider' }}
                                    aria-label="向右查看最新活動"
                                >
                                    <ChevronRight />
                                </IconButton>
                            </Stack>
                            <Button
                                component={Link}
                                href="/groups"
                                endIcon={<ArrowForward />}
                                variant="outlined"
                                sx={{ borderRadius: 999 }}
                            >
                                查看全部
                            </Button>
                        </Stack>
                    </Stack>

                    {latestGroupsLoading ? (
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                overflowX: 'auto',
                                pb: 1,
                            }}
                        >
                            {[...Array(3)].map((_, index) => (
                                <Card
                                    key={index}
                                    sx={{
                                        minWidth: { xs: '78vw', sm: 320, md: 340 },
                                        borderRadius: 4,
                                        flex: '0 0 auto',
                                    }}
                                >
                                    <CardContent>
                                        <Stack spacing={1.5}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Skeleton variant="rounded" width={82} height={26} />
                                                <Skeleton variant="rounded" width={72} height={26} />
                                            </Stack>
                                            <Skeleton variant="text" width="88%" height={36} />
                                            <Skeleton variant="text" width="100%" height={20} />
                                            <Skeleton variant="text" width="72%" height={20} />
                                            <Skeleton variant="text" width="90%" height={20} />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    ) : latestGroups.length === 0 ? (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: { xs: 5, md: 4 },
                                borderRadius: 4,
                                textAlign: 'center',
                                bgcolor: 'background.default',
                            }}
                        >
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                目前還沒有新的活動
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                先去逛逛全部揪團，或成為第一個開團的人。
                            </Typography>
                            <Stack direction="row" spacing={1.5} justifyContent="center">
                                <Button component={Link} href="/groups" variant="contained">
                                    瀏覽揪團
                                </Button>
                                {user && (
                                    <Button component={Link} href="/create" variant="outlined">
                                        發起揪團
                                    </Button>
                                )}
                            </Stack>
                        </Paper>
                    ) : (
                        <>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: { xs: 'block', md: 'none' }, mb: 1.5, textAlign: 'center' }}
                            >
                                左右滑動查看更多活動
                            </Typography>
                            <Box
                                ref={latestGroupsRef}
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    overflowX: 'auto',
                                    scrollSnapType: 'x mandatory',
                                    pb: 1,
                                    px: { xs: 0.5, md: 0 },
                                    scrollBehavior: 'smooth',
                                    scrollbarWidth: 'thin',
                                    '&::-webkit-scrollbar': {
                                        height: 8,
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        borderRadius: 999,
                                        backgroundColor: theme.palette.action.selected,
                                    },
                                }}
                            >
                                {latestGroups.map((group) => {
                                    const remainingSpots = Math.max(group.capacity - group.currentCount, 0);
                                    const organizerName = group.createdBy.nickname || group.createdBy.email.split('@')[0];

                                    return (
                                        <Card
                                            key={group.id}
                                            component={Link}
                                            href={`/groups/${group.id}`}
                                            sx={{
                                                minWidth: { xs: '78vw', sm: 320, md: 340 },
                                                maxWidth: { xs: '78vw', sm: 340, md: 360 },
                                                flex: '0 0 auto',
                                                scrollSnapAlign: 'start',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                borderRadius: 4,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                background: theme.palette.mode === 'dark'
                                                    ? 'linear-gradient(180deg, rgba(27,22,46,0.96) 0%, rgba(39,31,63,0.98) 100%)'
                                                    : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(243,238,255,0.98) 100%)',
                                                transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: 8,
                                                    borderColor: 'primary.main',
                                                },
                                            }}
                                        >
                                            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2.5 }}>
                                                <Stack direction="row" justifyContent="space-between" spacing={1} mb={2} alignItems="flex-start">
                                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                                        <Chip
                                                            label={SPORT_NAMES[group.sportType] || group.sportType}
                                                            size="small"
                                                            color="primary"
                                                        />
                                                        {group.createdBy.planType === 'PLUS' && (
                                                            <Chip
                                                                label="PLUS 主揪"
                                                                size="small"
                                                                sx={{
                                                                    background: 'linear-gradient(135deg, #FFD36E 0%, #F5A623 100%)',
                                                                    color: '#201100',
                                                                    fontWeight: 700,
                                                                }}
                                                            />
                                                        )}
                                                    </Stack>
                                                    <Chip
                                                        label={group.status === 'FULL' ? '已額滿' : `剩 ${remainingSpots} 位`}
                                                        size="small"
                                                        color={group.status === 'FULL' ? 'default' : 'success'}
                                                        variant="outlined"
                                                    />
                                                </Stack>

                                                <Typography
                                                    variant="h6"
                                                    fontWeight="bold"
                                                    sx={{
                                                        mb: 1,
                                                        minHeight: 64,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {group.title}
                                                </Typography>

                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        mb: 2.5,
                                                        minHeight: 42,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {group.description?.trim() || '剛發布的新活動，點進去看看有沒有適合你的時間和地點。'}
                                                </Typography>

                                                <Stack spacing={1.25} sx={{ mt: 'auto' }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Event fontSize="small" color="action" />
                                                        <Typography variant="body2">{formatLatestGroupTime(group.time)}</Typography>
                                                    </Stack>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <LocationOn fontSize="small" color="action" />
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {group.location}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <People fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            {group.currentCount}/{group.capacity} 人
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            主揪：{organizerName}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </Box>
                        </>
                    )}
                </Paper>
            </Container>

            {/* Instagram & Sports Icons */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                {/* IG Icon & Subscription */}
                <Box sx={{ textAlign: 'center', mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="secondary"
                        disabled
                        sx={{ fontWeight: 'bold', borderRadius: 3, px: 3, py: 1 }}
                    >
                        👑 升級 PRO（敬請期待，暫不開放）
                    </Button>
                    <Button
                        href="https://www.instagram.com/lumo_dailyfit?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                        target="_blank"
                        startIcon={<Instagram />}
                        sx={{
                            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                            color: '#fff',
                            fontWeight: 'bold',
                            borderRadius: 3,
                            px: 3,
                            py: 1,
                            '&:hover': {
                                background: 'linear-gradient(45deg, #e6683c 0%, #dc2743 25%, #cc2366 50%, #bc1888 75%, #a01472 100%)',
                            }
                        }}
                    >
                        追蹤 LUMO／問題回報
                    </Button>
                </Box>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={6}>支援活動類型</Typography>
                <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={4}>
                    {SPORTS.map((sport) => (
                        <Paper
                            key={sport.name}
                            component={Link}
                            href={`/sports/${sport.type}`}
                            elevation={0}
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                minWidth: 100,
                                bgcolor: 'background.paper',
                                borderRadius: 4,
                                textDecoration: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                '&:hover': { transform: 'translateY(-5px)', transition: '0.3s', boxShadow: 3 }
                            }}
                        >
                            <Box sx={{ color: 'primary.main', mb: 1 }}>{sport.icon}</Box>
                            <Typography variant="body1" fontWeight="medium">{sport.name}</Typography>
                        </Paper>
                    ))}
                </Stack>
            </Container>

            {/* 社交活動專區 */}
            <Container maxWidth="sm" sx={{ pb: 4 }}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>社交活動專區</Typography>
                <Stack spacing={3}>
                    <Card
                        component={Link}
                        href="/sports/NIGHT_WALK"
                        sx={{
                            textDecoration: 'none',
                            borderRadius: 4,
                            background: mode === 'dark'
                                ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.secondary.dark} 100%)`
                                : `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                            transition: 'transform 0.3s',
                            '&:hover': { transform: 'translateY(-4px)' },
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <NightsStay sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                🌙 晚風漫遊
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                星空下走走聊聊，暨大最療癒的校園散步活動
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card
                        component={Link}
                        href="/sports/DINING"
                        sx={{
                            textDecoration: 'none',
                            borderRadius: 4,
                            background: mode === 'dark'
                                ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.error.dark} 100%)`
                                : `linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 100%)`,
                            transition: 'transform 0.3s',
                            '&:hover': { transform: 'translateY(-4px)' },
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Restaurant sx={{ fontSize: 40, color: theme.palette.error.main, mb: 1 }} />
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                🍽️ 飯飯之交
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                找人一起吃飯！有伴就更好吃
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card
                        component={Link}
                        href="/sports/STUDY"
                        sx={{
                            textDecoration: 'none',
                            borderRadius: 4,
                            background: mode === 'dark'
                                ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a3a5c 100%)`
                                : `linear-gradient(135deg, #e3f2fd 0%, #90caf9 100%)`,
                            transition: 'transform 0.3s',
                            '&:hover': { transform: 'translateY(-4px)' },
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <MenuBook sx={{ fontSize: 40, color: '#42A5F5', mb: 1 }} />
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                📚 讀家回憶
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                期中期末靜心衝刺，覓一知己共赴書海
                            </Typography>
                        </CardContent>
                    </Card>
                </Stack>
            </Container>

            {/* Nutrition Guide Card */}
            <Container maxWidth="sm" sx={{ pb: 4 }}>
                <Card
                    component={Link}
                    href="/nutrition"
                    sx={{
                        textDecoration: 'none',
                        borderRadius: 4,
                        transition: 'transform 0.3s',
                        '&:hover': { transform: 'translateY(-4px)' },
                        '&.MuiCard-root': {
                            background: mode === 'dark'
                                ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #2E7D32 100%)`
                                : `linear-gradient(135deg, #2E7D32 0%, #43A047 100%)`,
                        },
                    }}
                >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Restaurant sx={{ fontSize: 40, color: mode === 'dark' ? '#66BB6A' : '#C8E6C9', mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: mode === 'dark' ? undefined : '#fff' }}>
                            🍽️ 活動飲食指南
                        </Typography>
                        <Typography variant="body2" sx={{ color: mode === 'dark' ? 'text.secondary' : 'rgba(255,255,255,0.85)' }}>
                            依活動類型推薦最佳飲食與營養補給建議
                        </Typography>
                    </CardContent>
                </Card>
            </Container>

            {/* Features */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Grid container spacing={4}>
                    {[
                        { icon: <School fontSize="large" />, title: '校園限定', desc: '僅限暨南學生使用，安全有保障' },
                        { icon: <Group fontSize="large" />, title: '智慧配對', desc: '根據程度、時間、地點，找到最適合你的夥伴' },
                        { icon: <Security fontSize="large" />, title: '安全可靠', desc: '嚴格的身份驗證，杜絕校外人士' },
                    ].map((feature, idx) => (
                        <Grid size={{ xs: 12, md: 4 }} key={idx}>
                            <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                    <Box sx={{ color: 'secondary.main', mb: 2 }}>{feature.icon}</Box>
                                    <Typography variant="h6" gutterBottom>{feature.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">{feature.desc}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            <PwaInstallDialog
                open={installPrompt.open && !showOnboarding && !showIdentityUpdate && !showDeptUpdate && !termsOpen}
                platform={installPrompt.platform}
                canInstall={installPrompt.canInstall}
                onClose={installPrompt.dismiss}
                onInstall={installPrompt.install}
            />

            {/* Error Snackbar */}
            <Snackbar
                open={showError}
                autoHideDuration={6000}
                onClose={() => setShowError(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            {/* Live Feed Snackbar */}
            <Snackbar
                open={liveFeed.open}
                autoHideDuration={4000}
                onClose={() => setLiveFeed(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                message={liveFeed.message}
            />

            {/* Onboarding Dialog */}
            <OnboardingDialog
                open={showOnboarding}
                onComplete={() => {
                    setShowOnboarding(false);
                    refreshUser();
                }}
                getToken={getToken}
            />

            <IdentityUpdateDialog
                open={showIdentityUpdate && !showOnboarding}
                currentDepartment={user?.department || null}
                currentGender={user?.gender || null}
                currentGradeLabel={user?.gradeLabel || null}
                onComplete={() => {
                    setShowIdentityUpdate(false);
                    refreshUser();
                }}
                getToken={getToken}
            />

            {/* Department Update Dialog */}
            <DepartmentUpdateDialog
                open={showDeptUpdate && !showOnboarding && !showIdentityUpdate}
                currentDepartment={user?.department || null}
                onComplete={() => {
                    setShowDeptUpdate(false);
                    refreshUser();
                }}
                getToken={getToken}
            />

            {/* Guide FAB */}
            <Fab
                aria-label="guide"
                component={Link}
                href="/guide"
                sx={{
                    position: 'fixed',
                    bottom: 152,
                    right: 24,
                    zIndex: 1000,
                    bgcolor: mode === 'dark' ? '#7E57C2' : '#6A1B9A',
                    color: '#fff',
                    '&:hover': { bgcolor: mode === 'dark' ? '#5E35B1' : '#4A148C' },
                }}
            >
                <Typography fontSize="1.4rem">📖</Typography>
            </Fab>

            {/* Updates FAB */}
            <Fab
                color="info"
                aria-label="updates"
                component={Link}
                href="/updates"
                sx={{
                    position: 'fixed',
                    bottom: 88,
                    right: 24,
                    zIndex: 1000,
                }}
            >
                <Typography fontSize="1.4rem">📋</Typography>
            </Fab>

            {/* Terms FAB */}
            <Fab
                color="secondary"
                aria-label="terms"
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000,
                }}
                onClick={() => setTermsOpen(true)}
            >
                <Typography fontSize="1.4rem">📜</Typography>
            </Fab>
            {/* Terms Dialog */}
            <Dialog open={termsOpen} onClose={() => setTermsOpen(false)} maxWidth="sm" fullWidth scroll="paper">
                <DialogTitle sx={{ fontWeight: 'bold' }}>📜 服務條款與免責聲明</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.85rem' }}>
                        {DISCLAIMER_TEXT}
                    </Box>
                    {user?.disclaimerAcceptedAt && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                ✅ 您已於 <strong>{new Date(user.disclaimerAcceptedAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</strong> 同意此條款
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTermsOpen(false)}>關閉</Button>
                </DialogActions>
            </Dialog>

            {/* Footer */}
            <Box sx={{ py: 3, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider', mt: 4 }}>
                <Typography variant="body2" color="text.secondary">
                    © 2026 LUMO NCNU
                </Typography>
            </Box>
        </Box>
    );
}
