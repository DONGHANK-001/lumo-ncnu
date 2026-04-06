'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Stack,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    useTheme,
    Paper,
} from '@mui/material';
import { ArrowBack, ExpandMore } from '@mui/icons-material';

type GuideCategory = '全部' | '揪團' | '排行榜' | '勳章與稱號' | '信譽與檢舉' | '帳號與方案';

interface GuideSection {
    category: Exclude<GuideCategory, '全部'>;
    icon: string;
    title: string;
    items: { q: string; a: string }[];
}

const GUIDE_SECTIONS: GuideSection[] = [
    {
        category: '揪團',
        icon: '⚽',
        title: '揪團說明',
        items: [
            {
                q: '有哪些運動類型？',
                a: '目前支援：🏀 籃球、🏃 跑步、🏸 羽球、🏓 桌球、💪 健身、🏐 排球、🌙 夜間散步、🎾 網球、🍽️ 聚餐、📚 讀書，未來會持續新增。',
            },
            {
                q: '揪團次數怎麼計算？',
                a: '每次成功加入一個揪團（狀態為「已加入」），就計為 1 次揪團。自己發起的揪團在有人加入後也算 1 次。排行榜以「每月加入的揪團次數」做排名。',
            },
            {
                q: '每週可以參加幾次揪團？',
                a: '基礎額度為每週 4 次。額度會根據你的活躍度提升：每發起 2 次揪團 +1、每加入 2 次揪團 +1、連續活躍天數每 2 天 +1。公式：4 + ⌊發起數/2⌋ + ⌊加入數/2⌋ + ⌊連續天數/2⌋。',
            },
            {
                q: '結算週期是什麼？',
                a: '排行榜以「自然月」為一期。每月 1 日重新計算（首月 2026/3 由 3/2 起算）。可切換檢視「本月」或「上月」的排名。',
            },
        ],
    },
    {
        category: '排行榜',
        icon: '🏆',
        title: '排行榜規則',
        items: [
            {
                q: '系所排行榜怎麼排？',
                a: '統計該系所所有成員在當月的「加入揪團總次數」，由高到低排名。同時顯示該系所的「不重複參與人數」和「最熱門運動類型」。',
            },
            {
                q: '個人排行榜怎麼排？',
                a: '統計個人當月加入揪團的總次數，前 10 名會顯示在排行榜上。第 1~3 名會顯示在獎台（Podium）區域，並獲得對應的排行榜專屬稱號。',
            },
            {
                q: '排行榜稱號有哪些？',
                a: '每月結算後，個人排行前 10 名各有專屬稱號：第 1 名「⚔️ 不敗戰神」、第 2 名「👑 無雙霸主」、第 3 名「🌟 絕世強者」…以此類推。稱號會顯示在個人檔案上。',
            },
            {
                q: '排行榜需要 PLUS 方案嗎？',
                a: '系所排行榜所有人都能看。個人排行榜需要 PLUS 方案才能查看（試用期間免費開放）。',
            },
        ],
    },
    {
        category: '勳章與稱號',
        icon: '🎖️',
        title: '勳章與稱號系統',
        items: [
            {
                q: '勳章有哪些？',
                a: '勳章會在你達成特定條件時自動解鎖，例如：🧭 校園探索家（參與 4 個不同地點的揪團）、🌙 夜行動物（參與 5 場晚上 8 點後的揪團）等。系統會持續新增新勳章。',
            },
            {
                q: '稱號有哪幾類？',
                a: '共有 6 大類稱號：\n• 🌅 創始會員 — 前 10 位加入的玩家各有獨特稱號\n• ⚔️ 排行榜稱號 — 每月個人排行前 10 名\n• ⚾ 限定活動 — 特定活動達成條件獲得\n• ⚜️ 訂閱方案 — 如終身黑金卡持有者\n• 🛡️ 信譽獎勵 — 連續維持滿分信譽（7天/30天/90天/365天）\n• 🏆 成就稱號 — 累計里程碑達成',
            },
            {
                q: '稱號可以更換嗎？',
                a: '可以。在個人檔案頁面可以選擇要展示的稱號。',
            },
        ],
    },
    {
        category: '信譽與檢舉',
        icon: '⚖️',
        title: '信譽制度與檢舉規範',
        items: [
            {
                q: '信譽分數怎麼算？',
                a: '初始信譽為 100 分。公式：100 - 負評×2 + ⌊好評/2⌋（最低 0，最高 100）。正常使用不會扣分，只有被檢舉成立才會影響。',
            },
            {
                q: '信譽太低會怎樣？',
                a: '• 80 分以上：正常\n• 70~79 分：警告，自動停用 1 天\n• 60~69 分：自動停用 3 天\n• 50~59 分：自動停用 7 天\n• 50 分以下：永久停用',
            },
            {
                q: '可以檢舉什麼？',
                a: '可檢舉「使用者」或「揪團」。檢舉原因包括：\n• 騷擾或不當言論（-5 分）\n• 惡意放鴿子（-3 分）\n• 詐騙或金錢糾紛（-8 分）\n• 冒充身份（-5 分）\n• 危害安全（-10 分）\n• 其他（-3 分）\n括號內為檢舉成立後的扣分。',
            },
            {
                q: '被檢舉後怎麼辦？',
                a: '檢舉送出後由管理員審核。若成立，被檢舉者會扣除對應信譽分數，視情況可能自動停用帳號。停用期間無法使用平台功能。',
            },
        ],
    },
    {
        category: '帳號與方案',
        icon: '👤',
        title: '帳號與訂閱方案',
        items: [
            {
                q: 'FREE 和 PLUS 方案差在哪？',
                a: '• FREE：可瀏覽、加入揪團，查看系所排行榜\n• PLUS：額外可查看個人排行榜、進階配對功能、優先顯示等\n目前試用期間所有功能免費開放。',
            },
            {
                q: '需要用學校帳號註冊嗎？',
                a: '註冊時需要填寫學號與系所，用於系所排行榜統計。登入方式使用 Google 帳號（Firebase 驗證）。',
            },
            {
                q: '我的資料安全嗎？',
                a: 'LUMO 僅蒐集必要資料（學號、系所、暱稱），不會將個人資料提供給第三方。詳細內容請參閱服務條款與免責聲明。',
            },
        ],
    },
];

const CATEGORY_COLORS: Record<Exclude<GuideCategory, '全部'>, string> = {
    '揪團': '#4fc3f7',
    '排行榜': '#ffd54f',
    '勳章與稱號': '#ba68c8',
    '信譽與檢舉': '#ef5350',
    '帳號與方案': '#81c784',
};

export default function GuidePage() {
    const theme = useTheme();
    const [selectedCategory, setSelectedCategory] = useState<GuideCategory>('全部');

    const filteredSections =
        selectedCategory === '全部'
            ? GUIDE_SECTIONS
            : GUIDE_SECTIONS.filter((s) => s.category === selectedCategory);

    const categories: GuideCategory[] = ['全部', '揪團', '排行榜', '勳章與稱號', '信譽與檢舉', '帳號與方案'];

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    href="/"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2, color: 'text.secondary' }}
                >
                    回首頁
                </Button>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    📖 使用規則與說明
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    了解 LUMO 的揪團計算、排行榜規則、勳章系統、檢舉規範等
                </Typography>
            </Box>

            {/* Category Filter */}
            <Stack direction="row" spacing={1} sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
                {categories.map((cat) => (
                    <Chip
                        key={cat}
                        label={cat}
                        clickable
                        variant={selectedCategory === cat ? 'filled' : 'outlined'}
                        color={selectedCategory === cat ? 'primary' : 'default'}
                        onClick={() => setSelectedCategory(cat)}
                    />
                ))}
            </Stack>

            {/* Guide Sections */}
            <Stack spacing={3}>
                {filteredSections.map((section) => (
                    <Card
                        key={section.category}
                        sx={{
                            borderRadius: 3,
                            border: `1px solid ${theme.palette.divider}`,
                            overflow: 'hidden',
                        }}
                    >
                        <CardContent sx={{ p: 0 }}>
                            {/* Section Header */}
                            <Paper
                                sx={{
                                    p: 2.5,
                                    borderRadius: 0,
                                    background: `linear-gradient(135deg, ${CATEGORY_COLORS[section.category]}22, ${CATEGORY_COLORS[section.category]}08)`,
                                    borderBottom: `2px solid ${CATEGORY_COLORS[section.category]}44`,
                                }}
                                elevation={0}
                            >
                                <Typography variant="h6" fontWeight="bold">
                                    {section.icon} {section.title}
                                </Typography>
                            </Paper>

                            {/* Q&A Accordions */}
                            {section.items.map((item, idx) => (
                                <Accordion
                                    key={idx}
                                    disableGutters
                                    elevation={0}
                                    sx={{
                                        '&:before': { display: 'none' },
                                        borderBottom: idx < section.items.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                                    }}
                                >
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography fontWeight={600} fontSize="0.95rem">
                                            {item.q}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0 }}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}
                                        >
                                            {item.a}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </Stack>

            {/* Footer Note */}
            <Box sx={{ mt: 5, textAlign: 'center' }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="body2" color="text.secondary">
                    規則如有更新，以本頁面為準。如有疑問歡迎透過意見回饋聯繫我們。
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                    最後更新：2026 年 4 月 6 日
                </Typography>
            </Box>
        </Container>
    );
}
