'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Paper,
    Stack,
    TextField,
    MenuItem,
    RadioGroup,
    FormControlLabel,
    Radio,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    ArrowBack,
    Security,
    Report,
    EmojiPeople,
    Phone,
    Gavel,
    Visibility,
    AttachMoney,
    Lock
} from '@mui/icons-material';

const SAFETY_RULES = [
    { icon: <EmojiPeople fontSize="large" />, title: '選擇公共場所', description: '請在校園內公共場所進行運動活動，如體育館、操場等人多的地方。' },
    { icon: <Security fontSize="large" />, title: '首次見面要小心', description: '首次與新成員見面，建議選擇人多且有監視器的場地。' },
    { icon: <Phone fontSize="large" />, title: '告知親友行蹤', description: '出門運動前，告知親友您的活動時間、地點與預計返回時間。' },
    { icon: <Gavel fontSize="large" />, title: '遵守場地規則', description: '尊重場地使用規則與禮儀，愛護公共設施。' },
    { icon: <EmojiPeople fontSize="large" />, title: '尊重每個人', description: '尊重每位參與者的程度差異，營造友善包容的運動環境。' },
    { icon: <Report fontSize="large" />, title: '遇到不當行為立即離開', description: '如遇任何不當行為或感到不安全，請立即離開並向平台檢舉。' },
    { icon: <AttachMoney fontSize="large" />, title: '避免金錢往來', description: '請勿與他人進行金錢交易或借貸，保護自己的財務安全。' },
    { icon: <Lock fontSize="large" />, title: '保護個人隱私', description: '不要輕易透露個人敏感資訊，如住址、電話、身分證字號等。' },
];

const REPORT_REASONS = [
    '騷擾或不當言語',
    '詐騙或金錢糾紛',
    '爽約或遲到不報',
    '假冒身分',
    '其他違規行為',
];

export default function SafetyPage() {
    const { user, getToken } = useAuth();
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportForm, setReportForm] = useState({
        targetType: 'USER',
        targetId: '',
        reason: '',
        details: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmitReport = async () => {
        if (!user) {
            setMessage({ type: 'error', text: '請先登入' });
            return;
        }

        if (!reportForm.targetId || !reportForm.reason) {
            setMessage({ type: 'error', text: '請填寫必填欄位' });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        const token = await getToken();
        const response = await api.createReport(token!, {
            targetType: reportForm.targetType,
            targetId: reportForm.targetId,
            reason: reportForm.reason,
            details: reportForm.details,
        });

        if (response.success) {
            setMessage({ type: 'success', text: '檢舉已送出，我們會盡快處理' });
            setReportForm({ targetType: 'USER', targetId: '', reason: '', details: '' });
            setShowReportForm(false);
        } else {
            setMessage({ type: 'error', text: response.error?.message || '送出失敗' });
        }
        setSubmitting(false);
    };

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

            <Box textAlign="center" mb={6}>
                <Typography variant="h2" mb={2}>🛡️</Typography>
                <Typography variant="h3" fontWeight="bold" gutterBottom>安全規範</Typography>
                <Typography variant="h6" color="text.secondary">你的安全是我們最重視的事</Typography>
            </Box>

            <Grid container spacing={3} mb={8}>
                {SAFETY_RULES.map((rule, index) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                        <Card sx={{ height: '100%', borderRadius: 3 }}>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <Box sx={{ color: 'primary.main' }}>{rule.icon}</Box>
                                    <Box>
                                        <Typography variant="h6" gutterBottom>{rule.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {rule.description}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Paper sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>🚨 檢舉不當行為</Typography>
                <Typography color="text.secondary" mb={3}>
                    如果你遇到任何違規行為或感到不安全，請立即向我們檢舉。我們會認真處理每一則檢舉。
                </Typography>
                <Button
                    variant="contained"
                    color="error"
                    onClick={() => setShowReportForm(true)}
                    size="large"
                >
                    📝 提交檢舉
                </Button>
            </Paper>

            <Box mt={4} textAlign="center">
                <Typography variant="caption" color="text.secondary">
                    如遇緊急情況，請撥打 110 報警或 119 求助
                </Typography>
            </Box>

            {/* Report Dialog */}
            <Dialog
                open={showReportForm}
                onClose={() => setShowReportForm(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>提交檢舉</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {message && (
                            <Alert severity={message.type === 'success' ? 'success' : 'error'}>
                                {message.text}
                            </Alert>
                        )}

                        <Box>
                            <Typography variant="subtitle2" gutterBottom>檢舉對象類型 *</Typography>
                            <RadioGroup
                                row
                                value={reportForm.targetType}
                                onChange={(e) => setReportForm({ ...reportForm, targetType: e.target.value })}
                            >
                                <FormControlLabel value="USER" control={<Radio />} label="使用者" />
                                <FormControlLabel value="GROUP" control={<Radio />} label="揪團" />
                            </RadioGroup>
                        </Box>

                        <TextField
                            label="對象 ID *"
                            required
                            fullWidth
                            value={reportForm.targetId}
                            onChange={(e) => setReportForm({ ...reportForm, targetId: e.target.value })}
                            placeholder="請輸入使用者或揪團的 ID"
                            helperText="可在使用者個人頁或揪團頁面的網址中找到"
                        />

                        <TextField
                            select
                            label="檢舉原因 *"
                            required
                            fullWidth
                            value={reportForm.reason}
                            onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                        >
                            {REPORT_REASONS.map((reason) => (
                                <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="詳細說明 (選填)"
                            multiline
                            rows={4}
                            fullWidth
                            value={reportForm.details}
                            onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                            placeholder="請描述發生的情況..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setShowReportForm(false)} color="inherit">
                        取消
                    </Button>
                    <Button
                        onClick={handleSubmitReport}
                        variant="contained"
                        color="error"
                        disabled={submitting}
                    >
                        {submitting ? '送出中...' : '送出檢舉'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
