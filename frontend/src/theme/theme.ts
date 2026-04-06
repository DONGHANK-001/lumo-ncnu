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
        paper: '#FFFFFF',
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
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 24,
                        backgroundColor: isLight ? '#FFFFFF' : '#2B2640',
                        backgroundImage: 'none',
                        ...(isLight && {
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(0,0,0,0.06)',
                        }),
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        ...(isLight && {
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                        }),
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backgroundColor: isLight ? '#F6F2FF' : '#1E1A2E',
                        boxShadow: 'none',
                        ...(isLight && {
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                        }),
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
