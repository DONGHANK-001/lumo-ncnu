'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Stepper,
    Step,
    StepLabel,
    TextField,
    Stack,
    Checkbox,
    FormControlLabel,
    Box,
    MenuItem,
    ListSubheader,
    CircularProgress,
    Alert
} from '@mui/material';
import { Instagram } from '@mui/icons-material';
import { api } from '@/lib/api-client';
import { DEPARTMENT_GROUPS } from '@/lib/constants';

export const DISCLAIMER_TEXT = `LUMO 運動揪團平台使用者免責聲明

一、平台性質與責任範圍
本平台「LUMO」（以下簡稱「本平台」）僅提供國立暨南國際大學校內使用者之運動揪團媒合服務，不涉及任何運動活動之組織、管理或監督。本平台不對任何因使用本服務所產生之直接或間接損害負擔法律責任。

二、個人資訊蒐集與使用（依據《個人資料保護法》）
本平台依中華民國《個人資料保護法》蒐集您的真實姓名、學號及系所資訊，僅用於：
(1) 使用者身份識別與校園安全管理
(2) 糾紛發生時之身份確認
(3) 平台內部統計與服務改善
您的個人資料將妥善保管，不會提供予第三方，但依法律規定或司法機關要求者，不在此限。

三、運動風險告知
使用者了解並同意，參與任何運動活動均存在受傷之風險，包括但不限於：肌肉拉傷、骨折、扭傷、脫水、中暑及其他身體傷害。使用者應自行評估個人健康狀況，如有心血管疾病、氣喘或其他慢性疾病者，建議事先諮詢醫師意見。

四、行為規範
使用者同意於使用本平台及參與活動時，遵守以下規範：
(1) 不得利用平台從事違法行為
(2) 不得騷擾、威脅或傷害其他使用者
(3) 不得散布不實資訊
(4) 應遵守活動場地之相關規定
違反上述規範者，本平台得逕行停權處理。

五、免責條款
本平台不對以下情況承擔責任：
(1) 使用者間因活動產生之任何糾紛、傷害或財物損失
(2) 因天候、場地或其他不可抗力因素導致之損害
(3) 使用者因自身健康狀況不佳而參與活動所致之傷害
(4) 使用者提供不實資訊所產生之一切後果

六、準據法
本聲明之解釋與適用，悉依中華民國法律為準據法。`;

const IG_URL = 'https://www.instagram.com/lumo_dailyfit?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';

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

interface OnboardingDialogProps {
    open: boolean;
    onComplete: () => void;
    getToken: () => Promise<string | null>;
}

export default function OnboardingDialog({ open, onComplete, getToken }: OnboardingDialogProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [agreed, setAgreed] = useState(false);
    const [realName, setRealName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [department, setDepartment] = useState('');
    const [gender, setGender] = useState('');
    const [gradeLabel, setGradeLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [igClicked, setIgClicked] = useState(false);

    const steps = ['免責聲明', '個人資料', '追蹤我們'];

    const handleNext = async () => {
        if (activeStep === 2) {
            // 最後一步：送出 onboarding
            setLoading(true);
            setError(null);
            try {
                const token = await getToken();
                if (!token) {
                    setError('請先登入');
                    setLoading(false);
                    return;
                }
                const response = await api.submitOnboarding(token, {
                    realName,
                    studentId,
                    department,
                    gender: gender as 'FEMALE' | 'MALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY',
                    gradeLabel,
                    disclaimerAccepted: true,
                });
                if (response.success) {
                    onComplete();
                } else {
                    setError(response.error?.message || '提交失敗');
                }
            } catch {
                setError('網路連線失敗');
            } finally {
                setLoading(false);
            }
        } else {
            setActiveStep(prev => prev + 1);
        }
    };

    const canProceed = () => {
        switch (activeStep) {
            case 0: return agreed;
            case 1: return realName.trim() && studentId.trim() && department.trim() && gender && gradeLabel;
            case 2: return igClicked;
            default: return false;
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
                歡迎加入 LUMO 🎉
            </DialogTitle>
            <DialogContent>
                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                    {steps.map(label => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === 0 && (
                    <Stack spacing={2}>
                        <Box
                            sx={{
                                maxHeight: 300,
                                overflow: 'auto',
                                p: 2,
                                bgcolor: 'action.hover',
                                borderRadius: 2,
                                fontSize: '0.85rem',
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.8,
                            }}
                        >
                            {DISCLAIMER_TEXT}
                        </Box>
                        <FormControlLabel
                            control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
                            label={
                                <Typography variant="body2" fontWeight="bold">
                                    我已閱讀並同意上述免責聲明及個人資料蒐集條款
                                </Typography>
                            }
                        />
                    </Stack>
                )}

                {activeStep === 1 && (
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            請填寫您的個人資料，用於身份識別與校園安全管理。
                        </Typography>
                        <TextField
                            label="真實姓名"
                            value={realName}
                            onChange={(e) => setRealName(e.target.value)}
                            fullWidth
                            required
                            placeholder="王小明"
                        />
                        <TextField
                            label="學號"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            fullWidth
                            required
                            placeholder="S112212038"
                        />
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
                                ...depts.map(dept => (
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
                    </Stack>
                )}

                {activeStep === 2 && (
                    <Stack spacing={3} sx={{ mt: 1, textAlign: 'center' }}>
                        <Typography variant="body1">
                            追蹤我們的 Instagram 官方帳號即可免費使用 LUMO！
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Instagram />}
                            onClick={() => {
                                window.open(IG_URL, '_blank');
                                setIgClicked(true);
                            }}
                            sx={{
                                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                                color: '#fff',
                                fontWeight: 'bold',
                                py: 1.5,
                                borderRadius: 3,
                                fontSize: '1rem',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #e6683c 0%, #dc2743 25%, #cc2366 50%, #bc1888 75%, #a01472 100%)',
                                }
                            }}
                        >
                            追蹤 @lumo_dailyfit
                        </Button>
                        {igClicked && (
                            <Alert severity="success" sx={{ borderRadius: 2 }}>
                                感謝追蹤！點擊下方按鈕完成設定
                            </Alert>
                        )}
                    </Stack>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                {activeStep > 0 && (
                    <Button onClick={() => setActiveStep(prev => prev - 1)} disabled={loading}>
                        上一步
                    </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!canProceed() || loading}
                    sx={{ borderRadius: 2, px: 4 }}
                >
                    {loading ? <CircularProgress size={24} /> : activeStep === 2 ? '完成' : '下一步'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
