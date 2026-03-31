'use client';

import { useEffect, useRef, useState } from 'react';

const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISSED_AT_KEY = 'lumo_pwa_install_dismissed_at';
const INSTALLED_KEY = 'lumo_pwa_install_installed';

const MOBILE_BROWSER_PATTERN = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const ANDROID_PATTERN = /Android/i;
const IOS_PATTERN = /iPhone|iPad|iPod/i;
const NON_SAFARI_IOS_PATTERN = /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|DuckDuckGo/i;
const SAFARI_PATTERN = /Safari/i;
const IN_APP_BROWSER_PATTERN = /\bLine\b|\bInstagram\b|\bFBAV\b|\bFBAN\b/i;

export type PwaInstallPlatform = 'android' | 'ios';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
}

function isStandaloneMode() {
    const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const displayModeFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    return displayModeStandalone || displayModeFullscreen || iosStandalone;
}

function getUserAgent() {
    return navigator.userAgent || navigator.vendor || '';
}

function wasDismissedRecently() {
    const dismissedAt = Number(window.localStorage.getItem(DISMISSED_AT_KEY) || '0');

    return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

function rememberDismissal() {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
}

function markInstalled() {
    window.localStorage.setItem(INSTALLED_KEY, '1');
}

export function usePwaInstallPrompt() {
    const [open, setOpen] = useState(false);
    const [platform, setPlatform] = useState<PwaInstallPlatform | null>(null);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const canShowPromptRef = useRef(true);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const ua = getUserAgent();
        const isMobileBrowser = MOBILE_BROWSER_PATTERN.test(ua);
        const isAndroid = ANDROID_PATTERN.test(ua);
        const isIOS = IOS_PATTERN.test(ua);
        const isIOSSafari = isIOS && SAFARI_PATTERN.test(ua) && !NON_SAFARI_IOS_PATTERN.test(ua);
        const isInAppBrowser = IN_APP_BROWSER_PATTERN.test(ua);

        if (window.localStorage.getItem(INSTALLED_KEY) === '1') {
            canShowPromptRef.current = false;
            return;
        }

        if (isStandaloneMode()) {
            markInstalled();
            canShowPromptRef.current = false;
            return;
        }

        if (!isMobileBrowser || isInAppBrowser || (!isAndroid && !isIOSSafari) || wasDismissedRecently()) {
            canShowPromptRef.current = false;
            return;
        }

        const nextPlatform: PwaInstallPlatform = isAndroid ? 'android' : 'ios';
        setPlatform(nextPlatform);

        const timer = window.setTimeout(() => {
            if (canShowPromptRef.current) {
                setOpen(true);
            }
        }, 900);

        const handleBeforeInstallPrompt = (event: Event) => {
            if (!canShowPromptRef.current || isStandaloneMode()) {
                return;
            }

            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
            setPlatform('android');
            setOpen(true);
        };

        const handleAppInstalled = () => {
            markInstalled();
            canShowPromptRef.current = false;
            setDeferredPrompt(null);
            setOpen(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const dismiss = () => {
        if (typeof window !== 'undefined') {
            rememberDismissal();
        }

        canShowPromptRef.current = false;
        setOpen(false);
    };

    const install = async () => {
        if (!deferredPrompt) {
            dismiss();
            return false;
        }

        let accepted = false;

        try {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            accepted = choice.outcome === 'accepted';
        } finally {
            if (typeof window !== 'undefined') {
                rememberDismissal();
            }

            canShowPromptRef.current = false;
            setDeferredPrompt(null);
            setOpen(false);
        }

        return accepted;
    };

    return {
        open,
        platform,
        canInstall: Boolean(deferredPrompt),
        dismiss,
        install,
    };
}
