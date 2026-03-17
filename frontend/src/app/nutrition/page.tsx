'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Container,
    Typography,
    Paper,
    Stack,
    Chip,
    Button,
    Box,
    Card,
    CardContent,
    Grid,
    ThemeProvider,
    CssBaseline,
    Tabs,
    Tab,
} from '@mui/material';
import { createAppTheme } from '@/theme/theme';
import {
    ArrowBack,
    SportsBasketball,
    DirectionsRun,
    SportsTennis,
    FitnessCenter,
    SportsVolleyball,
    LocalDining,
    WaterDrop,
    Timer,
    FoodBank,
} from '@mui/icons-material';

interface NutritionInfo {
    name: string;
    icon: React.ReactNode;
    color: string;
    intensity: '低' | '中' | '高';
    caloriesBurned: string;
    timing: string;
    hydration: string;
    preMeal: { food: string; reason: string }[];
    postMeal: { food: string; reason: string }[];
    snacks: string[];
    avoid: string[];
}

const NUTRITION_DATA: Record<string, NutritionInfo> = {
    BASKETBALL: {
        name: '籃球',
        icon: <SportsBasketball sx={{ fontSize: 48 }} />,
        color: '#FF6B35',
        intensity: '高',
        caloriesBurned: '400~600 大卡/小時',
        timing: '運動後 30 分鐘內補充最佳（黃金恢復期）',
        hydration: '每 15-20 分鐘補充 150-250ml 水分，運動後飲用含電解質飲料',
        preMeal: [
            { food: '🍌 香蕉 1-2 根', reason: '快速補充能量，含鉀預防抽筋' },
            { food: '🍞 全麥吐司 + 花生醬', reason: '複合碳水化合物提供持久能量' },
            { food: '🥣 燕麥粥', reason: '慢釋放碳水，維持血糖穩定' },
        ],
        postMeal: [
            { food: '🍗 雞胸肉 + 糙米飯', reason: '高蛋白修復肌肉 + 碳水補充糖原' },
            { food: '🥚 水煮蛋 2-3 顆 + 地瓜', reason: '完整蛋白質 + 優質碳水化合物' },
            { food: '🥛 巧克力牛奶', reason: '碳水蛋白比 3:1，研究證實最佳恢復飲品' },
            { food: '🐟 鮭魚便當', reason: 'Omega-3 幫助消炎，加速恢復' },
        ],
        snacks: ['堅果一把 (約 30g)', '希臘優格 + 莓果', '能量棒 (低糖款)'],
        avoid: ['高油炸物（延緩消化）', '碳酸飲料（造成脹氣）', '過量咖啡因（影響恢復）'],
    },
    RUNNING: {
        name: '跑步',
        icon: <DirectionsRun sx={{ fontSize: 48 }} />,
        color: '#4CAF50',
        intensity: '中',
        caloriesBurned: '300~500 大卡/小時',
        timing: '跑後 20-30 分鐘內補充碳水和蛋白質',
        hydration: '跑前 2 小時喝 500ml，跑中每 20 分鐘補充 200ml，跑後根據體重流失量補充',
        preMeal: [
            { food: '🍌 香蕉', reason: '跑者最佳夥伴，易消化且補鉀' },
            { food: '🍯 蜂蜜吐司', reason: '快速能量來源，不造成胃部負擔' },
            { food: '🫐 莓果 + 優格', reason: '抗氧化 + 適量蛋白質' },
        ],
        postMeal: [
            { food: '🥗 雞肉沙拉 + 全麥麵包', reason: '清爽不膩，蛋白質碳水兼備' },
            { food: '🍜 清湯麵 + 蛋 + 青菜', reason: '補充水分 + 營養均衡' },
            { food: '🥛 豆漿 + 饅頭', reason: '植物蛋白 + 碳水，適合素食者' },
            { food: '🍠 地瓜 + 茶葉蛋', reason: '方便取得的恢復餐組合' },
        ],
        snacks: ['運動果凍', '鹽味蘇打餅', '椰子水'],
        avoid: ['高纖食物（容易脹氣）', '辣的食物', '牛奶（跑前避免，有些人會腸胃不適）'],
    },
    BADMINTON: {
        name: '羽球',
        icon: <SportsTennis sx={{ fontSize: 48 }} />,
        color: '#2196F3',
        intensity: '高',
        caloriesBurned: '350~550 大卡/小時',
        timing: '打完球後 30 分鐘內進食效果最佳',
        hydration: '每局休息時補充水分，建議加入少量鹽巴或電解質粉',
        preMeal: [
            { food: '🍞 三明治 (火腿 + 起司)', reason: '碳水蛋白質均衡，容易消化' },
            { food: '🍌 香蕉 + 堅果', reason: '即時能量 + 健康脂肪' },
            { food: '🥤 運動飲料', reason: '快速補充電解質和糖分' },
        ],
        postMeal: [
            { food: '🍱 控肉便當 (少油)', reason: '熱量充足，適合高強度後補充' },
            { food: '🥩 牛肉麵', reason: '鐵質 + 蛋白質，適合大量出汗後' },
            { food: '🍗 滷雞腿 + 白飯 + 燙青菜', reason: '經典恢復餐，營養均衡' },
            { food: '🥚 蛋餅 + 豆漿', reason: '方便早餐款，適合晨練後' },
        ],
        snacks: ['茶葉蛋', '小包堅果', '香蕉'],
        avoid: ['太甜的飲料', '冰品（肌肉收縮時避免）', '重口味零食'],
    },
    TABLE_TENNIS: {
        name: '桌球',
        icon: <SportsTennis sx={{ fontSize: 48 }} />,
        color: '#FF9800',
        intensity: '低',
        caloriesBurned: '200~350 大卡/小時',
        timing: '運動後 30-60 分鐘內正常進食即可',
        hydration: '適量補水即可，不需要特別補充電解質',
        preMeal: [
            { food: '🍎 蘋果 1 顆', reason: '適量糖分，提升專注力' },
            { food: '🥜 堅果 + 葡萄乾', reason: '穩定血糖，維持注意力' },
            { food: '🫖 綠茶', reason: '咖啡因適量提神，不影響手穩定性' },
        ],
        postMeal: [
            { food: '🍜 乾拌麵 + 荷包蛋', reason: '簡單好吃，碳水蛋白具備' },
            { food: '🥗 輕食沙拉', reason: '低強度運動後不需太重的餐點' },
            { food: '🍙 飯糰 + 味噌湯', reason: '常見便利商店組合，方便快速' },
            { food: '🥪 潛艇堡', reason: '均衡又方便，隨處可買' },
        ],
        snacks: ['黑巧克力 (70%以上)', '水果切盤', '優酪乳'],
        avoid: ['過量咖啡因（手抖影響控球）', '太飽（影響反應速度）'],
    },
    GYM: {
        name: '健身',
        icon: <FitnessCenter sx={{ fontSize: 48 }} />,
        color: '#9C27B0',
        intensity: '高',
        caloriesBurned: '300~600 大卡/小時',
        timing: '重訓後 30 分鐘內是蛋白質吸收黃金期',
        hydration: '訓練中每組間隔小口補水，訓練後建議攝取體重(kg) × 30ml 的水',
        preMeal: [
            { food: '🍌 香蕉 + 乳清蛋白', reason: '碳水啟動胰島素 + 蛋白質備戰' },
            { food: '🍞 全麥吐司 + 水煮蛋', reason: '慢釋放碳水 + 完整蛋白質' },
            { food: '🥣 燕麥 + 牛奶 + 堅果', reason: '持久能量，適合增肌期' },
        ],
        postMeal: [
            { food: '🥛 乳清蛋白奶昔 + 香蕉', reason: '最快速的蛋白質補充方式' },
            { food: '🍗 雞胸肉 200g + 糙米 1 碗', reason: '經典增肌餐，高蛋白低脂' },
            { food: '🥚 蛋白 5 顆 + 全蛋 1 顆 + 地瓜', reason: '精算蛋白質攝取的進階組合' },
            { food: '🐟 鮪魚罐頭 + 全麥吐司 + 酪梨', reason: '健康脂肪 + 蛋白質 + 碳水三合一' },
        ],
        snacks: ['蛋白棒', '希臘優格 (高蛋白)', '毛豆', '雞胸肉片'],
        avoid: ['高糖飲料（抵消訓練效果）', '酒精（抑制蛋白質合成）', '過量脂肪（延緩吸收）'],
    },
    VOLLEYBALL: {
        name: '排球',
        icon: <SportsVolleyball sx={{ fontSize: 48 }} />,
        color: '#E91E63',
        intensity: '中',
        caloriesBurned: '300~500 大卡/小時',
        timing: '打完球後 30 分鐘內補充效果最佳',
        hydration: '場間休息補充水分 + 電解質，大量流汗時加鹽',
        preMeal: [
            { food: '🍞 果醬吐司', reason: '簡單碳水，打球前 1 小時吃' },
            { food: '🍌 水果 + yogurt', reason: '抗氧化 + 蛋白質' },
            { food: '🥤 能量飲', reason: '比賽前快速提神' },
        ],
        postMeal: [
            { food: '🍱 排骨便當', reason: '熱量足夠，蛋白質碳水一次到位' },
            { food: '🍜 餛飩湯 + 滷蛋', reason: '溫暖的湯品幫助恢復' },
            { food: '🥩 牛排 + 馬鈴薯泥', reason: '鐵質 + 蛋白質 + 碳水大補給' },
            { food: '🍛 咖哩雞肉飯', reason: '薑黃有消炎效果，加速恢復' },
        ],
        snacks: ['御飯糰', '香蕉', '牛奶'],
        avoid: ['冰水（運動後避免大量冰水）', '過鹹食物', '含氣飲料'],
    },
};

const SPORT_TYPES = Object.keys(NUTRITION_DATA);

const darkTheme = createAppTheme('dark');

export default function NutritionPage() {
    const [selectedSport, setSelectedSport] = useState('BASKETBALL');
    const info = NUTRITION_DATA[selectedSport];

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
                <Container maxWidth="md" sx={{ py: 4, pb: 8 }}>
                    {/* Header */}
                    <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                        <Button
                            component={Link}
                            href="/"
                            startIcon={<ArrowBack />}
                            sx={{ color: 'text.secondary' }}
                        >
                            返回
                        </Button>
                    </Stack>

                    <Paper
                        sx={{
                            p: 4,
                            mb: 4,
                            borderRadius: 4,
                            background: `linear-gradient(135deg, ${info.color}22 0%, ${info.color}11 100%)`,
                            border: `1px solid ${info.color}33`,
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={3} mb={2}>
                            <Box sx={{ color: info.color }}>{info.icon}</Box>
                            <Box>
                                <Typography variant="h4" fontWeight="bold">
                                    🍽️ 運動後飲食指南
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    依運動類型，提供科學的營養補給建議
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>

                    {/* Sport Selector */}
                    <Box sx={{ mb: 4 }}>
                        <Tabs
                            value={selectedSport}
                            onChange={(_, v) => setSelectedSport(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTab-root': {
                                    minWidth: 'auto',
                                    px: 2,
                                    py: 1.5,
                                    borderRadius: 3,
                                    mx: 0.5,
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                },
                                '& .Mui-selected': {
                                    bgcolor: `${info.color}22`,
                                },
                            }}
                        >
                            {SPORT_TYPES.map((key) => (
                                <Tab
                                    key={key}
                                    value={key}
                                    label={NUTRITION_DATA[key].name}
                                    icon={<Box sx={{ fontSize: 24 }}>{NUTRITION_DATA[key].icon}</Box>}
                                    iconPosition="start"
                                />
                            ))}
                        </Tabs>
                    </Box>

                    {/* Info Cards */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Card sx={{ borderRadius: 3, textAlign: 'center' }}>
                                <CardContent>
                                    <Typography variant="caption" color="text.secondary">運動強度</Typography>
                                    <Typography variant="h6" fontWeight="bold" color={
                                        info.intensity === '高' ? 'error.main' :
                                        info.intensity === '中' ? 'warning.main' : 'success.main'
                                    }>
                                        {info.intensity}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Card sx={{ borderRadius: 3, textAlign: 'center' }}>
                                <CardContent>
                                    <Typography variant="caption" color="text.secondary">熱量消耗</Typography>
                                    <Typography variant="body2" fontWeight="bold">{info.caloriesBurned}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Card sx={{ borderRadius: 3 }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WaterDrop color="info" />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">補水建議</Typography>
                                        <Typography variant="body2">{info.hydration}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Timing */}
                    <Card sx={{ mb: 3, borderRadius: 3, borderLeft: `4px solid ${info.color}` }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Timer sx={{ color: info.color, fontSize: 32 }} />
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">最佳進食時機</Typography>
                                <Typography variant="body1" fontWeight="bold">{info.timing}</Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Pre-workout Meal */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                            <FoodBank sx={{ color: info.color }} />
                            <Typography variant="h6" fontWeight="bold">🏃 運動前吃什麼</Typography>
                        </Stack>
                        <Stack spacing={2}>
                            {info.preMeal.map((item, i) => (
                                <Card key={i} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="subtitle1" fontWeight="bold">{item.food}</Typography>
                                        <Typography variant="body2" color="text.secondary">{item.reason}</Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    </Paper>

                    {/* Post-workout Meal */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${info.color}44` }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                            <LocalDining sx={{ color: info.color }} />
                            <Typography variant="h6" fontWeight="bold">💪 運動後吃什麼（重點！）</Typography>
                        </Stack>
                        <Stack spacing={2}>
                            {info.postMeal.map((item, i) => (
                                <Card key={i} sx={{
                                    borderRadius: 2,
                                    background: `${info.color}0a`,
                                    border: `1px solid ${info.color}22`,
                                }}>
                                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="subtitle1" fontWeight="bold">{item.food}</Typography>
                                        <Typography variant="body2" color="text.secondary">{item.reason}</Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    </Paper>

                    {/* Snacks + Avoid */}
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                                <Typography variant="h6" fontWeight="bold" mb={2}>✅ 推薦小零食</Typography>
                                <Stack spacing={1}>
                                    {info.snacks.map((s, i) => (
                                        <Chip key={i} label={s} variant="outlined" color="success" sx={{ justifyContent: 'flex-start' }} />
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                                <Typography variant="h6" fontWeight="bold" mb={2}>❌ 應避免的食物</Typography>
                                <Stack spacing={1}>
                                    {info.avoid.map((a, i) => (
                                        <Chip key={i} label={a} variant="outlined" color="error" sx={{ justifyContent: 'flex-start' }} />
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* General Tips */}
                    <Paper sx={{ p: 3, mt: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)' }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>📚 通用飲食原則</Typography>
                        <Stack spacing={1.5}>
                            {[
                                '碳水化合物與蛋白質比例建議 3:1（耐力運動）或 2:1（重訓）',
                                '運動後避免空腹超過 2 小時，否則肌肉會分解供能',
                                '水分補充不只是喝水，電解質（鈉、鉀、鎂）同樣重要',
                                '盡量選擇原型食物，減少加工食品攝取',
                                '如果目標是增肌，每公斤體重建議攝取 1.6-2.2g 蛋白質',
                                '運動前 2 小時內避免高脂肪食物，以免消化不良',
                            ].map((tip, i) => (
                                <Typography key={i} variant="body2" color="text.secondary" sx={{ pl: 2, borderLeft: `2px solid ${info.color}44` }}>
                                    {tip}
                                </Typography>
                            ))}
                        </Stack>
                    </Paper>

                </Container>
            </Box>
        </ThemeProvider>
    );
}
