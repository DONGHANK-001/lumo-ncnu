// ============================================
// 後端共用常數 — 唯一真相來源
// ============================================

/** 付款方案定價（ECPay 實際收費金額） */
export const PLAN_PRICING: Record<string, { amount: number; name: string }> = {
    WEEKLY: { amount: 19, name: '一週' },
    MONTHLY: { amount: 60, name: '一個月' },
    QUARTERLY: { amount: 150, name: '一季' },
    LIFETIME: { amount: 399, name: '永久' },
};
