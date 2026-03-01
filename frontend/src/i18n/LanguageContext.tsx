'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from './translations';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('zh');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('lumo_language') as Language;
        if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
            setLanguage(savedLang);
        } else {
            // Check browser language
            const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
            setLanguage(browserLang);
        }
        setMounted(true);
    }, []);

    const toggleLanguage = () => {
        setLanguage((prev) => {
            const nextLang = prev === 'zh' ? 'en' : 'zh';
            localStorage.setItem('lumo_language', nextLang);
            return nextLang;
        });
    };

    const handleSetLanguage = (lang: Language) => {
        localStorage.setItem('lumo_language', lang);
        setLanguage(lang);
    };

    const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
        let text = translations[language][key] || translations['zh'][key] || key;

        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, String(v));
            });
        }

        return text;
    };

    // prevent hydration mismatch issues by rendering children but using default 'zh'
    // The language will update to localStorage value upon client mount via useEffect.

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
