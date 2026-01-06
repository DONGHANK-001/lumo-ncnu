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
    useTheme
} from '@mui/material';
import {
    SportsBasketball,
    DirectionsRun,
    SportsTennis,
    FitnessCenter,
    School,
    Group,
    Security
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useWakeupBackend } from '@/hooks/useWakeupBackend';
import { useState, useEffect } from 'react';

const SPORTS = [
    { icon: <SportsBasketball fontSize="large" />, name: '籃球' },
    { icon: <DirectionsRun fontSize="large" />, name: '跑步' },
    { icon: <SportsTennis fontSize="large" />, name: '羽球' }, // Using Tennis icon for Badminton as generic racket sport
    { icon: <SportsTennis fontSize="large" />, name: '桌球' }, // Placeholder
    { icon: <FitnessCenter fontSize="large" />, name: '健身' },
];

export default function LandingPage() {
    const theme = useTheme();
    const { user, loading, error, signIn } = useAuth();
    const [showError, setShowError] = useState(false);

    // 預先喚醒後端 (Render 冷啟動優化)
    useWakeupBackend();

    // PWA Install Prompt State
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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
            <AppBar position="fixed" elevation={0} sx={{ backdropFilter: 'blur(10px)', bgcolor: 'rgba(20, 18, 24, 0.8)' }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1} component={Link} href="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`, backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                LUMO NCNU
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button component={Link} href="/groups" color="inherit">揪團列表</Button>
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
                    </Stack>
                </Container>
            </Box>

            {/* Sports Icons */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
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
        </Box>
    );
}
