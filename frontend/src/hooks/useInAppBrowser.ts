'use client';

import { useState, useEffect } from 'react';

export function useInAppBrowser() {
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);

    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

        // 偵測常見的 In-App Browser (LINE, Instagram, Facebook)
        const inAppRegex = /Line|Instagram|FBAN|FBAV/i;

        if (inAppRegex.test(userAgent)) {
            setIsInAppBrowser(true);
        }
    }, []);

    return isInAppBrowser;
}
