'use client';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

function LightDecorations() {
    return (
        <>
            {/* 太陽光暈 — 置中偏上，手機可見 */}
            <circle cx="720" cy="130" r="120" fill="#F5E6A0" opacity="0.15" />
            <circle cx="720" cy="130" r="75" fill="#F5E6A0" opacity="0.25" />
            <circle cx="720" cy="130" r="45" fill="#FFF8DC" opacity="0.4" />
            {/* 雲霧 */}
            <ellipse cx="680" cy="320" rx="150" ry="28" fill="#fff" opacity="0.3" />
            <ellipse cx="790" cy="305" rx="110" ry="24" fill="#fff" opacity="0.22" />
            <ellipse cx="1150" cy="380" rx="130" ry="22" fill="#fff" opacity="0.2" />
            <ellipse cx="180" cy="420" rx="110" ry="20" fill="#fff" opacity="0.18" />
        </>
    );
}

function LightMountains() {
    return (
        <>
            {/* 山間薄霧 */}
            <ellipse cx="720" cy="640" rx="500" ry="25" fill="#fff" opacity="0.12" />
            <ellipse cx="350" cy="720" rx="350" ry="20" fill="#fff" opacity="0.1" />
            {/* 山脈四層 — 後到前，由淺到深 */}
            <path d="M0 520 Q200 320 450 430 T900 360 T1300 400 T1440 380 L1440 900 L0 900Z" fill="#DDD0F0" />
            <path d="M0 600 Q300 440 600 520 T1100 470 T1440 500 L1440 900 L0 900Z" fill="#CDBDE5" />
            <path d="M0 680 Q250 560 500 630 T1000 590 T1440 630 L1440 900 L0 900Z" fill="#BFADDB" />
            <path d="M0 760 Q300 690 600 730 T1100 710 T1440 740 L1440 900 L0 900Z" fill="#B09ED0" />
        </>
    );
}

function DarkDecorations() {
    return (
        <>
            {/* 月牙 — 置中偏右上，手機可見 */}
            <circle cx="780" cy="100" r="50" fill="#E8DEF8" opacity="0.18" />
            <circle cx="800" cy="90" r="42" fill="#110E1F" />
            {/* 星星 — 上層 */}
            <circle cx="100" cy="60" r="4" fill="#D0BCFF" opacity="0.7" />
            <circle cx="260" cy="130" r="5" fill="#E8DEF8" opacity="0.6" />
            <circle cx="420" cy="50" r="3.5" fill="#D0BCFF" opacity="0.65" />
            <circle cx="580" cy="110" r="4" fill="#E8DEF8" opacity="0.55" />
            <circle cx="720" cy="40" r="5.5" fill="#D0BCFF" opacity="0.6" />
            <circle cx="880" cy="90" r="3.5" fill="#E8DEF8" opacity="0.5" />
            <circle cx="1020" cy="60" r="4" fill="#D0BCFF" opacity="0.6" />
            <circle cx="1350" cy="80" r="5" fill="#E8DEF8" opacity="0.55" />
            {/* 星星 — 中層 */}
            <circle cx="160" cy="260" r="3" fill="#D0BCFF" opacity="0.4" />
            <circle cx="460" cy="230" r="4" fill="#E8DEF8" opacity="0.35" />
            <circle cx="740" cy="290" r="3" fill="#D0BCFF" opacity="0.3" />
            <circle cx="1060" cy="260" r="3.5" fill="#E8DEF8" opacity="0.35" />
            <circle cx="1300" cy="220" r="3" fill="#D0BCFF" opacity="0.3" />
            <circle cx="340" cy="340" r="2.5" fill="#E8DEF8" opacity="0.25" />
            <circle cx="920" cy="370" r="3" fill="#D0BCFF" opacity="0.2" />
        </>
    );
}

function DarkMountains() {
    return (
        <>
            <path d="M0 520 Q200 320 450 430 T900 360 T1300 400 T1440 380 L1440 900 L0 900Z" fill="#1E1A40" opacity="0.45" />
            <path d="M0 600 Q300 440 600 520 T1100 470 T1440 500 L1440 900 L0 900Z" fill="#1A1630" opacity="0.55" />
            <path d="M0 680 Q250 560 500 630 T1000 590 T1440 630 L1440 900 L0 900Z" fill="#151230" opacity="0.65" />
            <path d="M0 760 Q300 690 600 730 T1100 710 T1440 740 L1440 900 L0 900Z" fill="#100E28" opacity="0.75" />
        </>
    );
}

export default function MountainBackground() {
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                pointerEvents: 'none',
                overflow: 'hidden',
                background: isLight
                    ? 'linear-gradient(180deg, #F3EEFF 0%, #F6F2FF 30%, #F6F2FF 100%)'
                    : 'linear-gradient(180deg, #110E1F 0%, #1E1A2E 35%, #2B2640 100%)',
            }}
        >
            {/* Decorations layer: preserves aspect ratio so circles stay round */}
            <svg
                viewBox="0 0 1440 900"
                preserveAspectRatio="xMidYMid slice"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
                {isLight ? <LightDecorations /> : <DarkDecorations />}
            </svg>
            {/* Mountains layer: stretches to fill viewport width */}
            <svg
                viewBox="0 0 1440 900"
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
                {isLight ? <LightMountains /> : <DarkMountains />}
            </svg>
        </Box>
    );
}
