'use client';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

const LIGHT_MOUNTAINS = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 400' preserveAspectRatio='none'%3E%3Cpath d='M0 280 Q200 120 400 200 T800 160 T1200 190 T1440 170 L1440 400 L0 400Z' fill='%23C4B0E0' opacity='0.55'/%3E%3Cpath d='M0 320 Q300 200 600 260 T1100 230 T1440 250 L1440 400 L0 400Z' fill='%23B49DD4' opacity='0.6'/%3E%3Cpath d='M0 360 Q250 280 500 320 T1000 300 T1440 330 L1440 400 L0 400Z' fill='%23A48BC8' opacity='0.65'/%3E%3C/svg%3E`;

const DARK_MOUNTAINS = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 400' preserveAspectRatio='none'%3E%3Cpath d='M0 280 Q200 120 400 200 T800 160 T1200 190 T1440 170 L1440 400 L0 400Z' fill='%231A1630' opacity='0.7'/%3E%3Cpath d='M0 320 Q300 200 600 260 T1100 230 T1440 250 L1440 400 L0 400Z' fill='%23161230' opacity='0.75'/%3E%3Cpath d='M0 355 Q250 280 500 320 T1000 300 T1440 335 L1440 400 L0 400Z' fill='%23120F28' opacity='0.8'/%3E%3C/svg%3E`;

export default function MountainBackground() {
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '45vh',
                zIndex: -1,
                pointerEvents: 'none',
                backgroundImage: `url("${isLight ? LIGHT_MOUNTAINS : DARK_MOUNTAINS}")`,
                backgroundSize: '100% 100%',
            }}
        />
    );
}
