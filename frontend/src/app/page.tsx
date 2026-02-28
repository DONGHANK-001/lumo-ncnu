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
    TextField
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
    Feedback
} from '@mui/icons-material';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useWakeupBackend } from '@/hooks/useWakeupBackend';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useState, useEffect } from 'react';
import { useThemeMode } from '@/theme/ThemeModeContext';
import { getSocket } from '@/lib/socket';
import OnboardingDialog from './components/OnboardingDialog';

const SPORTS = [
    { icon: <SportsBasketball fontSize="large" />, name: '籃球' },
    { icon: <DirectionsRun fontSize="large" />, name: '跑步' },
    { icon: <SportsTennis fontSize="large" />, name: '羽球' }, // Using Tennis icon for Badminton as generic racket sport
    { icon: <SportsTennis fontSize="large" />, name: '桌球' }, // Placeholder
    { icon: <FitnessCenter fontSize="large" />, name: '健身' },
    { icon: <SportsVolleyball fontSize="large" />, name: '排球' },
];

const SPORT_NAMES: Record<string, string> = {
    BASKETBALL: '籃球',
    RUNNING: '跑步',
    BADMINTON: '羽球',
    TABLE_TENNIS: '桌球',
    GYM: '健身',
    VOLLEYBALL: '排球',
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

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
            {/* AppBar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    backdropFilter: 'blur(10px)',
                    bgcolor: mode === 'dark' ? 'rgba(20, 18, 24, 0.9)' : 'rgba(255, 251, 254, 0.95)',
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
                        <Button
                            variant="outlined"
                            color="secondary"
                            size="large"
                            component={Link}
                            href="/match"
                            sx={{ fontSize: '1.2rem', py: 1.5, px: 4 }}
                        >
                            🤖 智慧配對
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* Instagram & Sports Icons */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                {/* IG Icon */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
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
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={6}>支援運動類型</Typography>
                <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={4}>
                    {SPORTS.map((sport) => (
                        <Paper
                            key={sport.name}
                            elevation={0}
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                minWidth: 100,
                                bgcolor: 'background.paper',
                                borderRadius: 4,
                                '&:hover': { transform: 'translateY(-5px)', transition: '0.3s' }
                            }}
                        >
                            <Box sx={{ color: 'primary.main', mb: 1 }}>{sport.icon}</Box>
                            <Typography variant="body1" fontWeight="medium">{sport.name}</Typography>
                        </Paper>
                    ))}
                </Stack>
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
        </Box>
    );
}
