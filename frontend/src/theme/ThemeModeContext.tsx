'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { PaletteMode } from '@mui/material';

interface ThemeModeContextType {
    mode: PaletteMode;
    toggleMode: () => void;
    setMode: (mode: PaletteMode) => void;
    mounted: boolean;
}

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined);

const STORAGE_KEY = 'lumo-theme-mode';

/**
 * 取得系統偏好的主題模式
 */
function getSystemPreference(): PaletteMode {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 取得儲存的主題模式或系統偏好
 */
function getStoredMode(): PaletteMode {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }
    return getSystemPreference();
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<PaletteMode>('dark');
    const [mounted, setMounted] = useState(false);

    // 初始化時讀取儲存的設定
    useEffect(() => {
        setModeState(getStoredMode());
        setMounted(true);
    }, []);

    // 切換模式
    const toggleMode = () => {
        const newMode = mode === 'dark' ? 'light' : 'dark';
        setModeState(newMode);
        localStorage.setItem(STORAGE_KEY, newMode);
    };

    // 設定特定模式
    const setMode = (newMode: PaletteMode) => {
        setModeState(newMode);
        localStorage.setItem(STORAGE_KEY, newMode);
    };

    const value = useMemo(() => ({ mode, toggleMode, setMode, mounted }), [mode, mounted]);

    // 不再返回 null，讓頁面正常渲染，切換按鈕會在 mounted 後顯示
    return (
        <ThemeModeContext.Provider value={value}>
            {children}
        </ThemeModeContext.Provider>
    );
}

export function useThemeMode() {
    const context = useContext(ThemeModeContext);
    if (context === undefined) {
        throw new Error('useThemeMode must be used within a ThemeModeProvider');
    }
    return context;
}
