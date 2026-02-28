'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser';

export default function InAppBrowserOverlay() {
    const [isInAppBrowser, setIsInAppBrowser] = useState<boolean | null>(null);

    useEffect(() => {
        const detectInAppBrowser = () => {
            const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
            // 檢測 Line, FB, IG 等應用程式內建瀏覽器
            const isLine = (/\bLine\b/i).test(ua);
            const isFB = (/\bFB[\w_]+\/(?:Messenger|Facebook)\b/i).test(ua) || (/\bFBAV\b/i).test(ua);
            const isIG = (/\bInstagram\b/i).test(ua);

            setIsInAppBrowser(isLine || isFB || isIG);
        };

        detectInAppBrowser();
    }, []);

    if (isInAppBrowser === null) {
        return null; // 還在檢測中
    }

    if (!isInAppBrowser) {
        return null; // 正常瀏覽器
    }

    // 當檢測出是在 In-App Browser 時，利用 fixed 蓋住全螢幕，逼迫使用者跳出
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                bgcolor: 'rgba(0, 0, 0, 0.95)',
                color: 'white',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 4,
                textAlign: 'center'
            }}
        >
            <Paper elevation={3} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', color: 'text.primary', maxWidth: 400 }}>
                <OpenInBrowserIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom color="error.main">
                    無法使用內建瀏覽器登入
                </Typography>
                <Typography variant="body1" paragraph>
                    LUMO 需要使用 Google 安全登入，但 LINE / IG / FB 的內建瀏覽器會阻擋登入流程。
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary.main" paragraph>
                    為了正常使用，請點擊右上角（或下方）的「⋮」選單，然後選擇：
                </Typography>
                <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                        「以預設瀏覽器開啟」
                        <br />
                        或「以 Safari 開啟」
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
