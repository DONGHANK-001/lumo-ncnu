'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import {
    Box,
    Container,
    Typography,
    Button,
    TextField,
    Paper,
    Stack,
    Avatar,
    Chip,
    Grid,
    Alert,
    CircularProgress,
    Divider,
    IconButton
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    Save,
    Logout,
    Star,
    AdminPanelSettings,
    LocalFireDepartment
} from '@mui/icons-material';

const SPORT_OPTIONS = [
    { value: 'BASKETBALL', label: '🏀 籃球' },
    { value: 'RUNNING', label: '🏃 跑步' },
    { value: 'BADMINTON', label: '🏸 羽球' },
    { value: 'TABLE_TENNIS', label: '🏓 桌球' },
    { value: 'GYM', label: '💪 健身' },
];

const LEVEL_OPTIONS = [
    { value: 'BEGINNER', label: '初學者' },
    { value: 'INTERMEDIATE', label: '中級' },
    { value: 'ADVANCED', label: '進階' },
    { value: 'ANY', label: '不限' },
];

const TIME_OPTIONS = [
    '平日早上',
    '平日中午',
    '平日晚上',
    '週末早上',
    '週末下午',
    '週末晚上',
];

const LOCATION_OPTIONS = [
    '體育館',
    '操場',
    '健身房',
    '籃球場',
    '羽球場',
];

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading, signIn, signOut, getToken, refreshUser } = useAuth();

    const [form, setForm] = useState({
        nickname: '',
        sports: [] as string[],
        skillLevel: 'BEGINNER',
        availableTimes: [] as string[],
        usualLocations: [] as string[],
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setForm({
                nickname: user.nickname || '',
                sports: user.preferences?.sports || [],
                skillLevel: user.preferences?.skillLevel || 'BEGINNER',
                availableTimes: user.preferences?.availableTimes || [],
                usualLocations: user.preferences?.usualLocations || [],
            });
        }
    }, [user]);

    const toggleArrayItem = (array: string[], item: string) => {
        return array.includes(item) ? array.filter((i) => i !== item) : [...array, item];
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        setMessage(null);

        const token = await getToken();
        const response = await api.updateProfile(token!, {
            nickname: form.nickname,
            preferences: {
                sports: form.sports,
                skillLevel: form.skillLevel,
                availableTimes: form.availableTimes,
                usualLocations: form.usualLocations,
            },
        });

        if (response.success) {
            setMessage({ type: 'success', text: '已儲存！' });
            await refreshUser();
        } else {
            setMessage({ type: 'error', text: response.error?.message || '儲存失敗' });
        }
        setSaving(false);
    };

    const handleUpgrade = async () => {
        if (!user) return;

        setSaving(true);
        const token = await getToken();
        const response = await api.upgradePlan(token!);

        if (response.success) {
            setMessage({ type: 'success', text: '升級成功！您現在是 PLUS 會員' });
            await refreshUser();
        } else {
            setMessage({ type: 'error', text: response.error?.message || '升級失敗' });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return (
            <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
                <Typography variant="h2" mb={2}>👤</Typography>
                <Typography variant="h5" fontWeight="bold" gutterBottom>個人檔案</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    請先登入以查看個人檔案
                </Typography>
                <Stack spacing={2} direction="column" alignItems="center">
                    <Button variant="contained" onClick={signIn}>
                        使用學生帳號登入
                    </Button>
                    <Button
                        variant="outlined"
                        component={Link}
                        href="/"
                        startIcon={<ArrowBack />}
                    >
                        返回首頁
                    </Button>
                </Stack>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4, pb: 10 }}>
            <Button
                startIcon={<ArrowBack />}
                component={Link}
                href="/"
                sx={{ mb: 2, color: 'text.secondary' }}
            >
                返回首頁
            </Button>

            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">個人檔案</Typography>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Logout />}
                    onClick={signOut}
                >
                    登出
                </Button>
            </Stack>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                mx: 'auto',
                                mb: 2,
                                fontSize: '2.5rem',
                                bgcolor: 'primary.main'
                            }}
                        >
                            {(form.nickname || user.email)[0].toUpperCase()}
                        </Avatar>
                        <Stack alignItems="center" spacing={1}>
                            {user.planType === 'PLUS' && (
                                <Chip label="PLUS 會員" size="small" color="secondary" icon={<Star />} />
                            )}
                            <Typography variant="h6" fontWeight="bold">
                                {form.nickname || '未設定暱稱'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {user.email}
                            </Typography>
                        </Stack>

                        <Divider sx={{ my: 3 }} />

                        {/* 信譽/出席率展示 */}
                        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" justifyContent="center" gap={1}>
                                <LocalFireDepartment color="error" fontSize="small" />
                                綜合信譽
                            </Typography>
                            <Stack direction="row" justifyContent="space-around" mt={2} mb={1}>
                                <Box>
                                    <Typography variant="h6" color="success.main" fontWeight="bold">
                                        {user.attendedCount}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">出席</Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem />
                                <Box>
                                    <Typography variant="h6" color="error.main" fontWeight="bold">
                                        {user.noShowCount}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">缺席</Typography>
                                </Box>
                            </Stack>
                            <Typography variant="caption" color="text.secondary" display="block">
                                出席率：{(user.attendedCount + user.noShowCount) === 0 ? '無紀錄' : `${Math.round((user.attendedCount / (user.attendedCount + user.noShowCount)) * 100)}%`}
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {user.planType === 'FREE' && (
                            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>PLUS 方案</Typography>
                                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                    每月 $20，解鎖候補功能（即將推出）
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    disabled
                                >
                                    敬請期待
                                </Button>
                            </Box>
                        )}

                        {user.role === 'ADMIN' && (
                            <Box sx={{ mt: 2, bgcolor: 'primary.main', p: 2, borderRadius: 2, color: 'white' }}>
                                <Typography variant="subtitle2" gutterBottom>系統管理</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 2 }}>
                                    您擁有管理員權限，可進入後台管理揪團與網站設定。
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                    fullWidth
                                    component={Link}
                                    href="/admin"
                                    startIcon={<AdminPanelSettings />}
                                >
                                    進入管理後台
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Stack spacing={3}>
                        {message && (
                            <Alert severity={message.type === 'success' ? 'success' : 'error'}>
                                {message.text}
                            </Alert>
                        )}

                        <Paper sx={{ p: 4, borderRadius: 4 }}>
                            <Typography variant="h6" gutterBottom mb={3}>基本資料</Typography>
                            <TextField
                                label="暱稱"
                                fullWidth
                                value={form.nickname}
                                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                                placeholder="輸入你的暱稱"
                                inputProps={{ maxLength: 50 }}
                            />
                        </Paper>

                        <Paper sx={{ p: 4, borderRadius: 4 }}>
                            <Typography variant="h6" gutterBottom mb={3}>偏好設定</Typography>

                            <Stack spacing={4}>
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>喜好運動</Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {SPORT_OPTIONS.map((sport) => (
                                            <Chip
                                                key={sport.value}
                                                label={sport.label}
                                                clickable
                                                onClick={() => setForm({ ...form, sports: toggleArrayItem(form.sports, sport.value) })}
                                                color={form.sports.includes(sport.value) ? 'primary' : 'default'}
                                                variant={form.sports.includes(sport.value) ? 'filled' : 'outlined'}
                                            />
                                        ))}
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>程度</Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {LEVEL_OPTIONS.map((level) => (
                                            <Chip
                                                key={level.value}
                                                label={level.label}
                                                clickable
                                                onClick={() => setForm({ ...form, skillLevel: level.value })}
                                                color={form.skillLevel === level.value ? 'primary' : 'default'}
                                                variant={form.skillLevel === level.value ? 'filled' : 'outlined'}
                                            />
                                        ))}
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>可運動時段</Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {TIME_OPTIONS.map((time) => (
                                            <Chip
                                                key={time}
                                                label={time}
                                                clickable
                                                onClick={() => setForm({ ...form, availableTimes: toggleArrayItem(form.availableTimes, time) })}
                                                color={form.availableTimes.includes(time) ? 'primary' : 'default'}
                                                variant={form.availableTimes.includes(time) ? 'filled' : 'outlined'}
                                            />
                                        ))}
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>常去地點</Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {LOCATION_OPTIONS.map((loc) => (
                                            <Chip
                                                key={loc}
                                                label={loc}
                                                clickable
                                                onClick={() => setForm({ ...form, usualLocations: toggleArrayItem(form.usualLocations, loc) })}
                                                color={form.usualLocations.includes(loc) ? 'primary' : 'default'}
                                                variant={form.usualLocations.includes(loc) ? 'filled' : 'outlined'}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Paper>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleSave}
                            disabled={saving}
                            startIcon={<Save />}
                        >
                            {saving ? '儲存中...' : '儲存變更'}
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
}
