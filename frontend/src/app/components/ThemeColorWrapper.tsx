'use client';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { ReactNode } from 'react';

export default function ThemeColorWrapper({ children }: { children: ReactNode }) {
    const theme = useTheme();

    return (
        <Box sx={{ color: theme.palette.text.primary, minHeight: '100vh' }}>
            {children}
        </Box>
    );
}
