import { prisma } from './prisma.js';

/**
 * 清理過期揪團
 * 將時間已過且狀態為 OPEN/FULL 的揪團標記為 COMPLETED
 */
export async function cleanupExpiredGroups(): Promise<number> {
    const now = new Date();

    const result = await prisma.group.updateMany({
        where: {
            time: { lt: now },
            status: { in: ['OPEN', 'FULL'] },
        },
        data: { status: 'COMPLETED' },
    });

    if (result.count > 0) {
        console.log(`[Cleanup] 已將 ${result.count} 個過期揪團標記為完成`);
    }

    return result.count;
}

/**
 * 啟動定時清理任務
 * 每小時執行一次
 */
export function startCleanupJob(): void {
    const INTERVAL_MS = 60 * 60 * 1000; // 1 小時

    console.log('[Cleanup] 定時清理任務已啟動 (每小時執行)');

    // 啟動時先執行一次
    cleanupExpiredGroups().catch(console.error);

    // 每小時執行
    setInterval(() => {
        cleanupExpiredGroups().catch(console.error);
    }, INTERVAL_MS);
}
