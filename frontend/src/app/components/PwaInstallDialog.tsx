'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    AddToHomeScreen,
    BoltRounded,
    CheckCircleOutline,
    DownloadForOffline,
    IosShare,
    MoreVert,
    PhoneIphone,
    RocketLaunchRounded,
} from '@mui/icons-material';
import type { PwaInstallPlatform } from '@/hooks/usePwaInstallPrompt';

interface PwaInstallDialogProps {
    open: boolean;
    platform: PwaInstallPlatform | null;
    canInstall: boolean;
    onClose: () => void;
    onInstall: () => Promise<boolean>;
}

export default function PwaInstallDialog({
    open,
    platform,
    canInstall,
    onClose,
    onInstall,
}: PwaInstallDialogProps) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [installing, setInstalling] = useState(false);

    if (!platform) {
        return null;
    }

    const isAndroid = platform === 'android';
    const title = isAndroid ? '把 LUMO 放進你的主畫面' : '把 LUMO 加到 iPhone 主畫面';
    const description = isAndroid
        ? '開團、找人、看通知都能更快進來，體驗會更像真正的 App。'
        : 'Safari 可以把 LUMO 存到主畫面，之後打開速度更快，也不用每次重新找網址。';

    const steps = isAndroid
        ? [
            {
                icon: <MoreVert fontSize="small" />,
                title: '點右上角選單',
                description: '找到瀏覽器右上角的三個點或更多選項。',
            },
            {
                icon: <DownloadForOffline fontSize="small" />,
                title: canInstall ? '直接按下方立即安裝' : '選擇安裝應用程式',
                description: canInstall ? '這台裝置支援直接彈出安裝視窗。' : '有些瀏覽器會顯示「加入主畫面」。',
            },
            {
                icon: <CheckCircleOutline fontSize="small" />,
                title: '完成後從桌面直接開啟',
                description: '之後就能像使用一般 App 一樣快速進入 LUMO。',
            },
        ]
        : [
            {
                icon: <IosShare fontSize="small" />,
                title: '點 Safari 分享按鈕',
                description: '通常是下方中間的方框加向上箭頭。',
            },
            {
                icon: <AddToHomeScreen fontSize="small" />,
                title: '選擇加入主畫面',
                description: '往下滑分享選單，就可以看到這個選項。',
            },
            {
                icon: <CheckCircleOutline fontSize="small" />,
                title: '按新增完成',
                description: '之後可以直接從主畫面打開 LUMO。',
            },
        ];

    const quickBenefits = [
        {
            icon: <RocketLaunchRounded fontSize="small" />,
            title: '更快進站',
            description: '少一步找網址',
        },
        {
            icon: <BoltRounded fontSize="small" />,
            title: '像 App 一樣',
            description: '桌面一點就開',
        },
    ];

    const primaryLabel = canInstall ? '立即安裝' : isAndroid ? '我知道了' : '我知道怎麼加了';

    const handlePrimaryClick = async () => {
        setInstalling(true);

        try {
            await onInstall();
        } finally {
            setInstalling(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            fullWidth
            maxWidth="sm"
            slotProps={{
                backdrop: {
                    sx: {
                        backdropFilter: 'blur(8px)',
                        backgroundColor: alpha(theme.palette.common.black, 0.42),
                    },
                },
                paper: {
                    sx: {
                        color: 'text.primary',
                        backgroundColor: 'background.paper',
                        backgroundImage: `
                            radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.2)}, transparent 34%),
                            radial-gradient(circle at bottom left, ${alpha(theme.palette.warning.main, 0.16)}, transparent 30%),
                            linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)
                        `,
                        borderRadius: fullScreen ? 0 : 5,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                        boxShadow:
                            theme.palette.mode === 'dark'
                                ? '0 28px 80px rgba(0, 0, 0, 0.42)'
                                : '0 24px 70px rgba(103, 80, 164, 0.18)',
                        overflow: 'hidden',
                    },
                },
            }}
        >
            <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Stack spacing={3}>
                    <Box
                        sx={{
                            p: { xs: 2.5, sm: 3 },
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                sx={{
                                    width: 68,
                                    height: 68,
                                    borderRadius: 3,
                                    display: 'grid',
                                    placeItems: 'center',
                                    bgcolor: theme.palette.primary.main,
                                    color: theme.palette.primary.contrastText,
                                    flexShrink: 0,
                                    boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.28)}`,
                                }}
                            >
                                {isAndroid ? <DownloadForOffline sx={{ fontSize: 34 }} /> : <PhoneIphone sx={{ fontSize: 34 }} />}
                            </Box>

                            <Box sx={{ minWidth: 0 }}>
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        px: 1.25,
                                        py: 0.5,
                                        borderRadius: 999,
                                        mb: 1,
                                        bgcolor: alpha(theme.palette.secondary.main, 0.16),
                                        color: 'text.secondary',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    LUMO 快速啟動
                                </Box>
                                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                                    {title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.75 }}>
                                    {description}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    <Stack direction="row" spacing={1.25}>
                        {quickBenefits.map((benefit) => (
                            <Box
                                key={benefit.title}
                                sx={{
                                    flex: 1,
                                    minWidth: 0,
                                    p: 1.75,
                                    borderRadius: 3,
                                    bgcolor: alpha(theme.palette.background.default, 0.64),
                                    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                    <Box sx={{ color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                                        {benefit.icon}
                                    </Box>
                                    <Typography variant="subtitle2" fontWeight={800}>
                                        {benefit.title}
                                    </Typography>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                    {benefit.description}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>

                    <Stack spacing={1.25}>
                        {steps.map((step, index) => (
                            <Box
                                key={step.title}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: alpha(theme.palette.common.white, theme.palette.mode === 'dark' ? 0.03 : 0.58),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                                }}
                            >
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box
                                        sx={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: '50%',
                                            display: 'grid',
                                            placeItems: 'center',
                                            flexShrink: 0,
                                            bgcolor: 'primary.main',
                                            color: 'primary.contrastText',
                                            fontWeight: 800,
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        {index + 1}
                                    </Box>

                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box sx={{ color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                                                {step.icon}
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight={800}>
                                                {step.title}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
                                            {step.description}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>

                    <Box
                        sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.info.main, 0.08),
                            border: `1px solid ${alpha(theme.palette.info.main, 0.14)}`,
                        }}
                    >
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            這個提示只會在適合安裝的手機瀏覽器出現。安裝完成後，LUMO 就不會再重複提醒你。
                        </Typography>
                    </Box>

                    <Stack spacing={1.25}>
                        <Button
                            onClick={handlePrimaryClick}
                            variant="contained"
                            size="large"
                            disabled={installing}
                            sx={{
                                py: 1.45,
                                borderRadius: 999,
                                fontSize: '1.02rem',
                                fontWeight: 800,
                            }}
                        >
                            {installing ? '處理中...' : primaryLabel}
                        </Button>

                        <Button
                            onClick={onClose}
                            variant="outlined"
                            size="large"
                            sx={{
                                py: 1.35,
                                borderRadius: 999,
                                fontWeight: 700,
                                borderColor: alpha(theme.palette.text.primary, 0.18),
                            }}
                        >
                            稍後再說
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
