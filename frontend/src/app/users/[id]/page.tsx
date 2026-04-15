'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useUserProfile, useAllBadges, useUserBadges } from '@/hooks/useSWRApi';
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
import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material';
import {
    ArrowBack, Star, LocalFireDepartment, InfoOutlined, MilitaryTech,
    EmojiEvents, Diversity3, WorkspacePremium, FitnessCenter, WbSunny,
    Explore, NightsStay,
} from '@mui/icons-material';
import CrownBadge from '@/app/components/CrownBadge';
import { TITLE_ICON_MAP } from '@/lib/title-icons';

const BADGE_ICON_MAP: Record<string, { Icon: ComponentType<SvgIconProps>; color: string }> = {
    first_step: { Icon: EmojiEvents, color: '#FFB300' },
    social_butterfly: { Icon: Diversity3, color: '#AB47BC' },
    team_leader: { Icon: WorkspacePremium, color: '#FFA726' },
    iron_man: { Icon: FitnessCenter, color: '#EF5350' },
    early_bird: { Icon: WbSunny, color: '#FF7043' },
    consistent: { Icon: LocalFireDepartment, color: '#FF5722' },
    campus_explorer: { Icon: Explore, color: '#26A69A' },
    night_owl: { Icon: NightsStay, color: '#7E57C2' },
};

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

const SOCIAL_PREFERENCE_LABELS: Record<string, string> = {
    LOW_KEY: '慢熟輕鬆型',
    BALANCED: '都可以型',
    OUTGOING: '主動聊天型',
};

export default function PublicProfilePage({ params }: { params: { id: string } }) {
    const { id } = params;

    // ─── SWR Hooks（自動快取 + 去重） ───
    const { data: profile, error: profileError, isLoading: loading } = useUserProfile(id);
    const { data: allBadges = [] } = useAllBadges();
    const { data: userBadges = [] } = useUserBadges(id);
    const error = profileError?.message || null;

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
    const usualLocations = profile.preferences?.usualLocations || [];
    const socialPreference = profile.preferences?.socialPreference || null;
    const bio = profile.preferences?.bio || '';
    const hobbies = profile.preferences?.hobbies || '';

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
                    {profile.pioneerTitle && (() => {
                        const iconEntry = TITLE_ICON_MAP[profile.pioneerTitle.icon];
                        const titleText = (profile.pioneerTitle.title || profile.pioneerTitle.label || '')
                            .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{200D}\u{20E3}]/gu, '').trim();
                        return (
                            <Chip
                                icon={iconEntry ? <iconEntry.Icon sx={{ fontSize: 16, color: 'white !important' }} /> : undefined}
                                label={titleText}
                                size="small"
                                sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem',
                                }}
                            />
                        );
                    })()}
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
                    {(bio || hobbies) && (
                        <Box sx={{ mb: 2.5 }}>
                            {bio && (
                                <Box sx={{ mb: hobbies ? 1.5 : 0 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>個人簡介</Typography>
                                    <Typography variant="body2">{bio}</Typography>
                                </Box>
                            )}
                            {hobbies && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>嗜好</Typography>
                                    <Typography variant="body2">{hobbies}</Typography>
                                </Box>
                            )}
                        </Box>
                    )}

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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip label={SKILL_LABELS[skillLevel] || skillLevel} size="small" color="primary" variant="outlined" />
                        {socialPreference && (
                            <Chip
                                label={SOCIAL_PREFERENCE_LABELS[socialPreference] || socialPreference}
                                size="small"
                                color="secondary"
                                variant="outlined"
                            />
                        )}
                    </Box>

                    {usualLocations.length > 0 && (
                        <>
                            <Typography variant="body2" color="text.secondary" gutterBottom>常去地點</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {usualLocations.map((location: string) => (
                                    <Chip key={location} label={location} size="small" variant="outlined" />
                                ))}
                            </Box>
                        </>
                    )}
                </Box>
            </Paper>

            {/* 成就勳章 */}
            {allBadges.length > 0 && (
                <Paper sx={{ p: 3, borderRadius: 4, mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <MilitaryTech sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight="bold">成就勳章</Typography>
                    </Box>
                    <Box sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: {
                            xs: 'repeat(2, minmax(0, 1fr))',
                            sm: 'repeat(3, minmax(0, 1fr))',
                            lg: 'repeat(4, minmax(0, 1fr))',
                        },
                        alignItems: 'stretch',
                    }}>
                        {allBadges.map(badge => {
                            const unlocked = userBadges.some((ub: any) => ub.code === badge.code);
                            return (
                                <Box key={badge.code} sx={{
                                    textAlign: 'center',
                                    p: { xs: 2, sm: 2.5 },
                                    borderRadius: 3,
                                    bgcolor: unlocked ? 'action.hover' : 'transparent',
                                    opacity: unlocked ? 1 : 0.4,
                                    border: '1px solid',
                                    borderColor: unlocked ? 'primary.main' : 'divider',
                                    minHeight: { xs: 176, sm: 188 },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    gap: 1,
                                    transition: 'all 0.3s',
                                }}>
                                    {(() => {
                                        const mapping = BADGE_ICON_MAP[badge.code];
                                        if (mapping) {
                                            const { Icon, color } = mapping;
                                            return <Icon sx={{ fontSize: 40, color, mt: 0.5 }} />;
                                        }
                                        return <Typography variant="h4" sx={{ lineHeight: 1.1, mt: 0.5 }}>{badge.icon}</Typography>;
                                    })()}
                                    <Typography
                                        variant="caption"
                                        fontWeight="bold"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        sx={{
                                            minHeight: 36,
                                            fontSize: '0.85rem',
                                            lineHeight: 1.35,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {badge.name.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{200D}\u{20E3}]/gu, '').trim()}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            fontSize: '0.72rem',
                                            lineHeight: 1.5,
                                            textAlign: 'center',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {badge.description}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
            )}
        </Container>
    );
}
