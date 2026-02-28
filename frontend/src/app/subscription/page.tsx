'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Box, Typography, Button, Container, Paper, CircularProgress, Stack, Chip, Divider, Grid } from '@mui/material';
import { api } from '@/lib/api-client';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

const PLANS = [
    { type: 'WEEKLY', name: '試用方案', price: 19, period: '週', features: ['解除發起揪團上限', '專屬 PLUS 徽章'] },
    { type: 'MONTHLY', name: '月租方案', price: 60, period: '月', features: ['包含試用方案功能', '無限查看參與者聯絡資訊'] },
    { type: 'QUARTERLY', name: '超值季卡', price: 150, period: '季', features: ['包含月租方案功能', '解鎖智慧配對進階條件'] },
    { type: 'LIFETIME', name: '終身黑金卡', price: 399, period: '永久', features: ['未來所有新功能免費', '終身專屬特權服務'] }
];

export default function SubscriptionPage() {
    const { user, getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 【重要】僅限管理員身分可以看到這個頁面
    if (!user) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (user.role !== 'ADMIN') {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h5" color="error">權限不足</Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    目前訂閱功能僅開放管理員測試，我們將在近期向所有用戶開放！
                </Typography>
            </Container>
        );
    }

    const handleCheckout = async (planType: string) => {
        try {
            setLoading(true);
            setError('');
            const token = await getToken();
            if (!token) throw new Error('未登入');

            const res = await api.checkoutSubscription(token, planType);
            if (res.success && res.data) {
                // 建構動態表單送往綠界
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'; // 測試環境 URL

                // 將後端回傳的參數加進表單
                const ecpayParams = res.data;
                for (const key in ecpayParams) {
                    const hiddenField = document.createElement('input');
                    hiddenField.type = 'hidden';
                    hiddenField.name = key;
                    hiddenField.value = ecpayParams[key];
                    form.appendChild(hiddenField);
                }

                document.body.appendChild(form);
                form.submit(); // 自動提交跳轉綠界
            } else {
                throw new Error(res.error?.message || '結帳發起失敗');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || '發生未知錯誤');
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 6, pb: 10 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
                <Button startIcon={<ArrowBackIcon />} sx={{ mb: 2, color: 'text.secondary' }}>
                    返回首頁
                </Button>
            </Link>

            <Box textAlign="center" mb={6}>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                    解鎖完整 LUMO 體驗
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    升級 PLUS 會員，享受更進階的配對體驗與無限交流功能！
                </Typography>

                {user.planType === 'PLUS' && (
                    <Chip
                        icon={<AutoAwesomeIcon />}
                        label="您目前已經是 PLUS 會員"
                        color="secondary"
                        sx={{ mt: 3, fontSize: '1.1rem', py: 2.5, px: 1 }}
                    />
                )}
            </Box>

            <Grid container spacing={4} justifyContent="center">
                {PLANS.map((plan) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={plan.type} sx={{ display: 'flex' }}>
                        <Paper
                            elevation={plan.type === 'MONTHLY' ? 12 : 4}
                            sx={{
                                p: 4,
                                borderRadius: 4,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                border: plan.type === 'MONTHLY' ? '2px solid' : '1px solid',
                                borderColor: plan.type === 'MONTHLY' ? 'secondary.main' : 'divider',
                                bgcolor: 'background.paper',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-8px)' }
                            }}
                        >
                            {plan.type === 'MONTHLY' && (
                                <Chip
                                    label="最受歡迎"
                                    color="secondary"
                                    size="small"
                                    sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontWeight: 'bold' }}
                                />
                            )}

                            {plan.type === 'LIFETIME' && (
                                <Chip
                                    label="限量發售"
                                    color="primary"
                                    size="small"
                                    sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontWeight: 'bold' }}
                                />
                            )}

                            <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
                                {plan.name}
                            </Typography>

                            <Box display="flex" justifyContent="center" alignItems="baseline" mb={3}>
                                <Typography variant="h3" fontWeight="bold">
                                    ${plan.price}
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary" ml={1}>
                                    / {plan.period}
                                </Typography>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            <Stack spacing={2} mb={4} flex={1}>
                                {plan.features.map((feat, idx) => (
                                    <Box key={idx} display="flex" alignItems="flex-start">
                                        <CheckCircleOutlineIcon color="secondary" sx={{ mr: 1.5, mt: 0.2, fontSize: 20 }} />
                                        <Typography variant="body2">{feat}</Typography>
                                    </Box>
                                ))}
                            </Stack>

                            <Button
                                variant={plan.type === 'MONTHLY' || plan.type === 'LIFETIME' ? 'contained' : 'outlined'}
                                color={plan.type === 'LIFETIME' ? 'primary' : 'secondary'}
                                size="large"
                                fullWidth
                                disabled={loading || user.planType === 'PLUS'}
                                onClick={() => handleCheckout(plan.type)}
                                sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : '立即升級'}
                            </Button>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {error && (
                <Typography color="error" variant="body2" textAlign="center" mt={4}>
                    {error}
                </Typography>
            )}

            <Box textAlign="center" mt={4}>
                <Typography variant="caption" color="text.secondary">
                    【開發測試中】此結帳頁面串接綠界測試環境，所有交易均為模擬，不會實際扣除任何款項。
                </Typography>
            </Box>
        </Container>
    );
}
