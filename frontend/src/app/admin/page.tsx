'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    Container,
    Card,
    CardContent,
    Stack,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    CleaningServices as CleanupIcon,
    Refresh as RefreshIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

interface Group {
    id: string;
    title: string;
    sportType: string;
    time: string;
    location: string;
    capacity: number;
    currentCount: number;
    status: string;
    createdBy: { nickname: string; email: string };
    createdAt: string;
}

interface Stats {
    totalGroups: number;
    activeGroups: number;
    totalUsers: number;
    expiredGroups: number;
}

interface Report {
    id: string;
    targetId: string;
    targetType: string;
    reason: string;
    details: string;
    reporterId: string;
    createdAt: string;
    reporter: {
        id: string;
        nickname: string;
        email: string;
    };
    targetDetails: any;
}

const sportTypeLabels: Record<string, string> = {
    BASKETBALL: '🏀 籃球',
    RUNNING: '🏃 跑步',
    BADMINTON: '🏸 羽球',
    TABLE_TENNIS: '🏓 桌球',
    GYM: '💪 健身',
};

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    OPEN: 'success',
    FULL: 'warning',
    CANCELLED: 'error',
    COMPLETED: 'default',
};

export default function AdminPage() {
    const { user, loading: authLoading, getToken } = useAuth();
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [tabValue, setTabValue] = useState(0);

    // 編輯對話框
    const [editDialog, setEditDialog] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [editForm, setEditForm] = useState({ title: '', status: '' });

    // 刪除確認對話框
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) return;

            const [groupsRes, statsRes, reportsRes] = await Promise.all([
                api.getAdminGroups(token),
                api.getAdminStats(token),
                api.getAdminReports(token),
            ]);

            if (!groupsRes.success || !statsRes.success || !reportsRes.success) {
                throw new Error(groupsRes.error?.message || statsRes.error?.message || reportsRes.error?.message || '無法載入資料');
            }

            setGroups((groupsRes.data?.items as Group[]) || []);
            setReports((reportsRes.data?.items as Report[]) || []);
            setStats(statsRes.data || null);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : '發生錯誤');
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        }
    }, [authLoading, user, fetchData]);

    // 檢查登入狀態
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    // 如果還在載入
    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    // 權限檢查：非管理員顯示無權限訊息
    if (user && user.role !== 'ADMIN') {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    component={Link}
                    href="/"
                    sx={{ mb: 2, color: 'text.secondary' }}
                >
                    返回首頁
                </Button>
                <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>🚫 無權限存取</Typography>
                    <Typography>此頁面僅限管理員使用。如需管理員權限，請聯繫系統管理員。</Typography>
                </Alert>
            </Container>
        );
    }

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            const token = await getToken();
            if (!token) return;
            const res = await api.deleteGroup(token, deletingId);

            if (!res.success) throw new Error(res.error?.message || '刪除失敗');

            setSuccess('揪團已刪除');
            setDeleteDialog(false);
            setDeletingId(null);
            fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '刪除失敗');
        }
    };

    const handleEdit = async () => {
        if (!editingGroup) return;
        try {
            const token = await getToken();
            if (!token) return;
            const res = await api.updateGroup(token, editingGroup.id, editForm);

            if (!res.success) throw new Error(res.error?.message || '更新失敗');

            setSuccess('揪團已更新');
            setEditDialog(false);
            setEditingGroup(null);
            fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '更新失敗');
        }
    };

    const handleCleanup = async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const res = await api.cleanupGroups(token);

            if (!res.success) throw new Error(res.error?.message || '清理失敗');

            setSuccess(res.data?.message || '清理成功');
            fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '清理失敗');
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!window.confirm('確定要標記此檢舉為已處理（刪除紀錄）嗎？')) return;
        try {
            const token = await getToken();
            if (!token) return;
            const res = await api.deleteReport(token, reportId);

            if (!res.success) throw new Error(res.error?.message || '刪除失敗');

            setSuccess('檢舉已處理');
            fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '操作失敗');
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                component={Link}
                href="/profile"
                sx={{ mb: 2, color: 'text.secondary' }}
            >
                返回個人檔案
            </Button>

            <Typography variant="h4" fontWeight="bold" gutterBottom>
                🛠️ 管理員後台
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4, mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="揪團管理" />
                    <Tab label={`檢舉處理 ${reports.length > 0 ? `(${reports.length})` : ''}`} />
                </Tabs>
            </Box>

            {tabValue === 0 && (
                <>
                    {/* 統計卡片 */}
                    {stats && (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                            <Card sx={{ flex: 1 }}>
                                <CardContent>
                                    <Typography color="text.secondary">總揪團數</Typography>
                                    <Typography variant="h4">{stats.totalGroups}</Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: 1 }}>
                                <CardContent>
                                    <Typography color="text.secondary">進行中</Typography>
                                    <Typography variant="h4" color="success.main">
                                        {stats.activeGroups}
                                    </Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: 1 }}>
                                <CardContent>
                                    <Typography color="text.secondary">待清理</Typography>
                                    <Typography variant="h4" color="warning.main">
                                        {stats.expiredGroups}
                                    </Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: 1 }}>
                                <CardContent>
                                    <Typography color="text.secondary">總用戶</Typography>
                                    <Typography variant="h4">{stats.totalUsers}</Typography>
                                </CardContent>
                            </Card>
                        </Stack>
                    )}

                    {/* 操作按鈕 */}
                    <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>
                            重新整理
                        </Button>
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={<CleanupIcon />}
                            onClick={handleCleanup}
                        >
                            清理過期揪團
                        </Button>
                    </Box>

                    {/* 揪團表格 */}
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>標題</TableCell>
                                    <TableCell>類型</TableCell>
                                    <TableCell>時間</TableCell>
                                    <TableCell>人數</TableCell>
                                    <TableCell>狀態</TableCell>
                                    <TableCell>建立者</TableCell>
                                    <TableCell>操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {groups.map((group) => (
                                    <TableRow key={group.id}>
                                        <TableCell>{group.title}</TableCell>
                                        <TableCell>{sportTypeLabels[group.sportType] || group.sportType}</TableCell>
                                        <TableCell>
                                            {new Date(group.time).toLocaleString('zh-TW', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            {group.currentCount}/{group.capacity}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={group.status}
                                                size="small"
                                                color={statusColors[group.status] || 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>{group.createdBy?.nickname || group.createdBy?.email}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setEditingGroup(group);
                                                    setEditForm({ title: group.title, status: group.status });
                                                    setEditDialog(true);
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setDeletingId(group.id);
                                                    setDeleteDialog(true);
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {tabValue === 1 && (
                <>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell>檢舉時間</TableCell>
                                    <TableCell>檢舉人</TableCell>
                                    <TableCell>目標</TableCell>
                                    <TableCell>原因</TableCell>
                                    <TableCell>補充說明</TableCell>
                                    <TableCell align="right">操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                            目前沒有檢舉紀錄
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell>{new Date(report.createdAt).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{report.reporter.nickname}</Typography>
                                                <Typography variant="caption" color="text.secondary">{report.reporter.email}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={report.targetType === 'USER' ? '使用者' : '揪團'}
                                                    color={report.targetType === 'USER' ? 'primary' : 'secondary'}
                                                    sx={{ mb: 1 }}
                                                />
                                                <Typography variant="body2">
                                                    {report.targetType === 'USER'
                                                        ? report.targetDetails?.nickname || '未知用戶'
                                                        : report.targetDetails?.title || '未知揪團'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold" color="error">
                                                    {report.reason}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {report.details || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    color="success"
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handleDeleteReport(report.id)}
                                                >
                                                    標記已處理 (刪除)
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    )
                </>
            )}

            {/* 編輯對話框 */}
            <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
                <DialogTitle>編輯揪團</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="標題"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>狀態</InputLabel>
                        <Select
                            value={editForm.status}
                            label="狀態"
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        >
                            <MenuItem value="OPEN">開放</MenuItem>
                            <MenuItem value="FULL">已滿</MenuItem>
                            <MenuItem value="CANCELLED">已取消</MenuItem>
                            <MenuItem value="COMPLETED">已完成</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog(false)}>取消</Button>
                    <Button variant="contained" onClick={handleEdit}>
                        儲存
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 刪除確認對話框 */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
                <DialogTitle>確認刪除</DialogTitle>
                <DialogContent>
                    <Typography>確定要刪除這個揪團嗎？此操作無法復原。</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(false)}>取消</Button>
                    <Button variant="contained" color="error" onClick={handleDelete}>
                        刪除
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
