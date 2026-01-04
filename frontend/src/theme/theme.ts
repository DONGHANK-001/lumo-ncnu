'use client';

import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
});

// Lumo Brand Colors (Deep Violet / Indigo)
// M3 relies on tonal palettes. We define a primary color and let MUI handle some generation,
// but for a strict M3 look we customize palette heavily.

const theme = createTheme({
    palette: {
        mode: 'dark', // Default to dark mode for that premium feel
        primary: {
            main: '#D0BCFF', // M3 Dark Primary (Light Purple)
            light: '#EADDFF',
            dark: '#4F378B',
            contrastText: '#381E72',
        },
        secondary: {
            main: '#CCC2DC', // M3 Dark Secondary
            light: '#E8DEF8',
            dark: '#4A4458',
            contrastText: '#332D41',
        },
        background: {
            default: '#141218', // M3 Dark Background
            paper: '#1D1B20', // M3 Dark Surface
        },
        error: {
            main: '#F2B8B5',
            contrastText: '#601410',
        },
        // Custom M3 Surface Containers if needed
    },
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
            textTransform: 'none', // M3 buttons are sentence case usually
            fontWeight: 500,
        },
    },
    shape: {
        borderRadius: 16, // M3 uses larger border radius
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 20, // Pill shape
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
                    borderRadius: 24, // M3 Card Radius
                    // M3 Elevated Card
                    backgroundColor: '#1D1B20',
                    backgroundImage: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Disable default overlay in dark mode to control it manually
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#141218', // Match background
                    boxShadow: 'none',
                }
            }
        }
    },
});

export default theme;
