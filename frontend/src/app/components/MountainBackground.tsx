'use client';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

/* ─── 淺色：薰衣草山脈 + 太陽 + 雲朵 ─── */
const LIGHT_MOUNTAINS = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 400' preserveAspectRatio='none'%3E%3Cpath d='M0 280 Q200 120 400 200 T800 160 T1200 190 T1440 170 L1440 400 L0 400Z' fill='%239B7FC7'/%3E%3Cpath d='M0 320 Q300 200 600 260 T1100 230 T1440 250 L1440 400 L0 400Z' fill='%23856BAF'/%3E%3Cpath d='M0 360 Q250 280 500 320 T1000 300 T1440 330 L1440 400 L0 400Z' fill='%237059A0'/%3E%3C/svg%3E`;

const LIGHT_SKY = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 500' preserveAspectRatio='none'%3E%3Ccircle cx='1150' cy='120' r='90' fill='%23F9E8A0' opacity='0.18'/%3E%3Ccircle cx='1150' cy='120' r='55' fill='%23F9E8A0' opacity='0.5'/%3E%3Ccircle cx='1150' cy='120' r='32' fill='%23FFF3B0' opacity='0.6'/%3E%3Cellipse cx='200' cy='180' rx='120' ry='36' fill='%23FFFFFF' opacity='0.5'/%3E%3Cellipse cx='290' cy='166' rx='85' ry='32' fill='%23FFFFFF' opacity='0.42'/%3E%3Cellipse cx='140' cy='196' rx='70' ry='25' fill='%23FFFFFF' opacity='0.35'/%3E%3Cellipse cx='750' cy='260' rx='130' ry='40' fill='%23FFFFFF' opacity='0.38'/%3E%3Cellipse cx='850' cy='245' rx='95' ry='34' fill='%23FFFFFF' opacity='0.3'/%3E%3Cellipse cx='480' cy='120' rx='100' ry='30' fill='%23FFFFFF' opacity='0.32'/%3E%3Cellipse cx='1300' cy='220' rx='110' ry='35' fill='%23FFFFFF' opacity='0.28'/%3E%3Cellipse cx='1380' cy='206' rx='70' ry='25' fill='%23FFFFFF' opacity='0.22'/%3E%3C/svg%3E`;

/* ─── 深色：星夜山脈 + 月牙 + 星星 ─── */
const DARK_MOUNTAINS = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 400' preserveAspectRatio='none'%3E%3Cpath d='M0 280 Q200 120 400 200 T800 160 T1200 190 T1440 170 L1440 400 L0 400Z' fill='%231A1630' opacity='0.7'/%3E%3Cpath d='M0 320 Q300 200 600 260 T1100 230 T1440 250 L1440 400 L0 400Z' fill='%23161230' opacity='0.75'/%3E%3Cpath d='M0 355 Q250 280 500 320 T1000 300 T1440 335 L1440 400 L0 400Z' fill='%23120F28' opacity='0.8'/%3E%3C/svg%3E`;

const DARK_SKY = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 600' preserveAspectRatio='none'%3E%3Ccircle cx='120' cy='50' r='1.5' fill='%23D0BCFF' opacity='0.6'/%3E%3Ccircle cx='280' cy='110' r='2' fill='%23E8DEF8' opacity='0.4'/%3E%3Ccircle cx='400' cy='35' r='1' fill='%23D0BCFF' opacity='0.5'/%3E%3Ccircle cx='550' cy='85' r='1.5' fill='%23E8DEF8' opacity='0.45'/%3E%3Ccircle cx='700' cy='25' r='2' fill='%23D0BCFF' opacity='0.5'/%3E%3Ccircle cx='850' cy='75' r='1' fill='%23E8DEF8' opacity='0.4'/%3E%3Ccircle cx='1000' cy='40' r='1.5' fill='%23D0BCFF' opacity='0.55'/%3E%3Ccircle cx='1280' cy='60' r='2' fill='%23E8DEF8' opacity='0.35'/%3E%3Ccircle cx='1380' cy='30' r='1' fill='%23D0BCFF' opacity='0.5'/%3E%3Ccircle cx='180' cy='200' r='1' fill='%23D0BCFF' opacity='0.35'/%3E%3Ccircle cx='350' cy='260' r='1.5' fill='%23E8DEF8' opacity='0.3'/%3E%3Ccircle cx='520' cy='180' r='2' fill='%23D0BCFF' opacity='0.4'/%3E%3Ccircle cx='680' cy='230' r='1' fill='%23E8DEF8' opacity='0.35'/%3E%3Ccircle cx='830' cy='170' r='1.5' fill='%23D0BCFF' opacity='0.3'/%3E%3Ccircle cx='1050' cy='220' r='1' fill='%23E8DEF8' opacity='0.4'/%3E%3Ccircle cx='1220' cy='190' r='2' fill='%23D0BCFF' opacity='0.3'/%3E%3Ccircle cx='1380' cy='150' r='1.5' fill='%23E8DEF8' opacity='0.35'/%3E%3Ccircle cx='250' cy='380' r='1' fill='%23D0BCFF' opacity='0.25'/%3E%3Ccircle cx='480' cy='340' r='1.5' fill='%23E8DEF8' opacity='0.2'/%3E%3Ccircle cx='650' cy='420' r='1' fill='%23D0BCFF' opacity='0.2'/%3E%3Ccircle cx='900' cy='360' r='1.5' fill='%23E8DEF8' opacity='0.18'/%3E%3Ccircle cx='1150' cy='500' r='1' fill='%23D0BCFF' opacity='0.15'/%3E%3Ccircle cx='1350' cy='440' r='1.5' fill='%23E8DEF8' opacity='0.2'/%3E%3Ccircle cx='80' cy='450' r='1' fill='%23D0BCFF' opacity='0.15'/%3E%3Ccircle cx='780' cy='480' r='1.5' fill='%23E8DEF8' opacity='0.12'/%3E%3Cpath d='M1150 68 A22 22 0 1 0 1150 112 A18 18 0 1 1 1150 68' fill='%23E8DEF8' opacity='0.25'/%3E%3C/svg%3E`;

export default function MountainBackground() {
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';

    return (
        <>
            {/* 上方裝飾：淺色=太陽+雲 / 深色=星星+月牙 */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: isLight ? '50vh' : '60vh',
                    zIndex: -1,
                    pointerEvents: 'none',
                    backgroundImage: `url("${isLight ? LIGHT_SKY : DARK_SKY}")`,
                    backgroundSize: '100% 100%',
                }}
            />
            {/* 下方山脈 */}
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
        </>
    );
}
