'use client';

import { useEffect } from 'react';

/**
 * 註冊 Service Worker 的 hook
 * 在生產環境中啟用 PWA 功能
 */
export function useServiceWorker() {
    useEffect(() => {
        // 確認瀏覽器支援 Service Worker
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        // 在 window load 後註冊，避免影響首次載入效能
        const registerSW = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                });

                console.log('Service Worker registered:', registration.scope);

                // 檢查更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 有新版本可用
                            console.log('New content available, refresh to update.');
                            // 可以在這裡觸發 UI 提示使用者更新
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        };

        // 等待頁面完全載入後再註冊
        if (document.readyState === 'complete') {
            registerSW();
        } else {
            window.addEventListener('load', registerSW);
            return () => window.removeEventListener('load', registerSW);
        }
    }, []);
}
