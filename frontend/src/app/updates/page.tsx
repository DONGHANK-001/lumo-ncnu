'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Box,
    Container,
    Typography,
    Button,
    Chip,
    Card,
    CardContent,
    Stack,
    Divider,
    useTheme,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

type UpdateCategory = '全部' | '重大更新' | '新功能' | '優化' | '修復';

interface UpdateEntry {
    version: string;
    date: string;
    category: Exclude<UpdateCategory, '全部'>;
    title: string;
    details: string[];
}

const UPDATES: UpdateEntry[] = [
    {
        version: 'v1.11.2',
        date: '2026-04-06',
        category: '優化',
        title: '首頁「最新活動」排版優化 & 註冊表單美化',
        details: [
            '「最新活動」標題與描述電腦版、手機版皆置中',
            '手機版描述文字自動換行，閱讀更舒適',
            '註冊表單移除欄位星號，學號預設文字移除多餘的 S',
        ],
    },
    {
        version: 'v1.11.1',
        date: '2026-04-06',
        category: '優化',
        title: '首頁「最新活動」手機版美化',
        details: [
            '手機版標題與描述文字置中顯示',
            '空狀態區塊增加留白，視覺更舒適',
            '活動提示文字置中對齊',
        ],
    },
    {
        version: 'v1.11.0',
        date: '2026-04-06',
        category: '新功能',
        title: '📚 讀家回憶活動排行榜',
        details: [
            '4/7～4/17 排行榜僅計算「讀家回憶」揪團，為活動專屬計分',
            '4/17 中午 12:00～13:00 排行榜進入結算模式，顯示讀家回憶前三名',
            '4/17 下午 13:00 起恢復全類型排行榜計算',
            '活動期間排行榜頁面顯示專屬活動提示橫幅',
        ],
    },
    {
        version: 'v1.10.0',
        date: '2026-03-31',
        category: '重大更新',
        title: '個人檔案升級、安裝引導與版面整理',
        details: [
            '個人檔案新增個人簡介、嗜好、喜好社交與更多常去地點選項',
            '個人頭像暫時改為同步 Google 原頭像，先不開放自訂更換',
            '個人檔案揪團紀錄精簡為最近 3 筆，前台過期反灰活動保留縮短為 3 天',
            '新增「校園探索家」與「夜行動物」兩個成就勳章',
            '手機與桌機的偏好設定、成就勳章區塊改為更整齊一致的對齊版面',
            '首頁新增品牌化 PWA 安裝引導，支援加入主畫面提示',
            '首頁新增最新活動橫向滑動區，手機可手滑、桌機可左右切換瀏覽',
        ],
    },
    {
        version: 'v1.9.0',
        date: '2026-03-30',
        category: '重大更新',
        title: '信譽與檢舉系統上線',
        details: [
            '揪團頁面新增「🚩 檢舉」功能，可檢舉揪團或特定成員',
            '新增信譽分數系統（100 分制），依行為自動增減',
            '信譽過低將觸發停用懲罰（1 天 / 3 天 / 7 天 / 永久）',
            '新增 4 個信譽獎勵稱號：🛡️ 信譽見習生 → ⚔️ 鋼鐵守則 → 💎 鑽石意志 → 🌟 傳說之證',
            '管理員後台新增檢舉管理面板（確認/駁回）',
            '確認檢舉時自動扣除被檢舉者信譽分並觸發懲罰機制',
        ],
    },
    {
        version: 'v1.8.0',
        date: '2026-03-26',
        category: '重大更新',
        title: '信任與安全機制升級：公開身分可驗證',
        details: [
            '所有主要頭像入口（揪團成員、候補、留言、配對、排行榜）已支援點擊進入公開個人檔案',
            '公開個人檔案固定顯示「性別＋系級＋系所」，提升辨識度與信任感',
            '新註冊與既有使用者皆需補齊公開身分欄位，未完成將收到引導視窗',
            '後台使用者管理同步新增身分欄位查看、完整度篩選與管理員修正功能',
            '為降低濫用與風險，未完成公開身分資料的帳號將無法開團、加團或候補',
        ],
    },
    {
        version: 'v1.7.0',
        date: '2026-03-26',
        category: '重大更新',
        title: '系所選單全面更新',
        details: [
            '系所選單改為依學院分組，新增護理暨健康福祉學院、管理學院學士班等選項',
            '已登入的使用者將自動收到系所更新提醒，重新選擇正確系所',
            '排行榜頁面手機 / 平板 RWD 全面修正，不再被切掉',
            '各運動類型標註地點更新為正確校園場館名稱',
        ],
    },
    {
        version: 'v1.6.0',
        date: '2026-01-12',
        category: '新功能',
        title: '更新日誌頁面上線',
        details: [
            '新增「更新日誌」頁面，讓使用者掌握最新動態',
            '首頁新增更新日誌快捷按鈕 (📋)',
        ],
    },
    {
        version: 'v1.5.0',
        date: '2026-01-12',
        category: '優化',
        title: '配額計算重構',
        details: [
            '將配額計算邏輯統一抽取為共用模組',
            '連續揪團天數 (streak) 與每週上限計算更準確',
        ],
    },
    {
        version: 'v1.4.0',
        date: '2026-01-12',
        category: '新功能',
        title: '新增網球運動類型',
        details: [
            '新增「網球 🎾」運動類型，可在首頁、建立揪團、運動指南中選擇',
            '網球已同步至資料庫 SportType 列舉',
        ],
    },
    {
        version: 'v1.3.0',
        date: '2026-01-11',
        category: '修復',
        title: '安全性與穩定性修復',
        details: [
            '修復加入揪團的競爭條件 (Race Condition)，避免超額加入',
            '修復付款回呼的交易一致性問題',
            '修復先鋒稱號查詢的資料庫欄位錯誤',
            '修復 Firebase 登入彈窗關閉後的錯誤提示',
        ],
    },
    {
        version: 'v1.2.0',
        date: '2026-01-11',
        category: '重大更新',
        title: '黑金會員與定價調整',
        details: [
            '終身黑金卡會員享有專屬特權：無限揪團、黑金邊框、⚜️ 標章',
            '調整會員方案價格：雙週 $25 / 月繳 $49 / 季繳 $99 / 終身 $199',
            '揪團列表中 PLUS 會員顯示金色邊框與黑金標章',
        ],
    },
    {
        version: 'v1.1.0',
        date: '2026-01-10',
        category: '修復',
        title: '文字與地點修正',
        details: [
            '修正 CTA 按鈕用語（「打跑步」→「去跑步」等）',
            '修正校園地點名稱以符合暨大實際場館',
            '修正共餐 (DINING) 頁面多處錯字',
            '修正排行榜「創創先鋒」→「創始先鋒」',
        ],
    },
    {
        version: 'v1.0.0',
        date: '2026-01-05',
        category: '重大更新',
        title: 'LUMO 正式上線 🎉',
        details: [
            '支援 9 種運動類型的校園揪團',
            '即時通知與 Socket.io 即時更新',
            'PLUS 會員訂閱系統 (ECPay)',
            '安全規範與檢舉系統',
            '排行榜與先鋒稱號系統',
        ],
    },
];

const CATEGORY_COLORS: Record<Exclude<UpdateCategory, '全部'>, 'error' | 'primary' | 'info' | 'warning'> = {
    '重大更新': 'error',
    '新功能': 'primary',
    '優化': 'info',
    '修復': 'warning',
};

export default function UpdatesPage() {
    const [filter, setFilter] = useState<UpdateCategory>('全部');
    const theme = useTheme();

    const categories: UpdateCategory[] = ['全部', '重大更新', '新功能', '優化', '修復'];

    const filtered = filter === '全部'
        ? UPDATES
        : UPDATES.filter((u) => u.category === filter);

    const totalUpdates = UPDATES.length;
    const latestVersion = UPDATES[0]?.version ?? '';

    return (
        <Container maxWidth="md" sx={{ py: 4, pb: 10 }}>
            <Button
                startIcon={<ArrowBack />}
                component={Link}
                href="/"
                sx={{ mb: 4, color: 'text.secondary' }}
            >
                返回首頁
            </Button>

            {/* Header */}
            <Box textAlign="center" mb={4}>
                <Typography variant="h2" mb={2}>📋</Typography>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                    更新日誌
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    LUMO 的每一次進步，都為了更好的你
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                    <Chip label={`${totalUpdates} 次更新`} size="small" />
                    <Chip label={latestVersion} size="small" color="primary" />
                    <Chip label="2026" size="small" variant="outlined" />
                </Stack>
            </Box>

            {/* Filter Chips */}
            <Stack direction="row" spacing={1} justifyContent="center" mb={4} flexWrap="wrap" useFlexGap>
                {categories.map((cat) => (
                    <Chip
                        key={cat}
                        label={cat}
                        onClick={() => setFilter(cat)}
                        color={filter === cat ? 'primary' : 'default'}
                        variant={filter === cat ? 'filled' : 'outlined'}
                        sx={{ fontWeight: filter === cat ? 'bold' : 'normal' }}
                    />
                ))}
            </Stack>

            {/* Timeline */}
            <Stack spacing={3}>
                {filtered.map((entry, i) => (
                    <Card
                        key={i}
                        sx={{
                            borderRadius: 3,
                            borderLeft: `4px solid`,
                            borderLeftColor: `${CATEGORY_COLORS[entry.category]}.main`,
                        }}
                    >
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
                                <Chip
                                    label={entry.category}
                                    size="small"
                                    color={CATEGORY_COLORS[entry.category]}
                                />
                                <Chip label={entry.version} size="small" variant="outlined" />
                                <Typography variant="caption" color="text.secondary">
                                    {entry.date}
                                </Typography>
                            </Stack>
                            <Typography variant="h6" fontWeight="bold" mb={1}>
                                {entry.title}
                            </Typography>
                            <Divider sx={{ mb: 1.5 }} />
                            <Stack spacing={0.5}>
                                {entry.details.map((detail, j) => (
                                    <Typography key={j} variant="body2" color="text.secondary">
                                        • {detail}
                                    </Typography>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
            </Stack>

            {filtered.length === 0 && (
                <Box textAlign="center" py={6}>
                    <Typography color="text.secondary">此分類暫無更新紀錄</Typography>
                </Box>
            )}

            {/* Footer */}
            <Box mt={6} textAlign="center">
                <Typography variant="caption" color="text.secondary">
                    © 2026 LUMO NCNU — 持續為暨大打造更好的運動揪團體驗
                </Typography>
            </Box>
        </Container>
    );
}
