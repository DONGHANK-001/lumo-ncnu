'use client';

import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    ListSubheader,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { api } from '@/lib/api-client';
import { DEPARTMENT_GROUPS } from '@/lib/constants';

const GENDER_OPTIONS = [
    { value: 'FEMALE', label: '女生' },
    { value: 'MALE', label: '男生' },
    { value: 'NON_BINARY', label: '非二元' },
    { value: 'PREFER_NOT_TO_SAY', label: '不便透露' },
] as const;

const GRADE_OPTIONS = [
    '大一', '大二', '大三', '大四',
    '碩一', '碩二',
    '博一', '博二', '博三',
    '其他',
] as const;

interface IdentityUpdateDialogProps {
    open: boolean;
    currentDepartment: string | null;
    currentGender: string | null;
    currentGradeLabel: string | null;
    onComplete: () => void;
    getToken: () => Promise<string | null>;
}

export default function IdentityUpdateDialog({
    open,
    currentDepartment,
    currentGender,
    currentGradeLabel,
    onComplete,
    getToken,
}: IdentityUpdateDialogProps) {
    const [department, setDepartment] = useState('');
    const [gender, setGender] = useState('');
    const [gradeLabel, setGradeLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setDepartment(currentDepartment || '');
        setGender(currentGender || '');
        setGradeLabel(currentGradeLabel || '');
        setError(null);
    }, [open, currentDepartment, currentGender, currentGradeLabel]);

    const handleSubmit = async () => {
        if (!department || !gender || !gradeLabel) return;
        setLoading(true);
        setError(null);

        try {
            const token = await getToken();
            if (!token) {
                setError('請先登入');
                setLoading(false);
                return;
            }

            const res = await api.updateProfile(token, { department, gender, gradeLabel });
            if (!res.success) {
                setError(res.error?.message || '更新失敗');
                setLoading(false);
                return;
            }

            onComplete();
        } catch {
            setError('網路錯誤，請稍後再試');
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
                完成公開身分資訊
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        為了提升「看得到、可驗證」的安全性，請先補齊系所、性別、系級後再使用揪團功能。
                    </Alert>

                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            這些欄位會顯示在公開個人檔案。
                        </Typography>
                    </Box>

                    <TextField
                        label="系所"
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
                            ...depts.map((dept) => (
                                <MenuItem key={dept} value={dept} sx={{ pl: 4 }}>{dept}</MenuItem>
                            )),
                        ])}
                    </TextField>

                    <TextField
                        label="性別"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        select
                        fullWidth
                        required
                    >
                        {GENDER_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="系級"
                        value={gradeLabel}
                        onChange={(e) => setGradeLabel(e.target.value)}
                        select
                        fullWidth
                        required
                    >
                        {GRADE_OPTIONS.map((g) => (
                            <MenuItem key={g} value={g}>
                                {g}
                            </MenuItem>
                        ))}
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
                    disabled={!department || !gender || !gradeLabel || loading}
                    sx={{ borderRadius: 2, px: 4 }}
                >
                    {loading ? <CircularProgress size={24} /> : '儲存並繼續'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
