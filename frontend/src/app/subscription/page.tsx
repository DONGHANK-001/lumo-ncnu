'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Box, Typography, Button, Container, Paper, CircularProgress, Stack, Chip, Divider } from '@mui/material';
import { api } from '@/lib/api-client';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

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

    const handleCheckout = async () => {
        try {
            setLoading(true);
            setError('');
            const token = await getToken();
            if (!token) throw new Error('未登入');

            const res = await api.checkoutSubscription(token, 'PLUS');
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
        <Container maxWidth="md" sx={{ py: 8 }}>
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

            <Box display="flex" justifyContent="center">
                <Paper
                    elevation={12}
                    sx={{
                        p: 5,
                        borderRadius: 4,
                        maxWidth: 400,
                        width: '100%',
                        position: 'relative',
                        border: '2px solid',
                        borderColor: 'secondary.main',
                        bgcolor: 'background.paper',
                    }}
                >
                    <Chip
                        label="超值推薦"
                        color="secondary"
                        size="small"
                        sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontWeight: 'bold' }}
                    />

                    <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
                        PLUS 方案
                    </Typography>

                    <Box display="flex" justifyContent="center" alignItems="baseline" mb={4}>
                        <Typography variant="h3" fontWeight="bold">
                            $199
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" ml={1}>
                            / 月
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    <Stack spacing={2} mb={5}>
                        {['解除每月發起揪團上限', '解鎖智慧配對進階條件', '無限查看活動參與者聯絡資訊', '專屬 PLUS 會員徽章'].map((feat, idx) => (
                            <Box key={idx} display="flex" alignItems="center">
                                <CheckCircleOutlineIcon color="secondary" sx={{ mr: 2 }} />
                                <Typography variant="body1">{feat}</Typography>
                            </Box>
                        ))}
                    </Stack>

                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        fullWidth
                        disabled={loading || user.planType === 'PLUS'}
                        onClick={handleCheckout}
                        sx={{ py: 2, fontSize: '1.2rem', fontWeight: 'bold', borderRadius: 2 }}
                    >
                        {loading ? <CircularProgress size={28} color="inherit" /> : (user.planType === 'PLUS' ? '已訂閱此方案' : '立即升級 PRO')}
                    </Button>

                    {error && (
                        <Typography color="error" variant="body2" textAlign="center" mt={2}>
                            {error}
                        </Typography>
                    )}
                </Paper>
            </Box>

            <Box textAlign="center" mt={4}>
                <Typography variant="caption" color="text.secondary">
                    【開發測試中】此結帳頁面串接綠界測試環境，所有交易均為模擬，不會實際扣除任何款項。
                </Typography>
            </Box>
        </Container>
    );
}
