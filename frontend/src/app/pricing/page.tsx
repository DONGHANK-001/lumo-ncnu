'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Check,
    Close,
    ArrowBack,
    ExpandMore,
    Star
} from '@mui/icons-material';

const FEATURES = [
    { name: '瀏覽揪團', free: true, plus: true },
    { name: '發起揪團', free: true, plus: true },
    { name: '加入揪團', free: true, plus: true },
    { name: '個人偏好設定', free: true, plus: true },
    { name: '候補功能', free: false, plus: true },
    { name: '優先配對（即將推出）', free: false, plus: true },
    { name: '專屬徽章', free: false, plus: true },
];

const FAQS = [
    { q: '什麼是候補功能？', a: '當揪團人數已滿時，PLUS 會員可以加入候補名單。當有人退出時，系統會自動將候補成員遞補加入。' },
    { q: '如何付款？', a: '目前第一版為模擬升級功能，未來將支援信用卡與行動支付。' },
    { q: '可以隨時取消嗎？', a: '是的，你可以隨時取消訂閱，已付款的期間仍可繼續使用 PLUS 功能。' },
];

export default function PricingPage() {
    const { user, getToken, refreshUser } = useAuth();

    // Simple alert replacement for now, could be Snackbar
    const handleUpgrade = async () => {
        if (!user) return;

        const token = await getToken();
        const response = await api.upgradePlan(token!);

        if (response.success) {
            await refreshUser();
            alert('升級成功！您現在是 PLUS 會員');
        } else {
            alert(response.error?.message || '升級失敗');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4, pb: 10 }}>
            <Button
                startIcon={<ArrowBack />}
                component={Link}
                href="/"
                sx={{ mb: 4, color: 'text.secondary' }}
            >
                返回首頁
            </Button>

            <Box textAlign="center" mb={8}>
                <Typography variant="h3" fontWeight="bold" gutterBottom>選擇適合你的方案</Typography>
                <Typography variant="h6" color="text.secondary">免費使用核心功能，升級解鎖更多特權</Typography>
            </Box>

            <Grid container spacing={4} justifyContent="center" alignItems="flex-start" sx={{ mb: 10 }}>
                {/* Free Plan */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1, p: 4, textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>Free</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary" gutterBottom>
                                $0
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={4}>永久免費</Typography>

                            <List>
                                {FEATURES.map((feature) => (
                                    <ListItem key={feature.name} disableGutters>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            {feature.free ? <Check color="primary" /> : <Close color="disabled" />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={feature.name}
                                            primaryTypographyProps={{
                                                color: feature.free ? 'text.primary' : 'text.disabled'
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                        <CardActions sx={{ p: 4, pt: 0 }}>
                            {user?.planType === 'FREE' ? (
                                <Button variant="outlined" fullWidth disabled>目前方案</Button>
                            ) : !user ? (
                                <Button variant="outlined" fullWidth component={Link} href="/">開始使用</Button>
                            ) : (
                                <Button variant="outlined" fullWidth onClick={() => alert('您已是 PLUS 會員')}>降級方案</Button>
                            )}
                        </CardActions>
                    </Card>
                </Grid>

                {/* Plus Plan */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card
                        sx={{
                            borderRadius: 4,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            border: 2,
                            borderColor: 'secondary.main',
                            position: 'relative',
                            overflow: 'visible'
                        }}
                    >
                        <Chip
                            label="推薦"
                            color="secondary"
                            sx={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)' }}
                        />
                        <CardContent sx={{ flexGrow: 1, p: 4, textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold" gutterBottom color="secondary.main">PLUS</Typography>
                            <Typography variant="h3" fontWeight="bold" color="text.primary" gutterBottom>
                                $20<Typography component="span" variant="h6" color="text.secondary">/月</Typography>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={4}>解鎖所有功能</Typography>

                            <List>
                                {FEATURES.map((feature) => (
                                    <ListItem key={feature.name} disableGutters>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            {feature.plus ? <Check color="secondary" /> : <Close color="disabled" />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={feature.name}
                                            primaryTypographyProps={{
                                                color: feature.plus ? 'text.primary' : 'text.disabled'
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                        <CardActions sx={{ p: 4, pt: 0 }}>
                            {user?.planType === 'PLUS' ? (
                                <Button variant="contained" color="secondary" fullWidth disabled startIcon={<Star />}>
                                    已是 PLUS 會員
                                </Button>
                            ) : user ? (
                                <Button variant="contained" color="secondary" fullWidth onClick={handleUpgrade}>
                                    立即升級
                                </Button>
                            ) : (
                                <Button variant="contained" color="secondary" fullWidth component={Link} href="/">
                                    登入後升級
                                </Button>
                            )}
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>

            <Container maxWidth="md">
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={4}>常見問題</Typography>
                <Box>
                    {FAQS.map((faq, index) => (
                        <Accordion key={index} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography fontWeight="medium">{faq.q}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">{faq.a}</Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Container>
        </Container>
    );
}
