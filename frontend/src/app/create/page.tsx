'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { SportType, SkillLevel } from '@/types';
import {
    Box,
    Container,
    Typography,
    Button,
    TextField,
    MenuItem,
    Paper,
    Grid,
    Stack,
    Card,
    CardContent,
    InputAdornment,
    Alert,
    CircularProgress,
    ToggleButton,
    ToggleButtonGroup,
    Autocomplete,
    Chip
} from '@mui/material';
import {
    ArrowBack,
    Schedule,
    Place,
    Group,
    SportsBasketball,
    DirectionsRun,
    SportsTennis,
    FitnessCenter,
    SportsVolleyball,
    NightsStay,
    Restaurant
} from '@mui/icons-material';
import SafetyNoticeDialog from '../components/SafetyNoticeDialog';
import { LEVEL_OPTIONS } from '@/lib/constants';

const SPORT_OPTIONS = [
    { value: 'BASKETBALL', label: '籃球', icon: <SportsBasketball /> },
    { value: 'RUNNING', label: '跑步', icon: <DirectionsRun /> },
    { value: 'BADMINTON', label: '羽球', icon: <SportsTennis /> },
    { value: 'TABLE_TENNIS', label: '桌球', icon: <SportsTennis /> },
    { value: 'GYM', label: '健身', icon: <FitnessCenter /> },
    { value: 'VOLLEYBALL', label: '排球', icon: <SportsVolleyball /> },
    { value: 'TENNIS', label: '網球', icon: <SportsTennis /> },
    { value: 'NIGHT_WALK', label: '晚風漫遊', icon: <NightsStay /> },
    { value: 'DINING', label: '飯飯之交', icon: <Restaurant /> },
];

// 根據運動類型取得對應的標籤
const getTagsForSport = (sportType: string): string[] => {
    const sportTagMap: Record<string, string[]> = {
        BASKETBALL: ['女性友善', '男性友善', '性別友善', '新手友善', '輕鬆打', '激烈競爭'],
        RUNNING: ['女性友善', '性別友善', '新手友善', '輕鬆跑', '競速挑戰'],
        BADMINTON: ['女性友善', '男性友善', '性別友善', '新手友善', '輕鬆打', '激烈競爭'],
        TABLE_TENNIS: ['女性友善', '男性友善', '性別友善', '新手友善', '輕鬆打', '激烈競爭'],
        GYM: ['女性友善', '男性友善', '性別友善', '新手友善', '輕量訓練', '高強度訓練'],
        VOLLEYBALL: ['女性友善', '男性友善', '性別友善', '新手友善', '球風溫和', '激烈對抗'],
        TENNIS: ['女性友善', '男性友善', '性別友善', '新手友善', '輕鬆打', '激烈競爭'],
        NIGHT_WALK: ['純散步不聊天', '邊走邊聊', '看星星', '運動後散步', '安靜放空'],
        DINING: ['純吃飯不聊天', '邊吃邊聊', '想交朋友', '找飯友', 'AA制'],
    };
    return sportTagMap[sportType] || ['女性友善', '性別友善', '新手友善'];
};

const TAG_OPTIONS = [
    '女性友善',
    '男性友善',
    '性別友善',
    '新手友善',
    '輕鬆打',
    '休閒流汗',
];

export default function CreateGroupPage() {
    const router = useRouter();
    const { user, getToken, signIn } = useAuth();

    const [form, setForm] = useState({
        sportType: 'BASKETBALL',
        title: '',
        description: '',
        time: '',
        location: '',
        level: 'ANY',
        capacity: 4,
        tags: [] as string[],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSafetyNotice, setShowSafetyNotice] = useState(false);
    const [quota, setQuota] = useState<{ limit: number, remaining: number } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchQuota = async () => {
            if (!user) return;
            const token = await getToken();
            const res = await api.getGroupQuota(token!);
            if (res.success && res.data) {
                setQuota(res.data);
            }
        };
        fetchQuota();
    }, [user, getToken]);

    const outOfQuota = quota ? quota.remaining <= 0 : false;

    // 驗證函數
    const validateTitle = (title: string): string => {
        if (!title.trim()) return '揪團標題為必填';
        if (title.length > 50) return '標題不超過 50 字';
        return '';
    };

    const validateTime = (time: string): string => {
        if (!time) return '時間為必填';
        if (new Date(time) <= new Date()) return '請選擇未來時間';
        return '';
    };

    const validateLocation = (location: string): string => {
        if (!location.trim()) return '位置為必填';
        return '';
    };

    const validateCapacity = (capacity: number): string => {
        if (capacity < 2) return '人數至少 2 人';
        if (capacity > 50) return '人數最多 50 人';
        return '';
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        newErrors.title = validateTitle(form.title);
        newErrors.time = validateTime(form.time);
        newErrors.location = validateLocation(form.location);
        newErrors.capacity = validateCapacity(form.capacity);
        
        setErrors(newErrors);
        return !Object.values(newErrors).some(e => e);
    };

    const handleTitleChange = (val: string) => {
        setForm({ ...form, title: val });
        if (errors.title) setErrors({ ...errors, title: validateTitle(val) });
    };

    const handleTimeChange = (val: string) => {
        setForm({ ...form, time: val });
        if (errors.time) setErrors({ ...errors, time: validateTime(val) });
    };

    const handleLocationChange = (val: string) => {
        setForm({ ...form, location: val });
        if (errors.location) setErrors({ ...errors, location: validateLocation(val) });
    };

    const handleCapacityChange = (val: number) => {
        setForm({ ...form, capacity: val });
        if (errors.capacity) setErrors({ ...errors, capacity: validateCapacity(val) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError('請先登入');
            return;
        }

        if (!validateForm()) {
            setError('請修正表單錯誤');
            return;
        }

        // 彈出安全須知
        setShowSafetyNotice(true);
    };

    const confirmCreate = async () => {
        setShowSafetyNotice(false);
        setLoading(true);
        setError(null);

        const token = await getToken();
        const isoTime = form.time ? new Date(form.time).toISOString() : '';

        const response = await api.createGroup(token!, {
            ...form,
            time: isoTime,
        });

        if (response.success && response.data) {
            router.push(`/groups/${(response.data as { id: string }).id}`);
        } else {
            setError(response.error?.message || '建立失敗');
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Container maxWidth="sm" sx={{ py: 15, textAlign: 'center' }}>
                <Typography variant="h2" mb={2}>🔐</Typography>
                <Typography variant="h5" fontWeight="bold" gutterBottom>請先登入</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    需要登入才能發起揪團
                </Typography>
                <Button variant="contained" size="large" onClick={signIn}>
                    使用學生帳號登入
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4, pb: 10 }}>
            <Link href="/groups" style={{ textDecoration: 'none' }}>
                <Button
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2, color: 'text.secondary' }}
                    aria-label="返回揪團列表"
                >
                    返回列表
                </Button>
            </Link>

            <Typography variant="h4" fontWeight="bold" mb={4}>✨ 發起揪團</Typography>

            {quota && (
                <Alert
                    severity={outOfQuota ? "error" : "info"}
                    sx={{ mb: 4, borderRadius: 3 }}
                >
                    <Typography variant="subtitle2" fontWeight="bold">
                        本週揪團額度：剩下 {quota.remaining} / {quota.limit} 次
                    </Typography>
                    <Typography variant="caption">
                        (基礎 4 次。每參與或發起 2 次揪團 +1 次；連續簽名 2 天 +1 次)
                    </Typography>
                </Alert>
            )}

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            {/* Sport Type */}
                            <Paper sx={{ p: 4, borderRadius: 4 }}>
                                <Typography variant="h6" gutterBottom mb={2}>運動類型</Typography>
                                <ToggleButtonGroup
                                    value={form.sportType}
                                    exclusive
                                    onChange={(_, newVal) => newVal && setForm({ ...form, sportType: newVal, tags: [] })}
                                    aria-label="選擇運動類型"
                                    fullWidth
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        '& .MuiToggleButton-root': {
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: '12px',
                                            flex: '1 0 30%',
                                            py: 2
                                        },
                                        '& .Mui-selected': {
                                            bgcolor: 'primary.main',
                                            color: 'primary.contrastText'
                                        }
                                    }}
                                >
                                    {SPORT_OPTIONS.map((sport) => (
                                        <ToggleButton key={sport.value} value={sport.value}>
                                            <Stack alignItems="center" spacing={1}>
                                                {sport.icon}
                                                <Typography variant="caption">{sport.label}</Typography>
                                            </Stack>
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            </Paper>

                            {/* Details */}
                            <Paper sx={{ p: 4, borderRadius: 4 }}>
                                <Stack spacing={3}>
                                    <TextField
                                        label="揪團標題 *"
                                        required
                                        fullWidth
                                        value={form.title}
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        onBlur={() => setErrors({ ...errors, title: validateTitle(form.title) })}
                                        placeholder="例如：週五晚上來打球！"
                                        variant="outlined"
                                        error={!!errors.title}
                                        helperText={errors.title || '50 字以內'}
                                        aria-describedby="title-helper"
                                    />
                                    <TextField
                                        label="說明 (選填)"
                                        multiline
                                        rows={4}
                                        fullWidth
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="提供更多資訊，例如：自備球拍、只能打半場..."
                                    />
                                    <Autocomplete
                                        multiple
                                        options={getTagsForSport(form.sportType)}
                                        value={form.tags}
                                        onChange={(_, newValue) => setForm({ ...form, tags: newValue })}
                                        renderTags={(value: readonly string[], getTagProps) =>
                                            value.map((option: string, index: number) => {
                                                const { key, ...tagProps } = getTagProps({ index });
                                                return (
                                                    <Chip
                                                        variant="filled"
                                                        color="primary"
                                                        size="small"
                                                        key={key}
                                                        label={option}
                                                        {...tagProps}
                                                    />
                                                );
                                            })
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                label="友善標籤 (可選多個)"
                                                placeholder="加入標籤讓球友更安心"
                                            />
                                        )}
                                    />
                                </Stack>
                            </Paper>

                            {/* Time & Location */}
                            <Paper sx={{ p: 4, borderRadius: 4 }}>
                                <Stack spacing={3}>
                                    <TextField
                                        label="時間 *"
                                        type="datetime-local"
                                        required
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        value={form.time}
                                        onChange={(e) => handleTimeChange(e.target.value)}
                                        onBlur={() => setErrors({ ...errors, time: validateTime(form.time) })}
                                        error={!!errors.time}
                                        helperText={errors.time}
                                        aria-describedby="time-helper"
                                    />
                                    <Autocomplete
                                        freeSolo={true}
                                        options={[
                                            '暨大體育館',
                                            '暨大操場',
                                            '暨大籃球場',
                                            '暨大排球場',
                                            '暨大網球場',
                                            '暨大羽球場',
                                            '暨大健身房',
                                            '暨大學生餐廳',
                                            '暨大圖書館',
                                            '暨大行政大樓前廣場',
                                            '暨大游泳池',
                                            '暨大學生活動中心',
                                            '暨大男宿舍',
                                            '暨大女宿舍',
                                            '暨大男研究生宿舍',
                                            '暨大女研究生宿舍',
                                            '暨大綜合大樓',
                                            '暨大大草原',
                                            '人文學院',
                                            '管理學院',
                                            '科技學院一館',
                                            '科技學院二館',
                                            '教育學院',
                                        ]}
                                        value={form.location}
                                        onInputChange={(_event, newVal) => handleLocationChange(newVal)}
                                        onBlur={() => setErrors({ ...errors, location: validateLocation(form.location) })}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="位置 *"
                                                required
                                                placeholder="例如：暨大體育館、操場"
                                                error={!!errors.location}
                                                helperText={errors.location}
                                                aria-describedby="location-helper"
                                                InputProps={{
                                                    ...params.InputProps,
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Place color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        )}
                                    />
                                    <Alert severity="info" sx={{ borderRadius: 2 }} icon={<Place sx={{ mr: 1 }} />}>
                                        <Typography variant="caption">
                                            揪團地點僅限於暨大校內，平台不負責校外活動
                                        </Typography>
                                    </Alert>
                                </Stack>
                            </Paper>

                            {/* Requirements */}
                            <Paper sx={{ p: 4, borderRadius: 4 }}>
                                <Stack spacing={3}>
                                    <TextField
                                        select
                                        label="程度要求"
                                        fullWidth
                                        value={form.level}
                                        onChange={(e) => setForm({ ...form, level: e.target.value })}
                                    >
                                        {LEVEL_OPTIONS.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="bold" mb={2}>
                                            快速選擇人數
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            {[2, 4, 6, 8, 10, 20].map((num) => (
                                                <Button
                                                    key={num}
                                                    variant={form.capacity === num ? 'contained' : 'outlined'}
                                                    size="small"
                                                    onClick={() => handleCapacityChange(num)}
                                                    sx={{ minWidth: 60 }}
                                                >
                                                    {num} 人
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Box>

                                    <Typography variant="overline" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                                        自訂人數上限 (含自己)
                                    </Typography>
                                    <TextField
                                        label="人數上限 *"
                                        type="number"
                                        required
                                        fullWidth
                                        InputProps={{ inputProps: { min: 2, max: 50 } }}
                                        value={form.capacity}
                                        onChange={(e) => handleCapacityChange(parseInt(e.target.value) || 4)}
                                        onBlur={() => setErrors({ ...errors, capacity: validateCapacity(form.capacity) })}
                                        error={!!errors.capacity}
                                        helperText={errors.capacity || '2-50 人'}
                                        aria-describedby="capacity-helper"
                                    />
                                </Stack>
                            </Paper>

                            {error && (
                                <Alert severity="error">{error}</Alert>
                            )}

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={loading || outOfQuota}
                                sx={{ py: 2, fontSize: '1.1rem' }}
                            >
                                {loading ? <CircularProgress size={24} /> : outOfQuota ? '額度已用盡' : '🚀 發起揪團'}
                            </Button>
                        </Stack>
                    </form>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ position: 'sticky', top: 100 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ ml: 1 }}>
                            預覽卡片
                        </Typography>
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" mb={2}>
                                    <Typography variant="caption" sx={{ bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1 }}>
                                        {SPORT_OPTIONS.find(s => s.value === form.sportType)?.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {LEVEL_OPTIONS.find(l => l.value === form.level)?.label}
                                    </Typography>
                                </Stack>

                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    {form.title || '（輸入標題）'}
                                </Typography>

                                <Stack spacing={1} sx={{ mt: 2, color: 'text.secondary' }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Schedule fontSize="small" />
                                        <Typography variant="body2">
                                            {form.time ? new Date(form.time).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '（選擇時間）'}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Place fontSize="small" />
                                        <Typography variant="body2">{form.location || '（輸入地點）'}</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Group fontSize="small" />
                                        <Typography variant="body2">1/{form.capacity} 人</Typography>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                </Grid>
            </Grid>
            <SafetyNoticeDialog
                open={showSafetyNotice}
                onConfirm={confirmCreate}
                onCancel={() => setShowSafetyNotice(false)}
            />
        </Container>
    );
}
