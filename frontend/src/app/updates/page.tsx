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
        version: 'v1.16.0',
        date: '2026-04-11',
        category: '重大更新',
        title: '🏔️ 全站背景主題大改版',
        details: [
            '淺色模式：淡紫漸層背景 + 四層薰衣草山脈 + 太陽光暈雲霧裝飾',
            '深色模式：深紫漸層背景 + 四層暗紫山脈 + 月牙星星裝飾',
            '深淺色切換時背景、山脈、裝飾、文字色全部即時跟隨切換',
            '所有頁面統一背景，不再有白底/黑底不一致的問題',
            '卡片、Paper、AppBar 皆套用毛玻璃效果（backdrop-filter blur）',
            '預設主題改為淺色模式，新用戶首次進入即為淡紫色介面',
        ],
    },
    {
        version: 'v1.15.0',
        date: '2026-04-10',
        category: '重大更新',
        title: '🏆 排行榜三分頁大改版',
        details: [
            '排行榜從「系所 / 個人」二分頁重新設計為「系所排行 / 運動排行 / 社交排行」三分頁',
            '7 項純運動（籃球、跑步、羽球、桌球、健身、排球、網球）各自獨立排行，前 3 名獲得專屬稱號',
            '3 項社交活動（晚風漫遊、飯飯之交、讀家回憶）各自獨立排行，前 3 名獲得專屬稱號',
            '共新增 30 個活動排行稱號（如 🏀 籃球之王、🌙 月夜行者、📚 學霸之王 等）',
            '系所排行前 3 名所有成員獲得「🌟 XX系之光」榮耀稱號',
            '系所排行僅計算純運動參與次數，社交活動不列入',
            '所有排行榜完全公開，無需 PLUS 即可查看',
            '每月自動重新結算',
        ],
    },
    {
        version: 'v1.14.2',
        date: '2026-04-09',
        category: '修復',
        title: '🛠️ 首頁 Banner 重疊修復',
        details: [
            '修正「讀家回憶活動橫幅」與「上月最強熱血系所」兩張卡片在手機和電腦上重疊的問題',
            '活動期間兩張卡片保持正常間距，不再互相遮擋',
            '非活動期間系所橫幅恢復微浮層次感',
        ],
    },
    {
        version: 'v1.14.1',
        date: '2026-04-07',
        category: '優化',
        title: '🔔 通知系統優化 & 新手引導修復',
        details: [
            '通知訊息將於 3 天後自動清除，保持通知列表乾淨',
            '新增管理員廣播通知功能（系統公告）',
            '修復新手引導（Onboarding）在手機切換到 Instagram 後回來變白畫面、需重新填資料的問題',
            '引導流程的表單進度現會自動暫存，即使頁面被回收也能恢復',
        ],
    },
    {
        version: 'v1.14.0',
        date: '2026-04-07',
        category: '新功能',
        title: '💪 健身訓練記錄器',
        details: [
            '健身（GYM）頁面新增「開啟訓練記錄器」按鈕',
            '四大器材分類：自由重量（20 項）、固定式機械（16 項）、有氧器材（8 項）、功能性/伸展（14 項）',
            '三階段流程：選擇動作 → 訓練記錄 → 結算截圖',
            '支援「組×次」與「計時」雙模式，可自由切換',
            '組間休息倒數計時器（30s / 1m / 90s / 2m / 3m 預設）',
            '每組可獨立調整重量（±2.5kg）與次數（±1）',
            '支援自訂動作名稱與模式',
            '訓練完成後顯示完整結算畫面：訓練時間、動作數、完成組數、總訓練量（kg）',
            '結算畫面含每項動作詳細記錄，方便截圖保存',
            '手機全螢幕 Dialog，操作體驗流暢',
        ],
    },
    {
        version: 'v1.13.1',
        date: '2026-04-07',
        category: '優化',
        title: '🏸 羽球計分器：單局制 & 隊伍制',
        details: [
            '計分器新增「單局制」模式（bestOf = 1），適合快速友誼賽',
            '新增「隊伍制」模式：固定 5 場（男單→女單→男雙→女雙→混雙），先取 3 勝',
            '隊伍制每場自動為單局制，並以 Stepper 顯示對戰進度',
            '隊伍制隱藏多餘的「每場賽制」選擇器，介面更簡潔',
        ],
    },
    {
        version: 'v1.13.0',
        date: '2026-04-07',
        category: '新功能',
        title: '🏸 羽球計分器',
        details: [
            '羽球頁面新增「開啟計分器」按鈕，點擊後彈出完整計分介面',
            '支援 4 種計分制度：21 分制（BWF 標準）、11 分制、15 分制、31 分制',
            '支援單打、雙打、混合雙打三種比賽類型',
            '支援三局兩勝 / 五局三勝賽制',
            'Deuce 判定：平分後須領先 2 分，有突然死亡上限',
            '發球權自動追蹤，顯示左/右半場站位',
            '局末點、賽末點、技術暫停即時提示',
            '完整撤銷功能（每次得分前自動存快照）',
            '自訂隊名、已完成局數記錄、比賽結束詳細戰報',
            '懶載入設計，不影響整體頁面效能',
        ],
    },
    {
        version: 'v1.12.3',
        date: '2026-04-07',
        category: '優化',
        title: '🛠️ 管理員後台分頁 & 首頁飲食指南調整',
        details: [
            '管理員後台：揪團管理、檢舉處理、使用者管理三個 Tab 新增分頁功能',
            '每頁筆數可選 10 / 20 / 50，顯示正確的總筆數',
            '活動飲食指南從 Card 改為 Button，與升級 PRO、追蹤 LUMO 三按鈕統一大小',
            '社交卡片淺色/深色模式統一使用深色漸層風格',
            '主題移除 MuiCard backgroundImage:none，修復漸層被覆蓋問題',
        ],
    },
    {
        version: 'v1.12.2',
        date: '2026-04-06',
        category: '優化',
        title: '🎨 淺色模式社交卡片 & FAB 修復',
        details: [
            '社交活動卡片淺色模式改為深底白字漸層，對比更鮮明',
            '使用說明 FAB 改為紫色底，淺色模式下清晰可見',
            '深色模式完全不受影響',
        ],
    },
    {
        version: 'v1.12.1',
        date: '2026-04-06',
        category: '優化',
        title: '🎨 淺色模式全面美化',
        details: [
            '主題系統加強：Card/Paper 陰影與邊框、AppBar 底線、Table 表頭高亮、Chip 填色等',
            '社交活動卡片淺色漸層改為柔和配色（薰衣草、珊瑚色）',
            '營養指南頁面淺色模式配色修復',
            '捲軸樣式適配淺色模式',
            '深色模式完全不受影響',
        ],
    },
    {
        version: 'v1.12.0',
        date: '2026-04-06',
        category: '新功能',
        title: '📖 使用規則與說明頁面',
        details: [
            '新增「使用規則與說明」頁面（/guide），涵蓋揪團計算、排行榜規則、勳章與稱號、信譽與檢舉、帳號方案等',
            '支援分類篩選，以 Q&A 手風琴形式呈現',
            '首頁右下角新增 📖 快捷按鈕，與更新日誌、免責聲明並排',
        ],
    },
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
