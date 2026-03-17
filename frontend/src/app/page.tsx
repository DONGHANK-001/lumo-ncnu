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
    Divider
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
    Feedback,
    NightsStay,
    Restaurant
} from '@mui/icons-material';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useWakeupBackend } from '@/hooks/useWakeupBackend';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useState, useEffect } from 'react';
import { useThemeMode } from '@/theme/ThemeModeContext';
import { getSocket } from '@/lib/socket';
import SafetyNoticeDialog from '@/app/components/SafetyNoticeDialog';
import NotificationBell from '@/app/components/NotificationBell';
import OnboardingDialog from './components/OnboardingDialog';
import { DISCLAIMER_TEXT } from './components/OnboardingDialog';

const SPORTS = [
    { type: 'BASKETBALL', icon: <SportsBasketball fontSize="large" />, name: '籃球' },
    { type: 'RUNNING', icon: <DirectionsRun fontSize="large" />, name: '跑步' },
    { type: 'BADMINTON', icon: <SportsTennis fontSize="large" />, name: '羽球' },
    { type: 'TABLE_TENNIS', icon: <SportsTennis fontSize="large" />, name: '桌球' },
    { type: 'GYM', icon: <FitnessCenter fontSize="large" />, name: '健身' },
    { type: 'VOLLEYBALL', icon: <SportsVolleyball fontSize="large" />, name: '排球' },
    { type: 'NIGHT_WALK', icon: <NightsStay fontSize="large" />, name: '夜散' },
    { type: 'DINING', icon: <Restaurant fontSize="large" />, name: '飯搭子' },
];

const SPORT_NAMES: Record<string, string> = {
    BASKETBALL: '籃球',
    RUNNING: '跑步',
    BADMINTON: '羽球',
    TABLE_TENNIS: '桌球',
    GYM: '健身',
    VOLLEYBALL: '排球',
    NIGHT_WALK: '夜散',
    DINING: '飯搭子',
};

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

    useEffect(() => {
        if (user && !user.onboardingCompleted) {
            setShowOnboarding(true);
        }
    }, [user]);

    // Feedback
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackContent, setFeedbackContent] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    const handleFeedbackSubmit = async () => {
        if (!feedbackContent.trim()) return;
        setFeedbackLoading(true);
        const token = await getToken();
        // 原本 token 可能沒有 (未登入者)，可以支援匿名回饋
        const response = await api.submitFeedback(token || undefined, feedbackContent);
        if (response.success) {
            setFeedbackOpen(false);
            setFeedbackContent('');
            setLiveFeed({ message: '謝謝您的回饋！我們已收到您的建議。', open: true });
        } else {
            setLiveFeed({ message: response.error?.message || '送出失敗，請稍後再試', open: true });
        }
        setFeedbackLoading(false);
    };

    useEffect(() => {
        const socket = getSocket();

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
                    bgcolor: mode === 'dark' ? 'rgba(30, 26, 46, 0.9)' : 'rgba(243, 238, 250, 0.95)',
                    color: 'text.primary',
                    borderBottom: mode === 'light' ? '1px solid rgba(0,0,0,0.08)' : 'none',
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
                                >
                                    {mode === 'dark' ? <LightMode /> : <DarkMode />}
                                </IconButton>
                            )}
                            <NotificationBell />
                            <Button
                                component={Link}
                                href="/groups"
                                sx={{ color: 'text.primary' }}
                            >
                                揪團列表
                            </Button>

                            {loading ? (
                                <Box sx={{ width: 80, height: 36, bgcolor: 'action.hover', borderRadius: 2 }} />
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
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: 'black',
                    boxShadow: '0 8px 32px rgba(255,165,0,0.3)',
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

            {/* WBC 2026 Event Banner — 3/5 限定活動 */}
            {(() => {
                const now = new Date();
                const wbcDate = new Date('2026-03-05T00:00:00+08:00');
                const wbcEnd = new Date('2026-03-06T00:00:00+08:00');
                const isBeforeOrDuring = now < wbcEnd;
                const isEventDay = now >= wbcDate && now < wbcEnd;
                const daysLeft = Math.max(0, Math.ceil((wbcDate.getTime() - now.getTime()) / 86400000));

                if (!isBeforeOrDuring) return null;

                return (
                    <Container maxWidth="md" sx={{ mt: 3, mb: 4 }}>
                        <Card sx={{
                            borderRadius: 4,
                            background: isEventDay
                                ? 'linear-gradient(135deg, #e53e3e 0%, #1a365d 50%, #e53e3e 100%)'
                                : 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
                            color: 'white',
                            boxShadow: '0 8px 32px rgba(26,54,93,0.4)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h4" fontWeight="900" gutterBottom>
                                    ⚾ {isEventDay ? '經典賽開打！' : '經典賽倒數'}
                                </Typography>
                                {!isEventDay && (
                                    <Typography variant="h2" fontWeight="900" sx={{
                                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                        backgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        my: 1,
                                    }}>
                                        {daysLeft} 天
                                    </Typography>
                                )}
                                <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
                                    🇹🇼 一起為中華隊加油！
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7, mt: 2 }}>
                                    {isEventDay
                                        ? '🎉 今日揪團成功即可獲得「⚾ 經典賽應援團 2026」限定稱號！'
                                        : '3/5 當天揪團成功一次，即可獲得限定稱號「⚾ 經典賽應援團 2026」'}
                                </Typography>
                                <Button
                                    variant="contained"
                                    component={Link}
                                    href="/groups"
                                    sx={{
                                        mt: 3,
                                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                        color: '#1a365d',
                                        fontWeight: 'bold',
                                        borderRadius: 3,
                                        px: 4,
                                        '&:hover': { background: 'linear-gradient(135deg, #FFA500, #FF8C00)' },
                                    }}
                                >
                                    {isEventDay ? '🔥 立即揪團！' : '👀 瀏覽揪團'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Container>
                );
            })()}

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
                        追蹤 @lumo_dailyfit
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
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={4}>✨ 社交活動</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
                    <Card
                        component={Link}
                        href="/create?type=NIGHT_WALK"
                        sx={{
                            flex: 1,
                            maxWidth: 360,
                            textDecoration: 'none',
                            borderRadius: 4,
                            background: mode === 'dark'
                                ? 'linear-gradient(135deg, #1a1a3e 0%, #2d1b69 100%)'
                                : 'linear-gradient(135deg, #e8d5f5 0%, #d1c4e9 100%)',
                            transition: 'transform 0.3s',
                            '&:hover': { transform: 'translateY(-6px)' },
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <NightsStay sx={{ fontSize: 48, color: mode === 'dark' ? '#bb86fc' : '#6750A4', mb: 2 }} />
                            <Typography variant="h5" fontWeight="bold" gutterBottom>🌙 揪團夜散</Typography>
                            <Typography variant="body2" color="text.secondary">
                                晚上想出來走走？找個伴一起散步聊天或安靜放空
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card
                        component={Link}
                        href="/create?type=DINING"
                        sx={{
                            flex: 1,
                            maxWidth: 360,
                            textDecoration: 'none',
                            borderRadius: 4,
                            background: mode === 'dark'
                                ? 'linear-gradient(135deg, #3d1a2e 0%, #5c1e3a 100%)'
                                : 'linear-gradient(135deg, #FFECF5 0%, #f8d7e8 100%)',
                            transition: 'transform 0.3s',
                            '&:hover': { transform: 'translateY(-6px)' },
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Restaurant sx={{ fontSize: 48, color: mode === 'dark' ? '#f8bbd0' : '#c2185b', mb: 2 }} />
                            <Typography variant="h5" fontWeight="bold" gutterBottom>🍜 飯搭子</Typography>
                            <Typography variant="body2" color="text.secondary">
                                一個人吃飯太孤單？找人一起吃吧！
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

            {/* Terms FAB */}
            <Fab
                color="secondary"
                aria-label="terms"
                sx={{
                    position: 'fixed',
                    bottom: 88,
                    right: 24,
                    zIndex: 1000,
                }}
                onClick={() => setTermsOpen(true)}
            >
                <Typography fontSize="1.4rem">📜</Typography>
            </Fab>

            {/* Feedback FAB */}
            <Fab
                color="primary"
                aria-label="feedback"
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000
                }}
                onClick={() => setFeedbackOpen(true)}
            >
                <Feedback />
            </Fab>

            {/* Feedback Dialog */}
            <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>提供意見回饋</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
                        遇到 bug、有新功能建議，或有任何想對我們說的話，都歡迎在這邊留言給開發團隊！
                        <br />
                        聯絡我們 / 客服信箱：aov11011@gmail.com
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="feedback"
                        label="您的建議或回饋"
                        type="text"
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        value={feedbackContent}
                        onChange={(e) => setFeedbackContent(e.target.value)}
                        placeholder="請輸入您的回饋內容..."
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setFeedbackOpen(false)} color="inherit">
                        取消
                    </Button>
                    <Button
                        onClick={handleFeedbackSubmit}
                        variant="contained"
                        disabled={!feedbackContent.trim() || feedbackLoading}
                        sx={{ borderRadius: 4, px: 3 }}
                    >
                        送出
                    </Button>
                </DialogActions>
            </Dialog>
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
