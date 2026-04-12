'use client';

import { useState } from 'react';
import {
    Container, Typography, Card, CardContent, Stack, Avatar, Box, Button,
    Chip, Divider, Snackbar, Alert, Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupIcon from '@mui/icons-material/Group';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '@/hooks/useAuth';
import CrownBadge from '@/app/components/CrownBadge';

// 模擬成員資料
const MOCK_MEMBERS = [
    { user: { id: 'u1', nickname: '小明', email: 'ming@mail1.ncnu.edu.tw', attendedCount: 10, noShowCount: 1, planType: 'PLUS' }, isAttended: null },
    { user: { id: 'u2', nickname: '小華', email: 'hua@mail1.ncnu.edu.tw', attendedCount: 5, noShowCount: 0, planType: 'FREE' }, isAttended: true },
    { user: { id: 'u3', nickname: '阿傑', email: 'jie@mail1.ncnu.edu.tw', attendedCount: 8, noShowCount: 3, planType: 'FREE' }, isAttended: false },
    { user: { id: 'u4', nickname: '小美', email: 'mei@mail1.ncnu.edu.tw', attendedCount: 0, noShowCount: 0, planType: 'FREE' }, isAttended: null },
];

export default function TestAttendancePage() {
    const theme = useTheme();
    const { user, loading } = useAuth();
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, boolean | null>>(() => {
        const init: Record<string, boolean | null> = {};
        MOCK_MEMBERS.forEach(m => { init[m.user.id] = m.isAttended; });
        return init;
    });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' }>({ open: false, message: '', severity: 'info' });

    const handleAttendanceChange = (userId: string, isAttended: boolean | null) => {
        setAttendanceRecords(prev => ({ ...prev, [userId]: isAttended }));
    };

    const handleSaveAttendance = () => {
        const records = Object.entries(attendanceRecords).map(([userId, isAttended]) => ({ userId, isAttended }));
        console.log('模擬儲存出缺席:', records);
        setSnackbar({ open: true, message: '出缺席紀錄已儲存！（模擬）', severity: 'success' });
    };

    const handleReset = () => {
        const init: Record<string, boolean | null> = {};
        MOCK_MEMBERS.forEach(m => { init[m.user.id] = null; });
        setAttendanceRecords(init);
        setSnackbar({ open: true, message: '已重設所有出缺席狀態', severity: 'info' });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user || user.role !== 'ADMIN') {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>無權限</Typography>
                <Typography color="text.secondary" mb={3}>此頁面僅限管理員存取。</Typography>
                <Button component={Link} href="/" variant="outlined">返回首頁</Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                component={Link}
                href="/"
                sx={{ mb: 2, color: 'text.secondary' }}
            >
                返回首頁
            </Button>

            <Typography variant="h4" fontWeight="bold" gutterBottom>
                出缺席 UI 測試區
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
                此頁面模擬揪團詳情頁中的出缺席按鈕和成員列表，方便管理員預覽和測試 UI 效果。
                以下資料皆為模擬，不會影響真實資料庫。
            </Typography>

            {/* 情境說明 */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>模擬情境</Typography>
                <Typography variant="caption" color="text.secondary" component="div">
                    • 你是揪團發起人，活動已結束超過 30 分鐘<br />
                    • 小明：尚未標記（null）、PLUS 會員<br />
                    • 小華：已標記「出席」<br />
                    • 阿傑：已標記「缺席」<br />
                    • 小美：尚未標記、無歷史出席紀錄
                </Typography>
            </Paper>

            {/* 模擬成員卡片 */}
            <Card sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <GroupIcon color="action" />
                            <Typography variant="h6">
                                參與成員 ({MOCK_MEMBERS.length})
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                onClick={handleReset}
                            >
                                重設
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={handleSaveAttendance}
                            >
                                儲存紀錄
                            </Button>
                        </Stack>
                    </Stack>

                    <Stack spacing={2}>
                        {MOCK_MEMBERS.map((member, index) => (
                            <Stack
                                key={member.user.id}
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}
                            >
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                        {member.user.nickname[0]}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center' }}>
                                            {member.user.nickname}
                                            <CrownBadge isPlus={member.user.planType === 'PLUS'} />
                                            {index === 0 && (
                                                <Typography component="span" variant="caption" color="primary" sx={{ ml: 1, fontWeight: 'bold' }}>
                                                    發起人
                                                </Typography>
                                            )}
                                            {(member.user.attendedCount + member.user.noShowCount) > 0 && (
                                                <Chip
                                                    size="small"
                                                    label={`🔥 ${Math.round((member.user.attendedCount / (member.user.attendedCount + member.user.noShowCount)) * 100)}%`}
                                                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {index === 0 ? '第一位' : `第 ${index + 1} 位`}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Stack direction="column" spacing={0.5} alignItems="flex-end">
                                    {/* 發起人（index 0）不顯示出缺席按鈕（跟實際一樣） */}
                                    {index !== 0 && (
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant={attendanceRecords[member.user.id] === true ? "contained" : "outlined"}
                                                color="success"
                                                onClick={() => handleAttendanceChange(member.user.id, true)}
                                                sx={{ minWidth: 48, px: 1 }}
                                            >
                                                出席
                                            </Button>
                                            <Button
                                                size="small"
                                                variant={attendanceRecords[member.user.id] === false ? "contained" : "outlined"}
                                                color="error"
                                                onClick={() => handleAttendanceChange(member.user.id, false)}
                                                sx={{ minWidth: 48, px: 1 }}
                                            >
                                                缺席
                                            </Button>
                                        </Stack>
                                    )}
                                </Stack>
                            </Stack>
                        ))}
                    </Stack>

                    <Divider sx={{ my: 3 }} />

                    {/* 當前狀態快照 */}
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        當前標記狀態（即時更新）
                    </Typography>
                    <Stack spacing={0.5}>
                        {MOCK_MEMBERS.map(m => {
                            const val = attendanceRecords[m.user.id];
                            return (
                                <Stack key={m.user.id} direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2" sx={{ minWidth: 60 }}>{m.user.nickname}</Typography>
                                    <Chip
                                        size="small"
                                        label={val === true ? '✅ 出席' : val === false ? '❌ 缺席' : '⏳ 未標記'}
                                        color={val === true ? 'success' : val === false ? 'error' : 'default'}
                                        variant={val === null ? 'outlined' : 'filled'}
                                    />
                                </Stack>
                            );
                        })}
                    </Stack>
                </CardContent>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
