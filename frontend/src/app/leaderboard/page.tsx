'use client';

import { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Card, CardContent, Stack, Chip,
    ToggleButtonGroup, ToggleButton, Avatar, Skeleton, Paper
} from '@mui/material';
import {
    EmojiEvents, WorkspacePremium, MilitaryTech,
    TrendingUp, Groups, ArrowBack
} from '@mui/icons-material';
import Link from 'next/link';
import { Button } from '@mui/material';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface DeptRanking {
    rank: number;
    department: string;
    totalJoins: number;
    uniqueUsers: number;
    topSport?: string;
}

const SPORT_MAP: Record<string, { label: string; icon: string }> = {
    BASKETBALL: { label: '籃球', icon: '🏀' },
    RUNNING: { label: '跑步', icon: '🏃‍♂️' },
    BADMINTON: { label: '羽球', icon: '🏸' },
    TABLE_TENNIS: { label: '桌球', icon: '🏓' },
    GYM: { label: '健身', icon: '🏋️' },
    VOLLEYBALL: { label: '排球', icon: '🏐' },
};

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_ICONS = [
    <EmojiEvents key="gold" sx={{ color: '#FFD700', fontSize: 40 }} />,
    <WorkspacePremium key="silver" sx={{ color: '#C0C0C0', fontSize: 36 }} />,
    <MilitaryTech key="bronze" sx={{ color: '#CD7F32', fontSize: 32 }} />,
];

export default function LeaderboardPage() {
    const [period, setPeriod] = useState<'weekly' | 'all'>('weekly');
    const [departments, setDepartments] = useState<DeptRanking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [period]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/leaderboard/departments?period=${period}`);
            const json = await res.json();
            if (json.success) {
                setDepartments(json.data.departments);
            }
        } catch (e) {
            console.error('Leaderboard fetch error:', e);
        }
        setLoading(false);
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
                    🏆 系所排行榜
                </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={3}>
                用運動次數決勝負，看看哪個系所最活躍！
            </Typography>

            <Box mb={4}>
                <ToggleButtonGroup
                    value={period}
                    exclusive
                    onChange={(_, v) => v && setPeriod(v)}
                    size="small"
                    sx={{ bgcolor: 'action.hover', borderRadius: 3 }}
                >
                    <ToggleButton value="weekly" sx={{ borderRadius: 3, px: 3 }}>本週</ToggleButton>
                    <ToggleButton value="all" sx={{ borderRadius: 3, px: 3 }}>總計</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {loading ? (
                <Stack spacing={2}>
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 3 }} />
                    ))}
                </Stack>
            ) : departments.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
                    <Typography variant="h3" mb={2}>📊</Typography>
                    <Typography variant="h6" color="text.secondary">
                        {period === 'weekly' ? '本週還沒有人揪團，趕快成為第一位！' : '還沒有排行榜資料'}
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
                        }}>
                            <CardContent sx={{ py: 4 }}>
                                <Stack direction="row" justifyContent="center" alignItems="flex-end" spacing={3}>
                                    {/* 2nd Place */}
                                    <Box textAlign="center" flex={1}>
                                        <Box sx={{ mb: 1 }}>{MEDAL_ICONS[1]}</Box>
                                        <Typography variant="h6" fontWeight="bold" noWrap>
                                            {departments[1].department}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {departments[1].totalJoins} 次
                                        </Typography>
                                        {departments[1].topSport && SPORT_MAP[departments[1].topSport] && (
                                            <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                                                最愛: {SPORT_MAP[departments[1].topSport].icon} {SPORT_MAP[departments[1].topSport].label}
                                            </Typography>
                                        )}
                                    </Box>
                                    {/* 1st Place */}
                                    <Box textAlign="center" flex={1}>
                                        <Box sx={{ mb: 1 }}>{MEDAL_ICONS[0]}</Box>
                                        <Typography variant="h5" fontWeight="900" noWrap sx={{ color: 'primary.main' }}>
                                            {departments[0].department}
                                        </Typography>
                                        <Chip
                                            label={`${departments[0].totalJoins} 次`}
                                            color="primary"
                                            size="small"
                                            sx={{ mt: 0.5 }}
                                        />
                                        {departments[0].topSport && SPORT_MAP[departments[0].topSport] && (
                                            <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                                                最愛: {SPORT_MAP[departments[0].topSport].icon} {SPORT_MAP[departments[0].topSport].label}
                                            </Typography>
                                        )}
                                    </Box>
                                    {/* 3rd Place */}
                                    <Box textAlign="center" flex={1}>
                                        <Box sx={{ mb: 1 }}>{MEDAL_ICONS[2]}</Box>
                                        <Typography variant="h6" fontWeight="bold" noWrap>
                                            {departments[2].department}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {departments[2].totalJoins} 次
                                        </Typography>
                                        {departments[2].topSport && SPORT_MAP[departments[2].topSport] && (
                                            <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                                                最愛: {SPORT_MAP[departments[2].topSport].icon} {SPORT_MAP[departments[2].topSport].label}
                                            </Typography>
                                        )}
                                    </Box>
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
                            <CardContent sx={{ py: 2 }}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{
                                        width: 40, height: 40,
                                        bgcolor: dept.rank <= 3 ? MEDAL_COLORS[dept.rank - 1] : 'action.hover',
                                        color: dept.rank <= 3 ? '#fff' : 'text.secondary',
                                        fontWeight: 'bold',
                                        fontSize: dept.rank <= 3 ? 18 : 16,
                                    }}>
                                        {dept.rank}
                                    </Avatar>
                                    <Box flex={1}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {dept.department}
                                        </Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Groups fontSize="small" sx={{ color: 'text.secondary' }} />
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
                                    <Box textAlign="right">
                                        <Typography variant="h6" fontWeight="bold" color="primary.main">
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
            )}
        </Container>
    );
}
