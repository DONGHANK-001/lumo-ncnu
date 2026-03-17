import { Tooltip, Box } from '@mui/material';
import React from 'react';

// PLUS 方案的皇冠小圖示
export default function CrownBadge({ isPlus, size = '1.2rem' }: { isPlus: boolean; size?: string | number }) {
    if (!isTrialPeriod() && !isPlus) return null;

    return (
        <Tooltip title={isTrialPeriod() ? "創始會員體驗期" : "LUMO PLUS"}>
            <Box
                component="span"
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size,
                    lineHeight: 1,
                    ml: 0.5,
                    verticalAlign: 'middle',
                    userSelect: 'none',
                    filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.2))',
                }}
            >
                👑
            </Box>
        </Tooltip>
    );
}

// 可選：匯出一個 helper 檢查目前是否為試用期
export function isTrialPeriod() {
    return new Date() < new Date('2026-04-01T00:00:00+08:00');
}
