'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardContent,
    Avatar,
    Chip,
    Stack,
    CircularProgress,
    Alert,
    Button,
    Paper
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import Link from 'next/link';

interface MatchPartner {
    id: string;
    nickname: string;
    attendedCount: number;
    noShowCount: number;
    matchedTags: string[];
    score: number;
}

export default function MatchPage() {
    const { user, loading: authLoading, getToken } = useAuth();
    const [partners, setPartners] = useState<MatchPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchPartners = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const res = await api.getMatchPartners(token);
                if (res.success && res.data) {
                    setPartners(res.data);
                } else {
                    setError(res.error?.message || '配對失敗');
                }
            } catch (err: any) {
                setError(err.message || '發生錯誤');
            } finally {
                setLoading(false);
            }
        };

        fetchPartners();
    }, [user, authLoading, getToken]);

    if (authLoading || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">請先登入以探索專屬運動夥伴</Typography>
                <Link href="/" passHref>
                    <Button variant="contained" sx={{ mt: 2 }}>
                        返回首頁
                    </Button>
                </Link>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Link href="/" passHref style={{ textDecoration: 'none' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 3, color: 'text.secondary' }}
                >
                    返回首頁
                </Button>
            </Link>

            <Typography variant="h4" fontWeight="bold" gutterBottom>
                🤖 智慧配對
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                根據程度、時間、地點，找到最適合你的夥伴！
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
            )}

            {partners.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        目前還沒有推薦的球友
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        您可以至「個人檔案」充實您的喜好設定，更容易遇到志同道合的人！
                    </Typography>
                    <Link href="/profile" passHref>
                        <Button variant="contained" sx={{ mt: 2 }}>
                            前往設定偏好
                        </Button>
                    </Link>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {partners.map((partner) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={partner.id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 4,
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                            }}>
                                <CardContent>
                                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                                            {partner.nickname.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">
                                                {partner.nickname}
                                            </Typography>
                                            <Stack direction="row" alignItems="center" spacing={0.5} color="text.secondary">
                                                <LocalFireDepartmentIcon fontSize="small" color="warning" />
                                                <Typography variant="caption">出席 {partner.attendedCount} 次</Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {partner.matchedTags.length > 0 ? (
                                            partner.matchedTags.map((tag, idx) => (
                                                <Chip key={idx} label={tag} size="small" color="secondary" variant="outlined" />
                                            ))
                                        ) : (
                                            <Chip label="潛力活躍用戶" size="small" color="primary" variant="outlined" />
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
}
