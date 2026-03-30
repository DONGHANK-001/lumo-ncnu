'use client';

import { useParams, useRouter } from 'next/navigation';
import {
    Container,
    Typography,
    Paper,
    Stack,
    Chip,
    Button,
    Box,
    Divider,
    Card,
    CardContent,
    ThemeProvider,
    CssBaseline,
} from '@mui/material';
import { createAppTheme } from '@/theme/theme';
import {
    ArrowBack,
    SportsBasketball,
    DirectionsRun,
    SportsTennis,
    FitnessCenter,
    SportsVolleyball,
    NightsStay,
    Restaurant,
    EmojiEvents,
    MenuBook,
    Lightbulb,
    LocalDining,
} from '@mui/icons-material';
import Link from 'next/link';

interface SportInfo {
    name: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    rules: string[];
    tips: string[];
    equipment: string[];
    campusSpots: string[];
    nutrition?: { food: string; reason: string }[];
}

const SPORT_DATA: Record<string, SportInfo> = {
    BASKETBALL: {
        name: '籃球',
        icon: <SportsBasketball sx={{ fontSize: 60 }} />,
        color: '#FF6B35',
        description: '籃球是一項富有對抗性和觀賞性的團隊運動，在暨大體育館和戶外球場都能進行。',
        rules: [
            '每隊 5 人上場，通常揪團半場 3v3 或全場 5v5',
            '投進對方籃框得分：三分線外 3 分、三分線內 2 分、罰球 1 分',
            '持球走超過兩步為走步違例',
            '進攻方不得在禁區停留超過 3 秒',
            '身體接觸超過合理範圍為犯規，累計 5 次犯規則被罰下場',
        ],
        tips: [
            '暖身很重要！腳踝和膝蓋是最容易受傷的部位',
            '半場 3v3 是揪團最常見的模式，進攻失球要先帶回三分線外',
            '傳球永遠比單打有效率，多跑位找空檔',
            '防守時腳步跟人，不要過度伸手搶球避免犯規',
            '穿合適的籃球鞋，避免滑倒或扭傷',
        ],
        equipment: ['籃球（室內用皮球或室外用橡膠球）', '球鞋', '毛巾和水壺'],
        campusSpots: ['暨大體育館（室內）', '暨大籃球場（戶外）'],
        nutrition: [
            { food: '🍗 雞胸肉 + 糙米飯', reason: '高蛋白修復肌肉 + 碳水補充糖原' },
            { food: '🥛 巧克力牛奶', reason: '碳水蛋白比 3:1，研究證實最佳恢復飲品' },
            { food: '🥚 水煮蛋 2-3 顆 + 地瓜', reason: '完整蛋白質 + 優質碳水化合物' },
            { food: '🐟 鮭魚便當', reason: 'Omega-3 幫助消炎，加速肌肉恢復' },
        ],
    },
    RUNNING: {
        name: '跑步',
        icon: <DirectionsRun sx={{ fontSize: 60 }} />,
        color: '#4CAF50',
        description: '跑步是最簡單的運動方式之一，校園內有操場跑道和環校步道可供使用。',
        rules: [
            '操場跑道請逆時針方向跑，避免碰撞',
            '外圈為慢跑道，內圈為快跑道',
            '夜間跑步請穿著反光衣物或帶手電筒',
            '遇身體不適請立即停止並尋求協助',
        ],
        tips: [
            '跑前做 5-10 分鐘動態熱身（高抬腿、弓步走等）',
            '初學者建議從間歇跑開始，跑 3 分鐘走 1 分鐘',
            '呼吸節奏建議兩步一吸、兩步一呼',
            '避免跑步後立即停下，慢走 5 分鐘讓心率緩和',
            '環校步道風景優美，適合輕鬆慢跑',
        ],
        equipment: ['跑鞋（最重要！）', '排汗衣物', '水壺', '運動手錶（選配）'],
        campusSpots: ['操場', '健身房', '校園內'],
        nutrition: [
            { food: '🥗 雞肉沙拉 + 全麥麵包', reason: '清爽不膩，蛋白質碳水兼備' },
            { food: '🍜 清湯麵 + 蛋 + 青菜', reason: '補充水分和電解質 + 營養均衡' },
            { food: '🍠 地瓜 + 茶葉蛋', reason: '方便取得的恢復餐，碳水蛋白兼顧' },
            { food: '🥛 豆漿 + 饅頭', reason: '植物蛋白 + 碳水，素食者首選' },
        ],
    },
    BADMINTON: {
        name: '羽球',
        icon: <SportsTennis sx={{ fontSize: 60 }} />,
        color: '#2196F3',
        description: '羽球是臺灣最受歡迎的運動之一，暨大體育館設有室內球場。',
        rules: [
            '單打或雙打，每局 21 分制',
            '發球時球拍必須低於腰部',
            '球觸地或出界即失分',
            '每球得分制（rally scoring），每球都計分',
            '先贏兩局者獲勝，二局比分為 1:1 時進行第三局',
        ],
        tips: [
            '新手先練好正手高遠球，這是最基礎的進攻技術',
            '步伐比手法更重要！先學會基本米字步',
            '擊球時手腕要放鬆，利用甩腕產生力量',
            '雙打時前後站位比左右站位更有效率',
            '記得攜帶備用羽毛球，戶外球容易損壞',
        ],
        equipment: ['羽球拍', '羽毛球（建議準備多顆）', '運動鞋（止滑底）', '護腕（選配）'],
        campusSpots: ['暨大體育館(室內場)'],
        nutrition: [
            { food: '🍱 滷雞腿 + 白飯 + 燙青菜', reason: '經典恢復餐，蛋白質碳水一次到位' },
            { food: '🥩 牛肉麵', reason: '鐵質 + 蛋白質，適合大量出汗後補充' },
            { food: '🥚 蛋餅 + 豆漿', reason: '方便早餐款，適合晨練後快速恢復' },
            { food: '🍌 香蕉 + 堅果一把', reason: '補鉀防抽筋 + 健康脂肪修復細胞' },
        ],
    },
    TABLE_TENNIS: {
        name: '桌球',
        icon: <SportsTennis sx={{ fontSize: 60 }} />,
        color: '#FF9800',
        description: '桌球場地小、上手快，是課餘休閒的熱門選擇。',
        rules: [
            '每局 11 分制，先贏者拿下該局',
            '每人輪流發球兩次',
            '發球時球要先在己方桌面彈一次，再彈對方桌面',
            '球打到網上再過去（擦網）需重新發球',
            '比賽通常為五局三勝或七局四勝',
        ],
        tips: [
            '握拍不要太緊，放鬆手腕才能產生旋轉',
            '注意對方拍面角度，判斷來球旋轉方向',
            '發球要有變化，長短球交替使用',
            '拉球時重心放低，用腰帶手不是只用手臂',
            '多練搓球和防守，初學者最實用',
        ],
        equipment: ['桌球拍（自備品質較好）', '桌球（三星球較耐打）'],
        campusSpots: ['暨大體育館(室內場)'],
        nutrition: [
            { food: '🍜 乾拌麵 + 荷包蛋', reason: '簡單好吃，低強度運動後剛剛好' },
            { food: '🍙 飯糰 + 味噌湯', reason: '便利商店組合，方便又快速' },
            { food: '🥗 輕食沙拉', reason: '低強度運動後不需要太重的餐點' },
            { food: '🍎 水果 + 優格', reason: '抗氧化 + 腸道健康，維持專注力' },
        ],
    },
    GYM: {
        name: '健身',
        icon: <FitnessCenter sx={{ fontSize: 60 }} />,
        color: '#9C27B0',
        description: '健身可以提升體能和體態，校內健身房提供基本器材供學生使用。',
        rules: [
            '使用器材前請先了解正確操作方式',
            '重量訓練請找伙伴互相看護（spotter）',
            '使用完畢請歸位器材並擦拭汗漬',
            '請勿佔用器材休息或滑手機',
        ],
        tips: [
            '初學者從複合動作開始：深蹲、硬舉、臥推、划船',
            '熱身很重要，先用空槓或輕重量暖身',
            '動作品質永遠比重量重要，寧輕勿重',
            '訓練後要補充蛋白質和碳水化合物',
            '一週訓練 3-4 次，肌肉需要休息才會成長',
            '揪伴一起練更安全也更有動力！',
        ],
        equipment: ['運動鞋', '毛巾', '水壺', '護腕/護膝（選配）'],
        campusSpots: ['暨大健身房'],
        nutrition: [
            { food: '🥛 乳清蛋白奶昔 + 香蕉', reason: '最快速的蛋白質補充，重訓後黃金 30 分鐘' },
            { food: '🍗 雞胸肉 200g + 糙米 1 碗', reason: '經典增肌餐，高蛋白低脂肪' },
            { food: '🐟 鮪魚罐頭 + 全麥吐司 + 酪梨', reason: '健康脂肪 + 蛋白質 + 碳水三合一' },
            { food: '🥚 蛋白 5 顆 + 全蛋 1 顆 + 地瓜', reason: '精算蛋白質的進階增肌組合' },
        ],
    },
    VOLLEYBALL: {
        name: '排球',
        icon: <SportsVolleyball sx={{ fontSize: 60 }} />,
        color: '#E91E63',
        description: '排球是一項講求團隊默契的運動，校內排球場是練習的好去處。',
        rules: [
            '每隊 6 人上場，三排輪轉',
            '每隊最多觸球三次就要將球送過網',
            '不能連續觸球兩次（攔網除外）',
            '每局 25 分（決勝局 15 分），先贏兩分才能拿下該局',
            '發球可以站在底線後方任意位置',
        ],
        tips: [
            '接球時手臂打直、腳步到位，用平台接球',
            '托球時手指張開呈三角形，十指施力',
            '扣球時起跳要提前，手從最高點向下揮擊',
            '輪轉順序要記清楚，避免位置犯規',
            '揪團打排球建議 4v4 或 6v6',
        ],
        equipment: ['排球', '運動鞋', '護膝（建議）'],
        campusSpots: ['暨大排球場'],
        nutrition: [
            { food: '🍱 排骨便當', reason: '熱量充足，蛋白質碳水一次到位' },
            { food: '🍛 咖哩雞肉飯', reason: '薑黃有天然消炎效果，加速恢復' },
            { food: '🍜 餛飩湯 + 滷蛋', reason: '溫暖湯品幫助肌肉放鬆恢復' },
            { food: '🥩 牛排 + 馬鈴薯', reason: '鐵質 + 蛋白質 + 碳水的完整補給' },
        ],
    },
    NIGHT_WALK: {
        name: '晚風漫遊',
        icon: <NightsStay sx={{ fontSize: 60 }} />,
        color: '#7C4DFF',
        description: '校園晚風漫遊是暨大學生最療癒的活動之一，星空下走走聊聊或安靜放空都很棒。',
        rules: [
            '請結伴同行，勿單獨行動',
            '走在有照明的路段，注意安全',
            '保持手機暢通，方便緊急聯繫',
            '晚間十點後請降低音量，不打擾宿舍區休息',
        ],
        tips: [
            '暨大環校步道晚上很美，建議帶手電筒',
            '可以帶上零食飲料，找個好位置坐下看星星',
            '播放輕柔音樂可以讓散步更放鬆',
            '建議穿舒適好走的鞋子',
            '建立標籤（安靜散步/邊走邊聊）讓大家更有默契',
        ],
        equipment: ['舒適的鞋子', '手電筒或手機手電筒', '外套（晚上可能涼）'],
        campusSpots: ['環校步道', '暨大行政大樓前廣場', '暨大操場', '暨大圖書館周邊', '暨大大草原'],
    },
    TENNIS: {
        name: '網球',
        icon: <SportsTennis sx={{ fontSize: 60 }} />,
        color: '#66BB6A',
        description: '網球是一項兼具力量與策略的運動，暨大設有網球場供學生使用。',
        rules: [
            '單打或雙打，每盤 6 局制',
            '每局中率先拿到 4 分者贏得該局（計分：0、15、30、40）',
            '40:40 為 Deuce，需連贏兩分才能拿下該局',
            '先贏 6 局者拿下一盤，6:6 時進入搶七（Tie-break）',
            '揪團通常打一盤單打或一盤雙打',
        ],
        tips: [
            '握拍方式是基礎！東方式握拍適合初學者',
            '擊球時側身站位，用身體旋轉帶動力量',
            '多練習底線來回球，穩定性比力量更重要',
            '發球要拋球到正確位置，初學先求穩不求快',
            '雙打時一前一後站位，前排負責截擊',
        ],
        equipment: ['網球拍', '網球（建議準備 3-4 顆）', '運動鞋（底部耐磨款）', '護腕（選配）'],
        campusSpots: ['暨大網球場'],
        nutrition: [
            { food: '🍗 雞胸肉 + 白飯 + 青菜', reason: '蛋白質修復加碳水補充，全方位恢復' },
            { food: '🍌 香蕉 + 運動飲料', reason: '快速補鉀防抽筋 + 電解質補充' },
            { food: '🥚 蛋餅 + 豆漿', reason: '方便取得，碳水蛋白均衡' },
            { food: '🥩 牛肉麵', reason: '鐵質 + 蛋白質，適合高強度對打後補充' },
        ],
    },
    DINING: {
        name: '飯飯之交',
        icon: <Restaurant sx={{ fontSize: 60 }} />,
        color: '#F2B8B5',
        description: '找人一起吃飯！不管是學生餐廳、宿舍周邊還是各學院的小吃，有伴就更好吃。',
        rules: [
            '尊重其他人的食物習慣和速度',
            '費用各付各的（AA 制），除非事先約好',
            '準時赴約，遲到請提前通知',
            '校外用餐時的安全由個人自行負責',
        ],
        tips: [
            '建立標籤（安靜吃飯/想聊天交朋友）更容易找到志趣相投的飯友',
            '學生餐廳用餐尖峰時段是 11:30-12:30，可以提早或晚一點去',
            '有特殊食物需求（素食、不吃辣）記得在揪團說明裡寫清楚',
            '人多的話可以一起叫外送，省運費',
        ],
        equipment: ['好心情', '環保餐具（選配，愛地球）'],
        campusSpots: ['暨大學生餐廳'],
    },
    STUDY: {
        name: '讀家回憶',
        icon: <MenuBook sx={{ fontSize: 60 }} />,
        color: '#42A5F5',
        description: '在書頁間尋覓同頻之人——無論是期中備考的專注苦讀、期末衝刺的緊鑼密鼓，或是日常沉浸書海的悠然時光，有志同道合的讀伴相伴，方能走得更遠。',
        rules: [
            '保持安靜，尊重彼此的閱讀節奏',
            '手機請調靜音或勿擾模式',
            '準時出席，不隨意缺席',
            '公共空間請維持整潔',
        ],
        tips: [
            '建立標籤（安靜自習/討論型）讓大家找到適合的讀書氛圍',
            '建議設定讀書時段（如番茄鐘 25 分鐘），定時休息',
            '考試週可以建「期中/期末衝刺團」找同科系的讀伴',
            '帶上耳塞或耳機，各自安靜讀書也很棒',
            '可以約定休息時間一起討論問題，互相教學相長',
        ],
        equipment: ['課本/筆記', '筆電/平板', '耳機', '水壺'],
        campusSpots: ['暨大圖書館', '暨大圖書館自習室'],
    },
};

export default function SportGuidePage() {
    const params = useParams();
    const router = useRouter();
    const type = params.type as string;
    const sport = SPORT_DATA[type];
    const darkTheme = createAppTheme('dark');

    if (!sport) {
        return (
            <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>找不到此運動類型</Typography>
                <Button component={Link} href="/" variant="contained" sx={{ mt: 2 }}>
                    回首頁
                </Button>
            </Container>
        );
    }

    return (
        <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Container maxWidth="md" sx={{ py: 4, pb: 8 }}>
            <Button
                startIcon={<ArrowBack />}
                component={Link}
                href="/"
                sx={{ mb: 3 }}
            >
                返回首頁
            </Button>

            {/* Header */}
            <Paper
                sx={{
                    p: 4,
                    borderRadius: 4,
                    mb: 4,
                    background: `linear-gradient(135deg, ${sport.color}22 0%, ${sport.color}11 100%)`,
                    textAlign: 'center',
                }}
            >
                <Box sx={{ color: sport.color, mb: 2 }}>{sport.icon}</Box>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {sport.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {sport.description}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ mt: 2 }}>
                    {sport.campusSpots.map((spot) => (
                        <Chip key={spot} label={`📍 ${spot}`} variant="outlined" size="small" />
                    ))}
                </Stack>
            </Paper>

            <Stack spacing={3}>
                {/* Rules */}
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                            <MenuBook color="primary" />
                            <Typography variant="h5" fontWeight="bold">基本規則</Typography>
                        </Stack>
                        <Divider sx={{ mb: 2 }} />
                        <Stack spacing={1.5}>
                            {sport.rules.map((rule, i) => (
                                <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Chip
                                        label={i + 1}
                                        size="small"
                                        color="primary"
                                        sx={{ minWidth: 28, fontWeight: 'bold' }}
                                    />
                                    <Typography variant="body1">{rule}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>

                {/* Tips */}
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                            <Lightbulb color="warning" />
                            <Typography variant="h5" fontWeight="bold">實用技巧</Typography>
                        </Stack>
                        <Divider sx={{ mb: 2 }} />
                        <Stack spacing={1.5}>
                            {sport.tips.map((tip, i) => (
                                <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Typography variant="body1" sx={{ color: 'warning.main', fontWeight: 'bold', minWidth: 20 }}>💡</Typography>
                                    <Typography variant="body1">{tip}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>

                {/* Equipment */}
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                            <EmojiEvents color="secondary" />
                            <Typography variant="h5" fontWeight="bold">建議裝備</Typography>
                        </Stack>
                        <Divider sx={{ mb: 2 }} />
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {sport.equipment.map((item) => (
                                <Chip key={item} label={`🎒 ${item}`} variant="outlined" sx={{ borderRadius: 2 }} />
                            ))}
                        </Stack>
                    </CardContent>
                </Card>

                {/* Nutrition */}
                {sport.nutrition && sport.nutrition.length > 0 && (
                    <Card sx={{ borderRadius: 4, border: `1px solid ${sport.color}33` }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                                <LocalDining sx={{ color: sport.color }} />
                                <Typography variant="h5" fontWeight="bold">🍽️ 運動後飲食指南</Typography>
                            </Stack>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={2}>
                                {sport.nutrition.map((item, i) => (
                                    <Card key={i} variant="outlined" sx={{
                                        borderRadius: 2,
                                        background: `${sport.color}0a`,
                                        borderColor: `${sport.color}22`,
                                    }}>
                                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Typography variant="subtitle1" fontWeight="bold">{item.food}</Typography>
                                            <Typography variant="body2" color="text.secondary">{item.reason}</Typography>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                {/* CTA */}
                <Box sx={{ textAlign: 'center', pt: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        component={Link}
                        href={`/create?type=${type}`}
                        sx={{ borderRadius: 3, px: 6, py: 1.5, fontSize: '1.1rem' }}
                    >
                        {type === 'NIGHT_WALK' ? '立即漫步校園！' : type === 'DINING' ? '立即結識飯飯之交！' : type === 'STUDY' ? '尋找讀書夥伴！' : type === 'RUNNING' ? '立即揪團跑步！' : type === 'GYM' ? '立即揪團健身！' : type === 'TENNIS' ? '立即揪團打網球！' : `立即揪團打${sport.name}！`}
                    </Button>
                </Box>
            </Stack>
        </Container>
        </Box>
        </ThemeProvider>
    );
}
