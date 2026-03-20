'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import { SportType, SkillLevel } from '@/types';
import { SPORT_NAMES, LEVEL_NAMES } from '@/lib/constants';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    Chip,
    Stack,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Fab,
    IconButton,
    InputAdornment,
    Skeleton,
    Paper
} from '@mui/material';
import {
    Add as AddIcon,
    ArrowBack,
    LocationOn,
    Event,
    People,
    FilterList
} from '@mui/icons-material';

interface Group {
    id: string;
    sportType: string;
    title: string;
    description: string | null;
    time: string;
    location: string;
    level: string;
    capacity: number;
    currentCount: number;
    status: string;
    tags: string[];
    createdBy: { nickname: string | null; email: string; planType?: string };
}

export default function GroupsPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        sportType: '',
        level: '',
        hasSlot: false,
    });

    useEffect(() => {
        fetchGroups();
    }, [filters]);

    useEffect(() => {
        const socket = getSocket();
        joinRoom('groups');

        const handleGroupUpdated = (updatedGroup: { id: string; currentCount: number; status: string }) => {
            setGroups((prev) =>
                prev.map((g) =>
                    g.id === updatedGroup.id
                        ? { ...g, currentCount: updatedGroup.currentCount, status: updatedGroup.status }
                        : g
                )
            );
        };

        const handleGroupCreated = (newGroup: Group) => {
            // 有新揪團時，直接加到列表最前面 (若需精細過濾可再判斷 sportType 等)
            setGroups((prev) => {
                // 避免重複
                if (prev.find(g => g.id === newGroup.id)) return prev;
                return [newGroup, ...prev];
            });
        };

        socket.on('group_updated', handleGroupUpdated);
        socket.on('group_created', handleGroupCreated);

        return () => {
            socket.off('group_updated', handleGroupUpdated);
            socket.off('group_created', handleGroupCreated);
            leaveRoom('groups');
        };
    }, []);

    const fetchGroups = async () => {
        setLoading(true);
        const query: Record<string, string> = {};
        if (filters.sportType) query.sportType = filters.sportType;
        if (filters.level) query.level = filters.level;
        if (filters.hasSlot) query.hasSlot = 'true';

        const response = await api.getGroups(query);
        if (response.success && response.data) {
            setGroups(response.data.items as Group[]);
        }
        setLoading(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-TW', {
            month: 'short',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'BEGINNER': return 'success';
            case 'INTERMEDIATE': return 'warning';
            case 'ADVANCED': return 'error';
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ pt: 4, pb: 10 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Button
                        startIcon={<ArrowBack />}
                        component={Link}
                        href="/"
                        sx={{ mb: 1, color: 'text.secondary' }}
                    >
                        返回首頁
                    </Button>
                    <Typography variant="h4" fontWeight="bold">揪團列表</Typography>
                </Box>
                {user && (
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            component={Link}
                            href="/create"
                        >
                            發起揪團
                        </Button>
                    </Box>
                )}
            </Stack>

            {/* Filters */}
            <Card sx={{ mb: 4, bgcolor: 'background.paper', backgroundImage: 'none' }} variant="outlined">
                <CardContent>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <FilterList sx={{ mr: 1 }} />
                            <Typography variant="body2">篩選</Typography>
                        </Box>

                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>運動類型</InputLabel>
                            <Select
                                value={filters.sportType}
                                label="運動類型"
                                onChange={(e) => setFilters({ ...filters, sportType: e.target.value })}
                            >
                                <MenuItem value="">全部</MenuItem>
                                {Object.entries(SportType).map(([key, value]) => (
                                    <MenuItem key={key} value={value}>{SPORT_NAMES[value]}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>程度</InputLabel>
                            <Select
                                value={filters.level}
                                label="程度"
                                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                            >
                                <MenuItem value="">全部</MenuItem>
                                {Object.entries(SkillLevel).map(([key, value]) => (
                                    <MenuItem key={key} value={value}>{LEVEL_NAMES[value]}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={filters.hasSlot}
                                    onChange={(e) => setFilters({ ...filters, hasSlot: e.target.checked })}
                                />
                            }
                            label="只顯示有空位"
                        />
                    </Stack>
                </CardContent>
            </Card>

            {/* Groups Grid */}
            {loading ? (
                <Grid container spacing={3}>
                    {[...Array(6)].map((_, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Card sx={{ height: '100%', borderRadius: 3 }}>
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Skeleton variant="rounded" width={80} height={24} />
                                            <Skeleton variant="rounded" width={60} height={24} />
                                        </Stack>
                                        <Skeleton variant="text" width="100%" height={28} />
                                        <Stack spacing={1}>
                                            <Skeleton variant="text" width="100%" height={16} />
                                            <Skeleton variant="text" width="100%" height={16} />
                                            <Skeleton variant="text" width="80%" height={16} />
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : groups.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
                    <Typography variant="h3" sx={{ mb: 2 }}>🏃</Typography>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        目前沒有符合條件的揪團
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        試試調整篩選條件或成為第一個發起揪團的人！
                    </Typography>
                    {user && (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                            <Button
                                variant="contained"
                                component={Link}
                                href="/create"
                            >
                                發起揪團
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => setFilters({ sportType: '', level: '', hasSlot: false })}
                            >
                                重置篩選
                            </Button>
                        </Stack>
                    )}
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {groups.map((group) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={group.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                                    ...(group.createdBy.planType === 'PLUS' && {
                                        border: '2px solid',
                                        borderColor: '#FFD700',
                                        boxShadow: '0 0 12px rgba(255, 215, 0, 0.25)',
                                    }),
                                    position: 'relative',
                                }}
                                onClick={() => window.location.href = `/groups/${group.id}`}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" mb={2}>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <Chip
                                                label={SPORT_NAMES[group.sportType]}
                                                color="primary"
                                                variant="filled"
                                                size="small"
                                            />
                                            {group.createdBy.planType === 'PLUS' && (
                                                <Chip
                                                    label="⚜️ 黑金"
                                                    size="small"
                                                    sx={{
                                                        background: 'linear-gradient(135deg, #FFD700, #B8860B)',
                                                        color: '#000',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.65rem',
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                        <Chip
                                            label={LEVEL_NAMES[group.level]}
                                            // @ts-ignore
                                            color={getLevelColor(group.level)}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Stack>

                                    <Typography variant="h6" gutterBottom sx={{ '&:hover': { color: 'primary.main' } }}>
                                        {group.title}
                                    </Typography>

                                    {group.tags && group.tags.length > 0 && (
                                        <Stack direction="row" flexWrap="wrap" gap={0.5} mt={1}>
                                            {group.tags.map((tag: string) => (
                                                <Chip key={tag} label={tag} size="small" variant="filled" sx={{ bgcolor: 'action.hover', fontSize: '0.7rem' }} />
                                            ))}
                                        </Stack>
                                    )}

                                    <Stack spacing={1} sx={{ color: 'text.secondary', mt: 2 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Event fontSize="small" />
                                            <Typography variant="body2">{formatDate(group.time)}</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <LocationOn fontSize="small" />
                                            <Typography variant="body2">{group.location}</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <People fontSize="small" />
                                            <Typography variant="body2">
                                                {group.currentCount}/{group.capacity} 人
                                                {group.currentCount >= group.capacity && (
                                                    <Typography component="span" variant="caption" color="error" sx={{ ml: 1, fontWeight: 'bold' }}>
                                                        已滿
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                                <CardActions sx={{ px: 2, pb: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        發起人：{group.createdBy.nickname || group.createdBy.email.split('@')[0]}
                                    </Typography>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Mobile FAB */}
            {user && (
                <Fab
                    color="primary"
                    aria-label="add"
                    component={Link}
                    href="/create"
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        display: { sm: 'none' }
                    }}
                >
                    <AddIcon />
                </Fab>
            )}
        </Container>
    );
}
