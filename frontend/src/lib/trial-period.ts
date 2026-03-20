/**
 * 試用期判斷工具 — 前端唯一真相來源
 * 透過環境變數 NEXT_PUBLIC_TRIAL_END_DATE 設定試用期結束日期
 * 預設值: 2026-04-30T23:59:59+08:00
 */
const TRIAL_END_DATE = process.env.NEXT_PUBLIC_TRIAL_END_DATE || '2026-04-30T23:59:59+08:00';

export function isTrialPeriod(): boolean {
    return new Date() <= new Date(TRIAL_END_DATE);
}
