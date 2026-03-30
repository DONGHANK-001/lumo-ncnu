import { prisma } from '../lib/prisma.js';

/**
 * 檢舉原因 → negativeRatings 懲罰值
 */
export const PENALTY_MAP: Record<string, number> = {
    '騷擾或不當言論': 5,
    '惡意放鴿子': 3,
    '詐騙或金錢糾紛': 8,
    '冒充身份': 5,
    '危害安全': 10,
    '其他': 3,
};

/**
 * 計算信譽分數
 * 公式：clamp(100 - neg*2 + floor(pos/2), 0, 100)
 */
export function calcReputationScore(positiveRatings: number, negativeRatings: number): number {
    const raw = 100 - negativeRatings * 2 + Math.floor(positiveRatings / 2);
    return Math.max(0, Math.min(100, raw));
}

/**
 * 根據信譽分決定停用天數
 * @returns null = 不停用, -1 = 永久, 正數 = 天數
 */
export function getBanDays(score: number): number | null {
    if (score < 50) return -1;   // 永久
    if (score < 60) return 7;
    if (score < 70) return 3;
    if (score < 80) return 1;
    return null; // 不停用
}

/**
 * 產生帶有自動解封時間的 banReason
 */
function buildBanReason(reason: string, days: number | null): { isBanned: boolean; banReason: string | null } {
    if (days === null) return { isBanned: false, banReason: null };
    if (days === -1) return { isBanned: true, banReason: `信譽過低永久停用（原因：${reason}）` };

    const unbanAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    return {
        isBanned: true,
        banReason: `信譽過低自動停用 ${days} 天（原因：${reason}）|UNBAN:${unbanAt}`,
    };
}

export interface PenaltyResult {
    userId: string;
    newScore: number;
    banned: boolean;
    banDays: number | null;
    previousNegative: number;
    newNegative: number;
}

/**
 * 對使用者施加信譽懲罰
 * - 增加 negativeRatings
 * - 計算新信譽
 * - 達到停用門檻時自動 ban
 */
export async function applyPenalty(userId: string, reason: string): Promise<PenaltyResult> {
    const penalty = PENALTY_MAP[reason] || 3;

    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { positiveRatings: true, negativeRatings: true },
    });

    const newNegative = user.negativeRatings + penalty;
    const newScore = calcReputationScore(user.positiveRatings, newNegative);
    const banDays = getBanDays(newScore);

    // 「危害安全」特殊處理：至少 ban 7 天
    const effectiveBanDays = reason === '危害安全' && (banDays === null || (banDays > 0 && banDays < 7))
        ? 7
        : banDays;

    const banData = buildBanReason(reason, effectiveBanDays);

    await prisma.user.update({
        where: { id: userId },
        data: {
            negativeRatings: newNegative,
            ...(banData.isBanned && { isBanned: banData.isBanned, banReason: banData.banReason }),
        },
    });

    return {
        userId,
        newScore,
        banned: banData.isBanned,
        banDays: effectiveBanDays,
        previousNegative: user.negativeRatings,
        newNegative,
    };
}

/**
 * 檢查 banReason 中的自動解封時間
 * @returns true 如果已自動解封
 */
export async function checkAutoUnban(userId: string, banReason: string | null): Promise<boolean> {
    if (!banReason || !banReason.includes('|UNBAN:')) return false;

    const parts = banReason.split('|UNBAN:');
    if (parts.length < 2) return false;

    const unbanAt = new Date(parts[1]);
    if (isNaN(unbanAt.getTime())) return false;

    if (new Date() >= unbanAt) {
        await prisma.user.update({
            where: { id: userId },
            data: { isBanned: false, banReason: null },
        });
        return true;
    }
    return false;
}
