'use client';

import { useState } from 'react';
import { Stack, IconButton, Tooltip, Snackbar } from '@mui/material';
import { ContentCopy, Share as ShareIcon } from '@mui/icons-material';

const LINE_ICON = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.063-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
);

interface ShareButtonsProps {
    url: string;
    title: string;
    text: string;
}

export default function ShareButtons({ url, title, text }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const handleLineShare = () => {
        const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(lineUrl, '_blank', 'width=500,height=700');
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
            } catch {
                // 使用者取消分享
            }
        } else {
            handleCopyLink();
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
    };

    return (
        <>
            <Stack direction="row" spacing={1}>
                <Tooltip title="分享到 LINE">
                    <IconButton
                        onClick={handleLineShare}
                        sx={{
                            color: '#06C755',
                            '&:hover': { bgcolor: 'rgba(6,199,85,0.1)' }
                        }}
                    >
                        <LINE_ICON />
                    </IconButton>
                </Tooltip>
                <Tooltip title="分享">
                    <IconButton onClick={handleNativeShare} color="primary">
                        <ShareIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="複製連結">
                    <IconButton onClick={handleCopyLink} color="default">
                        <ContentCopy />
                    </IconButton>
                </Tooltip>
            </Stack>
            <Snackbar
                open={copied}
                autoHideDuration={2000}
                onClose={() => setCopied(false)}
                message="已複製連結！"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </>
    );
}
