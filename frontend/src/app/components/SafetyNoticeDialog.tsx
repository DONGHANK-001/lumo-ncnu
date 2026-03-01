'use client';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Stack,
    Box,
    Divider
} from '@mui/material';
import { Warning, Security, LocalHospital, Gavel } from '@mui/icons-material';

interface SafetyNoticeDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function SafetyNoticeDialog({ open, onConfirm, onCancel }: SafetyNoticeDialogProps) {
    return (
        <Dialog open={open} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', pt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Security color="warning" />
                揪團與安全須知
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Warning color="error" sx={{ mt: 0.3 }} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                場地不保證提醒
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                透過本平台進行的揪團，僅代表成員間的約定，<Typography component="span" fontWeight="bold" color="error.main">並不保證實際會有足夠的現成場地可供使用</Typography>。請務必在出發前，與其他參與者或場地管理方互相確認場地狀況，以避免撲空。
                            </Typography>
                        </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <LocalHospital color="info" sx={{ mt: 0.3 }} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                健康狀況評估
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                如您有心血管疾病、氣喘、高血壓或其他慢性疾病，請事先諮詢醫師是否適合參與該項運動。如感到身體不適，請立即停止活動。
                            </Typography>
                        </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Security color="success" sx={{ mt: 0.3 }} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                人身安全
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                請選擇安全的運動場地，注意天候變化。活動期間請注意自身與他人安全。如遇緊急狀況，請撥打 119 求助或聯繫學校保健中心。
                            </Typography>
                        </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Gavel color="warning" sx={{ mt: 0.3 }} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                責任歸屬
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                本平台僅提供揪團媒合服務，不負責活動之組織與監督。使用者間因活動產生之任何糾紛、傷害或財物損失，由當事人自行處理。
                            </Typography>
                        </Box>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button onClick={onCancel} color="inherit">
                    取消
                </Button>
                <Button variant="contained" onClick={onConfirm} sx={{ borderRadius: 2, px: 4 }}>
                    我已了解，繼續
                </Button>
            </DialogActions>
        </Dialog>
    );
}
