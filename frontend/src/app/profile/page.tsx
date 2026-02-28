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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
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
    { value: 'VOLLEYBALL', label: '🏐 排球' },
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

    // Avatar Editor
    const [avatarDialog, setAvatarDialog] = useState(false);
    const [tempAvatarStyle, setTempAvatarStyle] = useState('adventurer');
    const [tempAvatarSeed, setTempAvatarSeed] = useState('');
    const [tempAvatarUrl, setTempAvatarUrl] = useState('');

    const avatarStyles = ['adventurer', 'bottts', 'fun-emoji', 'identicon', 'lorelei'];

    const generateRandomAvatar = () => {
        const style = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
        const seed = Math.random().toString(36).substring(7);
        setTempAvatarStyle(style);
        setTempAvatarSeed(seed);
        setTempAvatarUrl(`https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`);
    };

    const handleSaveAvatar = async () => {
        if (!user) return;
        setSaving(true);
        const token = await getToken();
        // Fallback user avatar to standard API call
        const response = await api.updateAvatar(token!, tempAvatarUrl);
        if (response.success) {
            setMessage({ type: 'success', text: '頭像更新成功！' });
            await refreshUser();
            setAvatarDialog(false);
        } else {
            setMessage({ type: 'error', text: response.error?.message || '頭像更新失敗' });
        }
        setSaving(false);
    };

    // Badges
    const [allBadges, setAllBadges] = useState<any[]>([]);
    const [myBadges, setMyBadges] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        // Fetch all badges
        api.getBadges().then(res => { if (res.success && res.data) setAllBadges(res.data as any[]); });
    }, []);

    useEffect(() => {
        if (user) {
            getToken().then(token => {
                if (token) {
                    api.getMyBadges(token).then(res => { if (res.success && res.data) setMyBadges(res.data as any[]); });
                    api.getMyStats(token).then(res => { if (res.success && res.data) setStats(res.data); });
                    api.checkBadges(token); // auto-check
                }
            });
        }
    }, [user]);

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
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, position: 'relative' }}>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Avatar
                                src={user.avatarUrl || undefined}
                                sx={{
                                    width: 120,
                                    height: 120,
                                    mx: 'auto',
                                    mb: 2,
                                    fontSize: '2.5rem',
                                    bgcolor: 'primary.main',
                                    border: user.planType === 'PLUS' ? '4px solid gold' : '4px solid transparent',
                                    boxShadow: user.planType === 'PLUS' ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {!user.avatarUrl && (form.nickname || user.email)[0].toUpperCase()}
                            </Avatar>
                            <IconButton
                                onClick={() => {
                                    if (!tempAvatarUrl) generateRandomAvatar();
                                    setAvatarDialog(true);
                                }}
                                color="primary"
                                sx={{
                                    position: 'absolute',
                                    bottom: 12,
                                    right: 5,
                                    bgcolor: 'background.paper',
                                    boxShadow: 2,
                                    '&:hover': { bgcolor: 'grey.100' }
                                }}
                            >
                                <Edit fontSize="small" />
                            </IconButton>
                        </Box>
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
                            <Typography variant="h6" fontWeight="bold" mb={3}>📊 我的運動數據 (本週)</Typography>

                            {stats ? (
                                <Stack spacing={4}>
                                    <Stack direction="row" spacing={3} justifyContent="space-around" sx={{ textAlign: 'center' }}>
                                        <Box>
                                            <Typography variant="h4" color="primary.main" fontWeight="bold">{stats.currentStreak}</Typography>
                                            <Typography variant="body2" color="text.secondary">🔥 連續天數</Typography>
                                            <Typography variant="caption" color="text.secondary">最高 {stats.longestStreak} 天</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="h4" color="secondary.main" fontWeight="bold">{stats.weeklyHours}</Typography>
                                            <Typography variant="body2" color="text.secondary">⏱️ 本週時數</Typography>
                                            <Typography variant="caption" color="text.secondary">本月積累 {stats.monthlyHours} 懂</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="h4" color="warning.main" fontWeight="bold">{stats.totalCalories}</Typography>
                                            <Typography variant="body2" color="text.secondary">🔥 預估燃脂 (大卡)</Typography>
                                        </Box>
                                    </Stack>

                                    <Divider />

                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Typography variant="subtitle2" mb={2} color="text.secondary" textAlign="center">
                                                一週運動時數分佈
                                            </Typography>
                                            <BarChart
                                                xAxis={[{ scaleType: 'band', data: stats.weeklyData.map((d: any) => d.day) }]}
                                                series={[{ data: stats.weeklyData.map((d: any) => d.hours), color: '#FE6B8B' }]}
                                                height={250}
                                                margin={{ left: 30, right: 10, top: 10, bottom: 30 }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Typography variant="subtitle2" mb={2} color="text.secondary" textAlign="center">
                                                運動項目分佈
                                            </Typography>
                                            <PieChart
                                                series={[{
                                                    data: stats.sportDistribution,
                                                    innerRadius: 30,
                                                    outerRadius: 80,
                                                    paddingAngle: 5,
                                                    cornerRadius: 5,
                                                }]}
                                                height={250}
                                                margin={{ right: 80 }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Stack>
                            ) : (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress size={24} />
                                </Box>
                            )}
                        </Paper>

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

                        {/* Badges Section */}
                        <Paper sx={{ p: 3, borderRadius: 4 }}>
                            <Typography variant="h6" fontWeight="bold" mb={2}>🏅 成就勳章</Typography>
                            <Stack direction="row" flexWrap="wrap" gap={2}>
                                {allBadges.map(badge => {
                                    const unlocked = myBadges.some(mb => mb.code === badge.code);
                                    return (
                                        <Box key={badge.code} sx={{
                                            textAlign: 'center',
                                            p: 2,
                                            borderRadius: 3,
                                            bgcolor: unlocked ? 'action.hover' : 'transparent',
                                            opacity: unlocked ? 1 : 0.4,
                                            border: '1px solid',
                                            borderColor: unlocked ? 'primary.main' : 'divider',
                                            minWidth: 90,
                                            transition: 'all 0.3s',
                                        }}>
                                            <Typography variant="h4">{badge.icon}</Typography>
                                            <Typography variant="caption" fontWeight="bold" display="block">
                                                {badge.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                {badge.description}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
            {/* Avatar Editor Modal */}
            <Dialog open={avatarDialog} onClose={() => setAvatarDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>選擇您的大頭貼</DialogTitle>
                <DialogContent>
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Avatar
                            src={tempAvatarUrl}
                            sx={{
                                width: 150,
                                height: 150,
                                mx: 'auto',
                                mb: 4,
                                bgcolor: 'grey.200',
                            }}
                        />
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={generateRandomAvatar}
                            fullWidth
                            sx={{ mb: 2, borderRadius: 3 }}
                        >
                            🎲 隨機產生器 (DiceBear)
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                            點擊按鈕來隨機產生專屬於你的虛擬化身。
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setAvatarDialog(false)} color="inherit">
                        取消
                    </Button>
                    <Button onClick={handleSaveAvatar} variant="contained" disabled={saving}>
                        {saving ? <CircularProgress size={24} /> : '儲存頭像'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
