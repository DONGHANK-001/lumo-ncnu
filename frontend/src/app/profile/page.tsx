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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import {
    ArrowBack,
    Save,
    Logout,
    Star,
    AdminPanelSettings,
    LocalFireDepartment
} from '@mui/icons-material';
import CrownBadge from '@/app/components/CrownBadge';
import { SPORT_NAMES, SPORT_EMOJIS, LEVEL_OPTIONS, TIME_OPTIONS } from '@/lib/constants';

const SPORT_OPTIONS = Object.entries(SPORT_NAMES)
    .filter(([key]) => !['NIGHT_WALK', 'DINING', 'STUDY'].includes(key))
    .map(([value, label]) => ({ value, label: `${SPORT_EMOJIS[value] || ''} ${label}` }));

const PROFILE_GROUP_HISTORY_LIMIT = 3;
const PROFILE_LOCATION_OPTIONS = [
    '暨大體育館',
    '暨大操場',
    '暨大健身房',
    '暨大籃球場',
    '暨大排球場',
    '暨大網球場',
    '暨大羽球館',
    '暨大桌球室',
    '暨大游泳池',
    '綜合球場',
    '圖書館',
    '餐廳',
    '宿舍區',
    '管理學院',
    '人文學院',
    '科技學院',
    '教育學院',
    '校園散步路線',
] as const;
const SOCIAL_PREFERENCE_OPTIONS = [
    { value: 'LOW_KEY', label: '慢熟輕鬆型' },
    { value: 'BALANCED', label: '都可以型' },
    { value: 'OUTGOING', label: '主動聊天型' },
] as const;

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading, signIn, signOut, getToken, refreshUser } = useAuth();

    const [form, setForm] = useState({
        nickname: '',
        bio: '',
        hobbies: '',
        sports: [] as string[],
        skillLevel: 'BEGINNER',
        availableTimes: [] as string[],
        usualLocations: [] as string[],
        socialPreference: 'BALANCED' as 'LOW_KEY' | 'BALANCED' | 'OUTGOING',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [avatarDialog, setAvatarDialog] = useState(false);
    const [tempAvatarUrl] = useState('');

    const generateRandomAvatar = () => {};

    // Avatar Editor

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

    // Titles
    const [myTitles, setMyTitles] = useState<any[]>([]);
    const [activeTitleKey, setActiveTitleKey] = useState<string | null>(null);
    const [titleDialogOpen, setTitleDialogOpen] = useState(false);

    // Group History
    const [groupHistory, setGroupHistory] = useState<any[]>([]);
    const [groupHistoryTab, setGroupHistoryTab] = useState<'all' | 'hosted' | 'joined'>('all');
    const [groupHistoryLoading, setGroupHistoryLoading] = useState(false);

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
                    api.getMyTitles(token).then(res => {
                        console.log('[Titles API]', res);
                        if (res.success && res.data) {
                            setMyTitles(res.data.titles || []);
                            setActiveTitleKey(res.data.activeTitle || null);
                        }
                    });
                    api.checkBadges(token); // auto-check
                }
            });
        }
    }, [user]);

    // Fetch group history
    const fetchGroupHistory = async (tab: string) => {
        setGroupHistoryLoading(true);
        const token = await getToken();
        if (!token) { setGroupHistoryLoading(false); return; }
        const res = await api.getMyGroups(token, tab === 'all' ? undefined : tab);
        if (res.success && res.data) {
            setGroupHistory(res.data.items.slice(0, PROFILE_GROUP_HISTORY_LIMIT));
        }
        setGroupHistoryLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchGroupHistory(groupHistoryTab);
        }
    }, [user, groupHistoryTab]);

    const handleSetTitle = async (titleKey: string) => {
        const token = await getToken();
        if (!token) return;
        const res = await api.setActiveTitle(token, titleKey);
        if (res.success) {
            setActiveTitleKey(titleKey);
            setTitleDialogOpen(false);
            await refreshUser();
        }
    };

    useEffect(() => {
        if (user) {
            setForm({
                nickname: user.nickname || '',
                bio: user.preferences?.bio || '',
                hobbies: user.preferences?.hobbies || '',
                sports: user.preferences?.sports || [],
                skillLevel: user.preferences?.skillLevel || 'BEGINNER',
                availableTimes: user.preferences?.availableTimes || [],
                usualLocations: user.preferences?.usualLocations || [],
                socialPreference: user.preferences?.socialPreference || 'BALANCED',
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
                bio: form.bio.trim(),
                hobbies: form.hobbies.trim(),
                sports: form.sports,
                skillLevel: form.skillLevel,
                availableTimes: form.availableTimes,
                usualLocations: form.usualLocations,
                socialPreference: form.socialPreference,
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
                        <Box>
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
                            <Typography variant="caption" color="text.secondary" display="block">
                                目前同步 Google 原頭像，暫不開放自訂更換。
                            </Typography>
                        </Box>
                        <Stack alignItems="center" spacing={1}>
                            {user.planType === 'PLUS' && (
                                <Chip label="PLUS 會員" size="small" color="secondary" icon={<Star />} />
                            )}
                            {(() => {
                                const activeT = myTitles.find((t: any) => t.key === activeTitleKey);
                                return activeT ? (
                                    <Chip
                                        label={`${activeT.icon} ${activeT.label}`}
                                        size="small"
                                        onClick={() => setTitleDialogOpen(true)}
                                        sx={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            '&:hover': { opacity: 0.85 },
                                        }}
                                    />
                                ) : (
                                    <Chip
                                        label="🏷️ 無稱號"
                                        size="small"
                                        onClick={() => setTitleDialogOpen(true)}
                                        variant="outlined"
                                        sx={{ cursor: 'pointer', opacity: 0.7 }}
                                    />
                                );
                            })()}
                            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                                {form.nickname || '未設定暱稱'}
                                <CrownBadge isPlus={user.planType === 'PLUS'} />
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
                            <Typography variant="h6" fontWeight="bold" mb={3}>📊 我的活動數據</Typography>

                            {stats ? (
                                <Stack spacing={4}>
                                    <Stack direction="row" spacing={3} justifyContent="space-around" sx={{ textAlign: 'center' }}>
                                        <Box>
                                            <Typography variant="h4" color="primary.main" fontWeight="bold">{stats.currentStreak}</Typography>
                                            <Typography variant="body2" color="text.secondary">🔥 連續登入天數</Typography>
                                            <Typography variant="caption" color="text.secondary">最高 {stats.longestStreak} 天</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="h4" color="warning.main" fontWeight="bold">{stats.totalParticipations}</Typography>
                                            <Typography variant="body2" color="text.secondary">📌 累計參與次數</Typography>
                                            <Typography variant="caption" color="text.secondary">歷史總參加揪團次數</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="h4" color="success.main" fontWeight="bold">{stats.uniquePeopleMet}</Typography>
                                            <Typography variant="body2" color="text.secondary">🤝 認識人數</Typography>
                                            <Typography variant="caption" color="text.secondary">累計不重複夥伴數</Typography>
                                        </Box>
                                    </Stack>

                                    <Divider />

                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="subtitle2" mb={2} color="text.secondary" textAlign="center">
                                                活動類型分佈
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

                        {/* Group History Section */}
                        <Paper sx={{ p: 4, borderRadius: 4 }}>
                            <Typography variant="h6" fontWeight="bold" mb={2}>📋 揪團紀錄</Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                目前僅顯示最近 {PROFILE_GROUP_HISTORY_LIMIT} 筆紀錄，其餘保留於管理員後台。
                            </Typography>
                            <Stack direction="row" spacing={1} mb={3}>
                                {([['all', '全部'], ['hosted', '我發起的'], ['joined', '我參加的']] as const).map(([value, label]) => (
                                    <Chip
                                        key={value}
                                        label={label}
                                        clickable
                                        onClick={() => setGroupHistoryTab(value)}
                                        color={groupHistoryTab === value ? 'primary' : 'default'}
                                        variant={groupHistoryTab === value ? 'filled' : 'outlined'}
                                    />
                                ))}
                            </Stack>

                            {groupHistoryLoading && groupHistory.length === 0 ? (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : groupHistory.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                    還沒有揪團紀錄，快去參加或發起一個吧！
                                </Typography>
                            ) : (
                                <Stack spacing={1.5}>
                                    {groupHistory.map((g: any) => (
                                        <Paper
                                            key={g.id}
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                cursor: 'pointer',
                                                borderRadius: 2,
                                                transition: 'all 0.2s',
                                                '&:hover': { bgcolor: 'action.hover', transform: 'translateX(4px)' },
                                            }}
                                            onClick={() => router.push(`/groups/${g.id}`)}
                                        >
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                                        <Chip label={SPORT_NAMES[g.sportType] || g.sportType} size="small" color="primary" variant="filled" />
                                                        <Chip
                                                            label={g.status === 'OPEN' ? '進行中' : g.status === 'FULL' ? '已滿' : g.status === 'CANCELLED' ? '已取消' : '已結束'}
                                                            size="small"
                                                            color={g.status === 'OPEN' ? 'success' : g.status === 'CANCELLED' ? 'error' : 'default'}
                                                            variant="outlined"
                                                        />
                                                        {g.createdById === user?.id && (
                                                            <Chip label="發起人" size="small" color="secondary" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="subtitle2" fontWeight="bold" noWrap>
                                                        {g.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(g.time).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        {' · '}{g.location} · {g.currentCount}/{g.capacity} 人
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Paper>

                        <Paper sx={{ p: 4, borderRadius: 4 }}>
                            <Typography variant="h6" gutterBottom mb={3}>個人補充資訊</Typography>
                            <Stack spacing={3}>
                                <TextField
                                    label="個人簡介"
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    value={form.bio}
                                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                    placeholder="簡單介紹你平常喜歡的活動、出沒時段或揪團風格"
                                    inputProps={{ maxLength: 300 }}
                                    helperText={`${form.bio.length}/300`}
                                />
                                <TextField
                                    label="嗜好"
                                    fullWidth
                                    value={form.hobbies}
                                    onChange={(e) => setForm({ ...form, hobbies: e.target.value })}
                                    placeholder="例如：羽球、桌遊、夜跑、看展、拍照"
                                    inputProps={{ maxLength: 200 }}
                                    helperText={`${form.hobbies.length}/200`}
                                />
                            </Stack>
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
                                    <Typography variant="subtitle2" gutterBottom>喜好社交</Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {SOCIAL_PREFERENCE_OPTIONS.map((option) => (
                                            <Chip
                                                key={option.value}
                                                label={option.label}
                                                clickable
                                                onClick={() => setForm({ ...form, socialPreference: option.value })}
                                                color={form.socialPreference === option.value ? 'primary' : 'default'}
                                                variant={form.socialPreference === option.value ? 'filled' : 'outlined'}
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
                                        {PROFILE_LOCATION_OPTIONS.map((loc) => (
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

            {/* Title Selector Dialog */}
            <Dialog open={titleDialogOpen} onClose={() => setTitleDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>🏷️ 選擇展示稱號</DialogTitle>
                <DialogContent>
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                        {myTitles.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                                您目前尚未獲得任何稱號
                            </Typography>
                        ) : (
                            myTitles.map((t: any) => (
                                <Paper
                                    key={t.key}
                                    onClick={() => handleSetTitle(t.key)}
                                    sx={{
                                        p: 2,
                                        cursor: 'pointer',
                                        border: activeTitleKey === t.key ? '2px solid' : '1px solid',
                                        borderColor: activeTitleKey === t.key ? 'primary.main' : 'divider',
                                        borderRadius: 2,
                                        background: activeTitleKey === t.key ? 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))' : 'transparent',
                                        transition: 'all 0.2s',
                                        '&:hover': { borderColor: 'primary.main', transform: 'scale(1.02)' },
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <Typography variant="h5">{t.icon}</Typography>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold">{t.label}</Typography>
                                            <Typography variant="caption" color="text.secondary">{t.description}</Typography>
                                        </Box>
                                        {activeTitleKey === t.key && (
                                            <Chip label="使用中" size="small" color="primary" sx={{ ml: 'auto' }} />
                                        )}
                                    </Stack>
                                </Paper>
                            ))
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTitleDialogOpen(false)}>關閉</Button>
                </DialogActions>
            </Dialog>

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
