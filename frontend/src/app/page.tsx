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
    MenuBook
} from '@mui/icons-material';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useWakeupBackend } from '@/hooks/useWakeupBackend';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useState, useEffect } from 'react';
import { useThemeMode } from '@/theme/ThemeModeContext';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import OnboardingDialog from './components/OnboardingDialog';
import { DISCLAIMER_TEXT } from './components/OnboardingDialog';
import { useNotifications } from '@/hooks/useNotifications';
import { SPORT_NAMES } from '@/lib/constants';

const SPORTS = [
    { type: 'BASKETBALL', icon: <SportsBasketball fontSize="large" />, name: '籃球' },
    { type: 'RUNNING', icon: <DirectionsRun fontSize="large" />, name: '跑步' },
    { type: 'BADMINTON', icon: <SportsTennis fontSize="large" />, name: '羽球' },
    { type: 'TABLE_TENNIS', icon: <SportsTennis fontSize="large" />, name: '桌球' },
    { type: 'GYM', icon: <FitnessCenter fontSize="large" />, name: '健身' },
    { type: 'VOLLEYBALL', icon: <SportsVolleyball fontSize="large" />, name: '排球' },
    { type: 'TENNIS', icon: <SportsTennis fontSize="large" />, name: '網球' },
];

export default function LandingPage() {
    const theme = useTheme();
    const { user, loading, error, signIn, getToken, refreshUser } = useAuth();
    const { mode, toggleMode } = useThemeMode();
    const [showError, setShowError] = useState(false);

    // 預先喚醒後端 (Render 冷啟動優化)
    useWakeupBackend();

    // 註冊 Service Worker (PWA)
    useServiceWorker();

    // PWA Install Prompt State
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    // Live Feed State
    const [liveFeed, setLiveFeed] = useState<{ message: string; open: boolean }>({ message: '', open: false });

    // Onboarding Dialog
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Notifications
    const { unreadCount } = useNotifications();

    useEffect(() => {
        if (user && !user.onboardingCompleted) {
            setShowOnboarding(true);
        }
    }, [user]);



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
        if (error) {
            setShowError(true);
        }
    }, [error]);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            setShowInstallPrompt(false);
        }
    };

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
                                📚 揪讀書
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                找人一起讀書，有伴效率更高
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
                        background: mode === 'dark'
                            ? 'linear-gradient(135deg, #1a2e1a 0%, #2d4a1e 100%)'
                            : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                        transition: 'transform 0.3s',
                        '&:hover': { transform: 'translateY(-4px)' },
                    }}
                >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            🍽️ 運動後飲食指南
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            打完球不知道吃什麼？依運動類型推薦最佳恢復餐
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

            {/* Install Prompt Snackbar */}
            <Snackbar
                open={showInstallPrompt}
                message="安裝 Lumo NCNU 到主畫面"
                action={
                    <>
                        <Button color="inherit" size="small" onClick={() => setShowInstallPrompt(false)}>
                            稍後
                        </Button>
                        <Button color="primary" size="small" onClick={handleInstall}>
                            安裝
                        </Button>
                    </>
                }
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
