'use client';

import { useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

/**
 * 預先喚醒後端 (Render 冷啟動優化)
 * 在頁面載入時立即 ping /health，讓後端開始喚醒
 */
export function useWakeupBackend() {
    useEffect(() => {
        // 立即發送喚醒請求，不等待結果
        fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            mode: 'cors',
        }).catch(() => {
            // 忽略錯誤，只是喚醒用
        });
    }, []);
}
