'use client';

import { Box, Typography, Button, Container, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';

export default function PaymentSuccessPage() {
    return (
        <Container maxWidth="sm" sx={{ py: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Paper elevation={3} sx={{ p: 5, borderRadius: 4, width: '100%', textAlign: 'center', bgcolor: 'background.paper' }}>
                <CheckCircleIcon color="secondary" sx={{ fontSize: 80, mb: 3 }} />

                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    付款成功！
                </Typography>

                <Typography variant="h6" color="text.secondary" paragraph>
                    歡迎加入 LUMO PLUS 會員
                </Typography>

                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    您的帳號升級已在背景處理中，現在可以開始享受無限制的進階專屬體驗了！
                </Typography>

                <Box display="flex" flexDirection="column" gap={2}>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        component={Link}
                        href="/profile"
                        sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 2 }}
                    >
                        前往我的個人檔案
                    </Button>
                    <Button
                        variant="outlined"
                        color="inherit"
                        size="large"
                        component={Link}
                        href="/"
                        sx={{ py: 1.5, fontSize: '1.1rem', borderRadius: 2 }}
                    >
                        回到首頁
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
