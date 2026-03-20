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
