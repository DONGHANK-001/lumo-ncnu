'use client';

import { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Card, CardContent, Stack, Chip,
    Avatar, Skeleton, Paper, useMediaQuery, useTheme
} from '@mui/material';
import { SPORT_NAMES, SPORT_EMOJIS } from '@/lib/constants';
import {
    EmojiEvents, WorkspacePremium, MilitaryTech,
    TrendingUp, Groups, ArrowBack, AccountBalance, SportsEsports, Celebration
} from '@mui/icons-material';
import Link from 'next/link';
import { Button, Tab, Tabs } from '@mui/material';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface DeptRanking {
    rank: number;
    department: string;
    totalJoins: number;
    uniqueUsers: number;
    topSport?: string;
}

interface ActivityRanking {
    rank: number;
    user: { id: string; nickname: string; avatarUrl: string | null; department: string | null; activeTitle: string | null };
    totalJoins: number;
    activityTitle?: string;
}

const PURE_SPORTS = ['BASKETBALL', 'RUNNING', 'BADMINTON', 'TABLE_TENNIS', 'GYM', 'VOLLEYBALL', 'TENNIS'] as const;
const SOCIAL_ACTIVITIES = ['NIGHT_WALK', 'DINING', 'STUDY'] as const;

const SPORT_MAP: Record<string, { label: string; icon: string }> = Object.fromEntries(
    Object.entries(SPORT_NAMES).map(([key, label]) => [key, { label, icon: SPORT_EMOJIS[key] || '🏅' }])
);

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_ICONS = [
    <EmojiEvents key="gold" sx={{ color: '#FFD700', fontSize: 40 }} />,
    <WorkspacePremium key="silver" sx={{ color: '#C0C0C0', fontSize: 36 }} />,
    <MilitaryTech key="bronze" sx={{ color: '#CD7F32', fontSize: 32 }} />,
];

// 活動排行稱號對照表
const ACTIVITY_TITLE_MAP: Record<string, { label: string; icon: string }> = {
    // 運動
    'sport_basketball_1': { label: '籃球之王', icon: '🏀' },
    'sport_basketball_2': { label: '灌籃悍將', icon: '🏀' },
    'sport_basketball_3': { label: '籃場新星', icon: '🏀' },
    'sport_running_1': { label: '極速飛人', icon: '🏃' },
    'sport_running_2': { label: '疾風跑者', icon: '🏃' },
    'sport_running_3': { label: '耐力新星', icon: '🏃' },
    'sport_badminton_1': { label: '羽球至尊', icon: '🏸' },
    'sport_badminton_2': { label: '殺球悍將', icon: '🏸' },
    'sport_badminton_3': { label: '羽場新星', icon: '🏸' },
    'sport_table_tennis_1': { label: '桌球至尊', icon: '🏓' },
    'sport_table_tennis_2': { label: '旋球悍將', icon: '🏓' },
    'sport_table_tennis_3': { label: '桌場新星', icon: '🏓' },
    'sport_gym_1': { label: '鐵人霸主', icon: '💪' },
    'sport_gym_2': { label: '鋼鐵悍將', icon: '💪' },
    'sport_gym_3': { label: '健身新星', icon: '💪' },
    'sport_volleyball_1': { label: '排球至尊', icon: '🏐' },
    'sport_volleyball_2': { label: '扣殺悍將', icon: '🏐' },
    'sport_volleyball_3': { label: '排場新星', icon: '🏐' },
    'sport_tennis_1': { label: '網球至尊', icon: '🎾' },
    'sport_tennis_2': { label: 'ACE悍將', icon: '🎾' },
    'sport_tennis_3': { label: '網場新星', icon: '🎾' },
    // 社交
    'social_night_walk_1': { label: '月夜行者', icon: '🌙' },
    'social_night_walk_2': { label: '星夜漫遊', icon: '🌙' },
    'social_night_walk_3': { label: '夜行新星', icon: '🌙' },
    'social_dining_1': { label: '美食霸主', icon: '🍽️' },
    'social_dining_2': { label: '饕餮使者', icon: '🍽️' },
    'social_dining_3': { label: '覓食新星', icon: '🍽️' },
    'social_study_1': { label: '學霸之王', icon: '📚' },
    'social_study_2': { label: '書卷達人', icon: '📚' },
    'social_study_3': { label: '學海新星', icon: '📚' },
};

// 創始會員 / 活動稱號對照表 (前端顯示用)
const TITLE_MAP: Record<string, { label: string; icon: string }> = {
    'pioneer_1': { label: '創始先鋒 #001', icon: '💎' },
    'pioneer_2': { label: '創始先鋒 #002', icon: '💎' },
    'pioneer_3': { label: '創始先鋒 #003', icon: '💎' },
    'pioneer_4': { label: '創始先鋒 #004', icon: '💎' },
    'pioneer_5': { label: '創始先鋒 #005', icon: '💎' },
    'pioneer_6': { label: '創始先鋒 #006', icon: '💎' },
    'pioneer_7': { label: '創始先鋒 #007', icon: '💎' },
    'pioneer_8': { label: '創始先鋒 #008', icon: '💎' },
    'pioneer_9': { label: '創始先鋒 #009', icon: '💎' },
    'pioneer_10': { label: '創始先鋒 #010', icon: '💎' },
    'wbc_2026': { label: '經典賽應援團 2026', icon: '⚾' },
    ...ACTIVITY_TITLE_MAP,
};

export default function LeaderboardPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [tab, setTab] = useState<'DEPT' | 'SPORT' | 'SOCIAL'>('DEPT');
    const [departments, setDepartments] = useState<DeptRanking[]>([]);
    const [activityRankings, setActivityRankings] = useState<ActivityRanking[]>([]);

    const [selectedSport, setSelectedSport] = useState<string>(PURE_SPORTS[0]);
    const [selectedSocial, setSelectedSocial] = useState<string>(SOCIAL_ACTIVITIES[0]);

    const [loading, setLoading] = useState(true);
    const [readingEvent, setReadingEvent] = useState(false);

    useEffect(() => {
        if (tab === 'DEPT') {
            fetchDeptLeaderboard();
        } else {
            const type = tab === 'SPORT' ? selectedSport : selectedSocial;
            fetchActivityLeaderboard(type);
        }
    }, [tab, selectedSport, selectedSocial]);

    const fetchDeptLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/leaderboard/departments?period=current`);
            const json = await res.json();
            if (json.success) {
                setDepartments(json.data.departments);
                if (json.data.readingEvent) setReadingEvent(true);
            }
        } catch (e) {
            console.error('Leaderboard fetch error:', e);
        }
        setLoading(false);
    };

    const fetchActivityLeaderboard = async (type: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/leaderboard/by-activity?type=${type}`);
            const json = await res.json();
            if (json.success) {
                setActivityRankings(json.data);
            }
        } catch (e) {
            console.error('Activity leaderboard fetch error:', e);
        }
        setLoading(false);
    };

    const renderActivitySelector = (types: readonly string[], selected: string, onSelect: (t: string) => void) => (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {types.map(t => (
                <Chip
                    key={t}
                    label={`${SPORT_EMOJIS[t] || '🏅'} ${SPORT_NAMES[t] || t}`}
                    onClick={() => onSelect(t)}
                    color={selected === t ? 'primary' : 'default'}
                    variant={selected === t ? 'filled' : 'outlined'}
                    sx={{ fontWeight: selected === t ? 'bold' : 'normal' }}
                />
            ))}
        </Stack>
    );

    const renderActivityRankings = () => {
        if (activityRankings.length === 0) {
            return (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
                    <Typography variant="h3" mb={2}>📊</Typography>
                    <Typography variant="h6" color="text.secondary">
                        本月還沒有排行榜資料
                    </Typography>
                </Paper>
            );
        }
        return (
            <Stack spacing={2}>
                {activityRankings.map((ar) => (
                    <Link key={ar.user.id} href={`/users/${ar.user.id}`} passHref style={{ textDecoration: 'none' }}>
                        <Card sx={{
                            borderRadius: 3,
                            borderLeft: ar.rank <= 3 ? `4px solid ${MEDAL_COLORS[ar.rank - 1]}` : 'none',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.02)' }
                        }}>
                            <CardContent sx={{ py: 2, px: { xs: 1.5, sm: 2 } }}>
                                <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }}>
                                    <Avatar sx={{
                                        width: { xs: 28, sm: 40 }, height: { xs: 28, sm: 40 },
                                        bgcolor: ar.rank <= 3 ? MEDAL_COLORS[ar.rank - 1] : 'action.hover',
                                        color: ar.rank <= 3 ? '#fff' : 'text.secondary',
                                        fontWeight: 'bold',
                                        fontSize: { xs: 13, sm: ar.rank <= 3 ? 18 : 16 },
                                        flexShrink: 0,
                                    }}>
                                        {ar.rank}
                                    </Avatar>
                                    <Avatar
                                        src={ar.user.avatarUrl || undefined}
                                        sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, flexShrink: 0 }}
                                    >
                                        {!ar.user.avatarUrl && (ar.user.nickname || '匿')[0].toUpperCase()}
                                    </Avatar>
                                    <Box flex={1} minWidth={0}>
                                        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.5}>
                                            <Typography
                                                variant={isMobile ? 'body2' : 'subtitle1'}
                                                fontWeight="bold"
                                                color="text.primary"
                                                sx={{ wordBreak: 'break-word' }}
                                            >
                                                {ar.user.nickname || '匿名使用者'}
                                            </Typography>
                                            {ar.activityTitle && ACTIVITY_TITLE_MAP[ar.activityTitle] && (
                                                <Chip
                                                    label={`${ACTIVITY_TITLE_MAP[ar.activityTitle].icon} ${ACTIVITY_TITLE_MAP[ar.activityTitle].label}`}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        background: ar.rank === 1
                                                            ? 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)'
                                                            : ar.rank === 2
                                                                ? 'linear-gradient(45deg, #C0C0C0 30%, #E0E0E0 90%)'
                                                                : 'linear-gradient(45deg, #CD7F32 30%, #D4A373 90%)',
                                                        color: 'white',
                                                        height: isMobile ? 20 : 24,
                                                        fontSize: isMobile ? '0.65rem' : undefined,
                                                    }}
                                                />
                                            )}
                                            {ar.user.activeTitle && TITLE_MAP[ar.user.activeTitle] && (
                                                <Chip
                                                    label={`${TITLE_MAP[ar.user.activeTitle].icon} ${TITLE_MAP[ar.user.activeTitle].label}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        fontWeight: '500',
                                                        height: isMobile ? 20 : 24,
                                                        fontSize: isMobile ? '0.65rem' : undefined,
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                        {ar.user.department && (
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ wordBreak: 'break-word' }}>
                                                🏢 {ar.user.department}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box textAlign="right" flexShrink={0}>
                                        <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight="bold" color="primary.main">
                                            {ar.totalJoins}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            參團次數
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </Stack>
        );
    };

    return (
        <Container maxWidth="md" sx={{ py: 4, pb: 10 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
                <Button startIcon={<ArrowBack />} sx={{ mb: 2, color: 'text.secondary' }}>
                    返回首頁
                </Button>
            </Link>

            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                <TrendingUp sx={{ fontSize: 36, color: 'primary.main' }} />
                <Typography variant="h4" fontWeight="bold">
                    🏆 排行榜
                </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={3}>
                每月結算，各項運動與社交活動前三名獲得專屬稱號！
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                    <Tab icon={<AccountBalance />} label="系所排行" value="DEPT" />
                    <Tab icon={<SportsEsports />} label="運動排行" value="SPORT" />
                    <Tab icon={<Celebration />} label="社交排行" value="SOCIAL" />
                </Tabs>
            </Box>

            {/* 讀家回憶活動 Banner */}
            {readingEvent && (
                <Paper sx={{ p: 1.5, mb: 2, borderRadius: 3, bgcolor: 'info.main', color: 'white', textAlign: 'center' }}>
                    <Typography variant="body2" fontWeight="bold">
                        📚 4/7~4/17 讀家回憶活動進行中 — 快去「社交排行」查看讀家回憶排名！
                    </Typography>
                </Paper>
            )}

            {
                loading ? (
                    <Stack spacing={2}>
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 3 }} />
                        ))}
                    </Stack>
                ) : tab === 'DEPT' ? (
                    // ── 系所排行 ──
                    departments.length === 0 ? (
                        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
                            <Typography variant="h3" mb={2}>📊</Typography>
                            <Typography variant="h6" color="text.secondary">
                                還沒有排行榜資料
                            </Typography>
                        </Paper>
                    ) : (
                        <Stack spacing={2}>
                            {/* Top 3 Podium */}
                            {departments.length >= 3 && (
                                <Card sx={{
                                    borderRadius: 4,
                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    mb: 2,
                                    overflow: 'hidden',
                                }}>
                                    <CardContent sx={{ py: { xs: 2.5, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
                                        <Stack
                                            direction={isMobile ? 'column' : 'row'}
                                            justifyContent="center"
                                            alignItems={isMobile ? 'stretch' : 'flex-end'}
                                            spacing={isMobile ? 2 : 3}
                                        >
                                            {(isMobile ? [0, 1, 2] : [1, 0, 2]).map((idx) => {
                                                const dept = departments[idx];
                                                const isFirst = idx === 0;
                                                return (
                                                    <Box
                                                        key={dept.department}
                                                        textAlign="center"
                                                        flex={isMobile ? undefined : 1}
                                                        sx={isMobile ? {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1.5,
                                                            textAlign: 'left',
                                                        } : {}}
                                                    >
                                                        <Box sx={{ mb: isMobile ? 0 : 1, flexShrink: 0 }}>{MEDAL_ICONS[idx]}</Box>
                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                            <Typography
                                                                variant={isFirst ? (isMobile ? 'subtitle1' : 'h5') : (isMobile ? 'body2' : 'h6')}
                                                                fontWeight={isFirst ? 900 : 'bold'}
                                                                sx={{
                                                                    color: isFirst ? 'primary.main' : 'text.primary',
                                                                    wordBreak: 'break-word',
                                                                }}
                                                            >
                                                                {dept.department}
                                                            </Typography>
                                                            <Typography variant={isMobile ? 'caption' : 'body2'} color="text.secondary">
                                                                {dept.totalJoins} 次
                                                            </Typography>
                                                            {dept.topSport && SPORT_MAP[dept.topSport] && (
                                                                <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                                                                    最愛: {SPORT_MAP[dept.topSport].icon} {SPORT_MAP[dept.topSport].label}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Full List */}
                            {departments.map((dept) => (
                                <Card key={dept.department} sx={{
                                    borderRadius: 3,
                                    borderLeft: dept.rank <= 3 ? `4px solid ${MEDAL_COLORS[dept.rank - 1]}` : 'none',
                                }}>
                                    <CardContent sx={{ py: 2, px: { xs: 1.5, sm: 2 } }}>
                                        <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }}>
                                            <Avatar sx={{
                                                width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 },
                                                bgcolor: dept.rank <= 3 ? MEDAL_COLORS[dept.rank - 1] : 'action.hover',
                                                color: dept.rank <= 3 ? '#fff' : 'text.secondary',
                                                fontWeight: 'bold',
                                                fontSize: { xs: 14, sm: dept.rank <= 3 ? 18 : 16 },
                                                flexShrink: 0,
                                            }}>
                                                {dept.rank}
                                            </Avatar>
                                            <Box flex={1} minWidth={0}>
                                                <Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap">
                                                    <Typography variant={isMobile ? 'body2' : 'subtitle1'} fontWeight="bold" sx={{ wordBreak: 'break-word' }}>
                                                        {dept.department}
                                                    </Typography>
                                                </Stack>
                                                <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                                                    <Groups sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {dept.uniqueUsers} 位同學
                                                    </Typography>
                                                    {dept.topSport && SPORT_MAP[dept.topSport] && (
                                                        <>
                                                            <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>•</Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                最愛: {SPORT_MAP[dept.topSport].icon} {SPORT_MAP[dept.topSport].label}
                                                            </Typography>
                                                        </>
                                                    )}
                                                </Stack>
                                            </Box>
                                            <Box textAlign="right" flexShrink={0}>
                                                <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight="bold" color="primary.main">
                                                    {dept.totalJoins}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    參與次數
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    )
                ) : tab === 'SPORT' ? (
                    // ── 運動排行 ──
                    <>
                        {renderActivitySelector(PURE_SPORTS, selectedSport, setSelectedSport)}
                        {renderActivityRankings()}
                    </>
                ) : (
                    // ── 社交排行 ──
                    <>
                        {renderActivitySelector(SOCIAL_ACTIVITIES, selectedSocial, setSelectedSocial)}
                        {renderActivityRankings()}
                    </>
                )
            }
        </Container>
    );
}
