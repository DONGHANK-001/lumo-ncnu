'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import {
    Box,
    Container,
    Typography,
    Paper,
    Stack,
    Avatar,
    Chip,
    Grid,
    CircularProgress,
    Divider,
    IconButton
} from '@mui/material';
import { ArrowBack, Star, LocalFireDepartment, InfoOutlined } from '@mui/icons-material';
import CrownBadge from '@/app/components/CrownBadge';

const SPORT_LABELS: Record<string, string> = {
    BASKETBALL: '🏀 籃球',
    RUNNING: '🏃 跑步',
    BADMINTON: '🏸 羽球',
    TABLE_TENNIS: '🏓 桌球',
    GYM: '💪 健身',
    VOLLEYBALL: '🏐 排球',
};

const SKILL_LABELS: Record<string, string> = {
    BEGINNER: '初心級 (剛接觸)',
    INTERMEDIATE: '挑戰級 (有經驗)',
    ADVANCED: '大師級 (熟練/校隊)',
    ANY: '不限程度',
};

const GENDER_LABELS: Record<string, string> = {
    FEMALE: 'Female',
    MALE: 'Male',
    NON_BINARY: 'Non-binary',
    PREFER_NOT_TO_SAY: 'Prefer not to say',
};

export default function PublicProfilePage({ params }: { params: { id: string } }) {
    const { id } = params;
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const response = await api.getUserProfile(id);
            if (response.success && response.data) {
                setProfile(response.data);
            } else {
                setError(response.error?.message || '檔案載入失敗或無此用戶');
            }
            setLoading(false);
        };
        fetchProfile();
    }, [id]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !profile) {
        return (
            <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
                <Typography variant="h2" mb={2}>😢</Typography>
                <Typography variant="h5" fontWeight="bold" gutterBottom>找不到使用者</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    {error || '該使用者不存在或已被刪除'}
                </Typography>
                <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
                    <Box component="span" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <ArrowBack fontSize="small" /> 返回排行榜
                    </Box>
                </Link>
            </Container>
        );
    }

    const sports = profile.preferences?.sports || [];
    const skillLevel = profile.preferences?.skillLevel || 'ANY';

    return (
        <Container maxWidth="sm" sx={{ py: 4, pb: 10 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <IconButton component={Link} href="/leaderboard" color="primary">
                    <ArrowBack />
                </IconButton>
                <Typography variant="h5" fontWeight="bold">玩家檔案</Typography>
            </Stack>

            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                {/* 裝飾背景 */}
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '100px',
                    background: profile.planType === 'PLUS'
                        ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                        : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    zIndex: 0
                }} />

                <Avatar
                    src={profile.avatarUrl || undefined}
                    sx={{
                        width: 120,
                        height: 120,
                        mx: 'auto',
                        mb: 2,
                        mt: 4,
                        position: 'relative',
                        zIndex: 1,
                        fontSize: '3rem',
                        bgcolor: 'background.paper',
                        color: 'primary.main',
                        border: profile.planType === 'PLUS' ? '4px solid gold' : '4px solid white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    {!profile.avatarUrl && (profile.nickname || '匿')[0].toUpperCase()}
                </Avatar>

                <Stack alignItems="center" spacing={1} position="relative" zIndex={1}>
                    {profile.planType === 'PLUS' && (
                        <Chip label="PLUS 尊爵會員" size="small" color="secondary" icon={<Star />} sx={{ fontWeight: 'bold' }} />
                    )}
                    {profile.pioneerTitle && (
                        <Chip
                            label={profile.pioneerTitle.label}
                            size="small"
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                            }}
                        />
                    )}
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                        {profile.nickname || '匿名使用者'}
                        <CrownBadge isPlus={profile.planType === 'PLUS'} />
                    </Typography>

                    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                        <Chip
                            size="small"
                            variant="outlined"
                            label={`性別 ${profile.gender ? (GENDER_LABELS[profile.gender] || profile.gender) : '未填寫'}`}
                        />
                        <Chip
                            size="small"
                            variant="outlined"
                            label={`系級 ${profile.gradeLabel || '未填寫'}`}
                        />
                        <Chip
                            size="small"
                            variant="outlined"
                            label={`系所 ${profile.department || '未填寫'}`}
                        />
                    </Stack>
                </Stack>

                <Divider sx={{ my: 3 }} />

                {/* Statistics Box */}
                <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 3, mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <LocalFireDepartment color="error" fontSize="small" />
                        綜合運動成就
                    </Typography>
                    <Stack direction="row" justifyContent="space-around" mt={2} mb={1}>
                        <Box>
                            <Typography variant="h5" color="success.main" fontWeight="bold">
                                {profile.attendedCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">出席參團</Typography>
                        </Box>
                        <Box>
                            <Typography variant="h5" color="error.main" fontWeight="bold">
                                {profile.noShowCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">缺席放鳥</Typography>
                        </Box>
                    </Stack>
                </Box>

                {/* Preferences */}
                <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2} display="flex" alignItems="center" gap={1}>
                        <InfoOutlined color="primary" fontSize="small" />
                        偏好運動標籤
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom>喜好的運動項目</Typography>
                    {sports.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {sports.map((s: string) => (
                                <Chip key={s} label={SPORT_LABELS[s] || s} size="small" variant="outlined" />
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                            這個人還沒設定偏好或什麼都玩～
                        </Typography>
                    )}

                    <Typography variant="body2" color="text.secondary" gutterBottom>最高運動程度</Typography>
                    <Chip label={SKILL_LABELS[skillLevel] || skillLevel} size="small" color="primary" variant="outlined" />
                </Box>
            </Paper>
        </Container>
    );
}
