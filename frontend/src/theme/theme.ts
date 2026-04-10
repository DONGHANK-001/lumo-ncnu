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
                            bottom: 0;
                            left: 0;
                            right: 0;
                            height: 45vh;
                            z-index: -1;
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 400' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='sky' x1='0.5' y1='0' x2='0.5' y2='1'%3E%3Cstop offset='0%25' stop-color='%23E8DEF8'/%3E%3Cstop offset='100%25' stop-color='%23F6F2FF'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='1100' cy='80' r='60' fill='%23F9E8A0' opacity='0.5'/%3E%3Cpath d='M0 280 Q200 120 400 200 T800 160 T1200 190 T1440 170 L1440 400 L0 400Z' fill='%23C4B0E0' opacity='0.5'/%3E%3Cpath d='M0 320 Q300 200 600 260 T1100 230 T1440 250 L1440 400 L0 400Z' fill='%23B39DDB' opacity='0.55'/%3E%3Cpath d='M0 360 Q250 280 500 320 T1000 300 T1440 330 L1440 400 L0 400Z' fill='%239C8AC2' opacity='0.5'/%3E%3C/svg%3E");
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
                            bottom: 0;
                            left: 0;
                            right: 0;
                            height: 45vh;
                            z-index: -1;
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 400' preserveAspectRatio='none'%3E%3Ccircle cx='200' cy='40' r='2' fill='%23D0BCFF' opacity='0.6'/%3E%3Ccircle cx='350' cy='70' r='1.5' fill='%23D0BCFF' opacity='0.4'/%3E%3Ccircle cx='500' cy='25' r='1' fill='%23E8DEF8' opacity='0.5'/%3E%3Ccircle cx='680' cy='60' r='2' fill='%23D0BCFF' opacity='0.5'/%3E%3Ccircle cx='820' cy='15' r='1.5' fill='%23E8DEF8' opacity='0.4'/%3E%3Ccircle cx='950' cy='50' r='1' fill='%23D0BCFF' opacity='0.6'/%3E%3Ccircle cx='1100' cy='35' r='2' fill='%23E8DEF8' opacity='0.35'/%3E%3Ccircle cx='1250' cy='65' r='1.5' fill='%23D0BCFF' opacity='0.5'/%3E%3Ccircle cx='100' cy='85' r='1' fill='%23D0BCFF' opacity='0.35'/%3E%3Ccircle cx='1350' cy='20' r='1' fill='%23E8DEF8' opacity='0.45'/%3E%3Ccircle cx='600' cy='90' r='1.5' fill='%23D0BCFF' opacity='0.3'/%3E%3Ccircle cx='750' cy='10' r='1' fill='%23E8DEF8' opacity='0.5'/%3E%3Cpath d='M1070 75 A25 25 0 1 1 1070 74.99' fill='none' stroke='%23E8DEF8' stroke-width='1.5' opacity='0.35'/%3E%3Cpath d='M1075 75 A20 20 0 0 1 1055 55' fill='%23E8DEF8' opacity='0.12'/%3E%3Cpath d='M0 280 Q200 140 400 210 T800 170 T1200 200 T1440 180 L1440 400 L0 400Z' fill='%231A1630' opacity='0.7'/%3E%3Cpath d='M0 320 Q300 210 600 270 T1100 240 T1440 260 L1440 400 L0 400Z' fill='%23161230' opacity='0.75'/%3E%3Cpath d='M0 355 Q250 290 500 325 T1000 305 T1440 335 L1440 400 L0 400Z' fill='%23120F28' opacity='0.8'/%3E%3C/svg%3E");
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
