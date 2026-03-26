'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    TextField,
    MenuItem,
    ListSubheader,
    Stack,
    CircularProgress,
    Alert,
    Box,
} from '@mui/material';
import { api } from '@/lib/api-client';
import { DEPARTMENT_GROUPS } from '@/lib/constants';

/** 前端科系版本號 — 每次更新科系列表時遞增 */
export const DEPARTMENT_VERSION = 2;

interface DepartmentUpdateDialogProps {
    open: boolean;
    currentDepartment: string | null;
    onComplete: () => void;
    getToken: () => Promise<string | null>;
}

export default function DepartmentUpdateDialog({
    open,
    currentDepartment,
    onComplete,
    getToken,
}: DepartmentUpdateDialogProps) {
    const [department, setDepartment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!department) return;
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            if (!token) {
                setError('請先登入');
                setLoading(false);
                return;
            }
            const response = await api.updateProfile(token, { department });
            if (response.success) {
                // 記住已完成此版本的更新
                localStorage.setItem('lumo_dept_version', String(DEPARTMENT_VERSION));
                onComplete();
            } else {
                setError((response as any).error?.message || '更新失敗');
            }
        } catch {
            setError('網路連線失敗');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
            slotProps={{ backdrop: { onClick: (e) => e.stopPropagation() } }}
        >
            <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', pt: 3 }}>
                📢 系所資料更新
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        我們更新了系所選單，請重新選擇您的系所以確保資料正確。
                    </Alert>

                    {currentDepartment && (
                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                目前系所：<strong>{currentDepartment}</strong>
                            </Typography>
                        </Box>
                    )}

                    <TextField
                        label="請選擇新系所"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        select
                        fullWidth
                        required
                    >
                        {Object.entries(DEPARTMENT_GROUPS).flatMap(([college, depts]) => [
                            <ListSubheader key={college} sx={{ fontWeight: 'bold', color: 'text.primary', bgcolor: 'background.paper' }}>
                                {college}
                            </ListSubheader>,
                            ...depts.map(dept => (
                                <MenuItem key={dept} value={dept} sx={{ pl: 4 }}>{dept}</MenuItem>
                            )),
                        ])}
                    </TextField>

                    {error && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!department || loading}
                    sx={{ borderRadius: 2, px: 4 }}
                >
                    {loading ? <CircularProgress size={24} /> : '確認更新'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
