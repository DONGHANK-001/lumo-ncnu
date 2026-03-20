import { Tooltip, Box } from '@mui/material';
import React from 'react';
import { isTrialPeriod } from '@/lib/trial-period';

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
