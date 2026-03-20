// ============================================
// 後端共用常數 — 唯一真相來源
// ============================================

/** 付款方案定價（ECPay 實際收費金額） */
export const PLAN_PRICING: Record<string, { amount: number; name: string }> = {
    BIWEEKLY: { amount: 25, name: '兩週' },
    MONTHLY: { amount: 49, name: '一個月' },
    QUARTERLY: { amount: 99, name: '一季' },
    LIFETIME: { amount: 199, name: '永久' },
};
