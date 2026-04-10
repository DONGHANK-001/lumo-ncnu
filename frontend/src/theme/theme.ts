'use client';

import { createTheme, Theme, PaletteMode } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
});

// 共用的基礎設定
const baseThemeOptions = {
    typography: {
        fontFamily: roboto.style.fontFamily,
        h1: {
            fontSize: '3.5rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '2.5rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
        },
        button: {
            textTransform: 'none' as const,
            fontWeight: 500,
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    padding: '10px 24px',
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 24,
                    backgroundImage: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: 'none',
                },
            },
        },
    },
};

// 深色模式調色盤 (M3 Dark)
const darkPalette = {
    mode: 'dark' as PaletteMode,
    primary: {
        main: '#D0BCFF',
        light: '#EADDFF',
        dark: '#4F378B',
        contrastText: '#381E72',
    },
    secondary: {
        main: '#CCC2DC',
        light: '#E8DEF8',
        dark: '#4A4458',
        contrastText: '#332D41',
    },
    background: {
        default: '#1E1A2E',
        paper: '#2B2640',
    },
    error: {
        main: '#F2B8B5',
        contrastText: '#601410',
    },
};

// 淺色模式調色盤 (M3 Light)
const lightPalette = {
    mode: 'light' as PaletteMode,
    primary: {
        main: '#6750A4',
        light: '#7F67BE',
        dark: '#4F378B',
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: '#625B71',
        light: '#7A7289',
        dark: '#4A4458',
        contrastText: '#FFFFFF',
    },
    background: {
        default: '#F6F2FF',
        paper: 'rgba(255, 255, 255, 0.82)',
    },
    text: {
        primary: '#1C1B1F',
        secondary: '#49454F',
    },
    error: {
        main: '#B3261E',
        contrastText: '#FFFFFF',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
};

/**
 * 根據模式創建主題
 */
export function createAppTheme(mode: PaletteMode): Theme {
    const palette = mode === 'dark' ? darkPalette : lightPalette;
    const isLight = mode === 'light';

    return createTheme({
        ...baseThemeOptions,
        palette,
        components: {
            ...baseThemeOptions.components,
            MuiCssBaseline: {
                styleOverrides: isLight
                    ? `
                        body {
                            min-height: 100vh;
                            background:
                                linear-gradient(180deg, #E8DEF8 0%, #F6F2FF 40%, #F6F2FF 100%);
                            background-attachment: fixed;
                        }
                        body::before {
                            content: '';
                            position: fixed;
                            top: 0; left: 0; right: 0;
                            height: 50vh;
                            z-index: -1;
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 500' preserveAspectRatio='none'%3E%3Ccircle cx='1150' cy='120' r='90' fill='%23F9E8A0' opacity='0.18'/%3E%3Ccircle cx='1150' cy='120' r='55' fill='%23F9E8A0' opacity='0.45'/%3E%3Cellipse cx='250' cy='200' rx='110' ry='35' fill='%23FFFFFF' opacity='0.45'/%3E%3Cellipse cx='330' cy='186' rx='80' ry='30' fill='%23FFFFFF' opacity='0.38'/%3E%3Cellipse cx='190' cy='215' rx='65' ry='24' fill='%23FFFFFF' opacity='0.32'/%3E%3Cellipse cx='800' cy='280' rx='120' ry='38' fill='%23FFFFFF' opacity='0.35'/%3E%3Cellipse cx='890' cy='266' rx='85' ry='32' fill='%23FFFFFF' opacity='0.28'/%3E%3Cellipse cx='520' cy='130' rx='90' ry='28' fill='%23FFFFFF' opacity='0.3'/%3E%3Cellipse cx='1300' cy='250' rx='100' ry='32' fill='%23FFFFFF' opacity='0.25'/%3E%3C/svg%3E");
                            background-size: 100% 100%;
                            pointer-events: none;
                        }
                        body::after {
                            content: '';
                            position: fixed;
                            bottom: 0; left: 0; right: 0;
                            height: 45vh;
                            z-index: -1;
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 400' preserveAspectRatio='none'%3E%3Cpath d='M0 280 Q200 120 400 200 T800 160 T1200 190 T1440 170 L1440 400 L0 400Z' fill='%23C4B0E0' opacity='0.5'/%3E%3Cpath d='M0 320 Q300 200 600 260 T1100 230 T1440 250 L1440 400 L0 400Z' fill='%23B39DDB' opacity='0.55'/%3E%3Cpath d='M0 360 Q250 280 500 320 T1000 300 T1440 330 L1440 400 L0 400Z' fill='%239C8AC2' opacity='0.5'/%3E%3C/svg%3E");
                            background-size: 100% 100%;
                            pointer-events: none;
                        }
                    `
                    : `
                        body {
                            min-height: 100vh;
                            background:
                                linear-gradient(180deg, #110E1F 0%, #1E1A2E 35%, #2B2640 100%);
                            background-attachment: fixed;
                        }
                        body::before {
                            content: '';
                            position: fixed;
                            top: 0; left: 0; right: 0;
                            height: 60vh;
                            z-index: -1;
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 600' preserveAspectRatio='none'%3E%3Ccircle cx='120' cy='50' r='1.5' fill='%23D0BCFF' opacity='0.6'/%3E%3Ccircle cx='280' cy='110' r='2' fill='%23E8DEF8' opacity='0.4'/%3E%3Ccircle cx='400' cy='35' r='1' fill='%23D0BCFF' opacity='0.5'/%3E%3Ccircle cx='550' cy='85' r='1.5' fill='%23E8DEF8' opacity='0.45'/%3E%3Ccircle cx='700' cy='25' r='2' fill='%23D0BCFF' opacity='0.5'/%3E%3Ccircle cx='850' cy='75' r='1' fill='%23E8DEF8' opacity='0.4'/%3E%3Ccircle cx='1000' cy='40' r='1.5' fill='%23D0BCFF' opacity='0.55'/%3E%3Ccircle cx='1280' cy='60' r='2' fill='%23E8DEF8' opacity='0.35'/%3E%3Ccircle cx='1380' cy='30' r='1' fill='%23D0BCFF' opacity='0.5'/%3E%3Ccircle cx='180' cy='200' r='1' fill='%23D0BCFF' opacity='0.35'/%3E%3Ccircle cx='350' cy='260' r='1.5' fill='%23E8DEF8' opacity='0.3'/%3E%3Ccircle cx='520' cy='180' r='2' fill='%23D0BCFF' opacity='0.4'/%3E%3Ccircle cx='680' cy='230' r='1' fill='%23E8DEF8' opacity='0.35'/%3E%3Ccircle cx='830' cy='170' r='1.5' fill='%23D0BCFF' opacity='0.3'/%3E%3Ccircle cx='1050' cy='220' r='1' fill='%23E8DEF8' opacity='0.4'/%3E%3Ccircle cx='1220' cy='190' r='2' fill='%23D0BCFF' opacity='0.3'/%3E%3Ccircle cx='1380' cy='150' r='1.5' fill='%23E8DEF8' opacity='0.35'/%3E%3Ccircle cx='250' cy='380' r='1' fill='%23D0BCFF' opacity='0.25'/%3E%3Ccircle cx='480' cy='340' r='1.5' fill='%23E8DEF8' opacity='0.2'/%3E%3Ccircle cx='650' cy='420' r='1' fill='%23D0BCFF' opacity='0.2'/%3E%3Ccircle cx='900' cy='360' r='1.5' fill='%23E8DEF8' opacity='0.18'/%3E%3Ccircle cx='1150' cy='500' r='1' fill='%23D0BCFF' opacity='0.15'/%3E%3Ccircle cx='1350' cy='440' r='1.5' fill='%23E8DEF8' opacity='0.2'/%3E%3Ccircle cx='80' cy='550' r='1' fill='%23D0BCFF' opacity='0.15'/%3E%3Ccircle cx='780' cy='480' r='1.5' fill='%23E8DEF8' opacity='0.12'/%3E%3Cpath d='M1150 68 A22 22 0 1 0 1150 112 A18 18 0 1 1 1150 68' fill='%23E8DEF8' opacity='0.25'/%3E%3C/svg%3E");
                            background-size: 100% 100%;
                            pointer-events: none;
                        }
                        body::after {
                            content: '';
                            position: fixed;
                            bottom: 0; left: 0; right: 0;
                            height: 45vh;
                            z-index: -1;
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 400' preserveAspectRatio='none'%3E%3Cpath d='M0 280 Q200 120 400 200 T800 160 T1200 190 T1440 170 L1440 400 L0 400Z' fill='%231A1630' opacity='0.7'/%3E%3Cpath d='M0 320 Q300 200 600 260 T1100 230 T1440 250 L1440 400 L0 400Z' fill='%23161230' opacity='0.75'/%3E%3Cpath d='M0 355 Q250 280 500 320 T1000 300 T1440 335 L1440 400 L0 400Z' fill='%23120F28' opacity='0.8'/%3E%3C/svg%3E");
                            background-size: 100% 100%;
                            pointer-events: none;
                        }
                    `,
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 24,
                        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(43, 38, 64, 0.75)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        ...(isLight
                            ? {
                                boxShadow: '0 2px 12px rgba(103,80,164,0.08)',
                                border: '1px solid rgba(255,255,255,0.6)',
                            }
                            : {
                                boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                                border: '1px solid rgba(208,188,255,0.08)',
                            }
                        ),
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(43, 38, 64, 0.75)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        boxShadow: isLight
                            ? '0 2px 12px rgba(103,80,164,0.08)'
                            : '0 2px 12px rgba(0,0,0,0.25)',
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backgroundColor: isLight ? 'rgba(246, 242, 255, 0.8)' : 'rgba(30, 26, 46, 0.8)',
                        boxShadow: 'none',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderBottom: isLight
                            ? '1px solid rgba(255,255,255,0.4)'
                            : '1px solid rgba(208,188,255,0.06)',
                    },
                },
            },
            MuiTableHead: {
                styleOverrides: {
                    root: {
                        ...(isLight && {
                            '& .MuiTableCell-head': {
                                backgroundColor: '#EDE8F5',
                                fontWeight: 600,
                                color: '#1C1B1F',
                            },
                        }),
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        ...(isLight && {
                            borderBottomColor: 'rgba(0,0,0,0.06)',
                        }),
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        ...(isLight && {
                            borderColor: 'rgba(0,0,0,0.12)',
                        }),
                    },
                    filled: {
                        ...(isLight && {
                            backgroundColor: '#EDE8F5',
                            color: '#1C1B1F',
                        }),
                    },
                },
            },
            MuiAccordion: {
                styleOverrides: {
                    root: {
                        ...(isLight && {
                            border: '1px solid rgba(0,0,0,0.06)',
                            '&:before': { display: 'none' },
                        }),
                    },
                },
            },
            MuiFab: {
                styleOverrides: {
                    root: {
                        ...(isLight && {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }),
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        ...(isLight && {
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        }),
                    },
                },
            },
        },
    });
}

// 預設深色主題 (向後兼容)
const theme = createAppTheme('dark');
export default theme;
