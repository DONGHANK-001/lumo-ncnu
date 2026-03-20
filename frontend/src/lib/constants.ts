// ============================================
// 前端共用常數 — 唯一真相來源
// ============================================

/** 運動類型中文名稱 */
export const SPORT_NAMES: Record<string, string> = {
    BASKETBALL: '籃球',
    RUNNING: '跑步',
    BADMINTON: '羽球',
    TABLE_TENNIS: '桌球',
    GYM: '健身',
    VOLLEYBALL: '排球',
    NIGHT_WALK: '晚風漫遊',
    DINING: '飯飯之交',
};

/** 運動類型 Emoji */
export const SPORT_EMOJIS: Record<string, string> = {
    BASKETBALL: '🏀',
    RUNNING: '🏃',
    BADMINTON: '🏸',
    TABLE_TENNIS: '🏓',
    GYM: '💪',
    VOLLEYBALL: '🏐',
    NIGHT_WALK: '🌙',
    DINING: '🍽️',
};

/** 技能等級中文名稱 */
export const LEVEL_NAMES: Record<string, string> = {
    BEGINNER: '初學者',
    INTERMEDIATE: '中級',
    ADVANCED: '進階',
    ANY: '不限',
};

/** 技能等級選項（用於表單 Select） */
export const LEVEL_OPTIONS = [
    { value: 'ANY', label: '不限程度' },
    { value: 'BEGINNER', label: '初學者' },
    { value: 'INTERMEDIATE', label: '中級' },
    { value: 'ADVANCED', label: '進階' },
] as const;

/** 暨大科系清單 */
export const DEPARTMENTS = [
    '資訊管理學系',
    '資訊工程學系',
    '土木工程學系',
    '電機工程學系',
    '應用化學系',
    '應用材料及光電工程學系',
    '國際企業學系',
    '財務金融學系',
    '經濟學系',
    '觀光休閒與餐旅管理學系',
    '社會政策與社會工作學系',
    '公共行政與政策學系',
    '教育政策與行政學系',
    '國際文教與比較教育學系',
    '諮商心理與人力資源發展學系',
    '中國語文學系',
    '外國語文學系',
    '歷史學系',
    '東南亞學系',
    '體育室',
    '通識教育中心',
    '其他',
] as const;

/** 可用時間選項 */
export const TIME_OPTIONS = [
    '平日早上',
    '平日中午',
    '平日晚上',
    '週末早上',
    '週末下午',
    '週末晚上',
] as const;

/** 校園場地選項 */
export const LOCATION_OPTIONS = [
    '體育館',
    '操場',
    '健身房',
    '籃球場',
    '羽球場',
] as const;

/** 訂閱方案定義 */
export const PLANS = [
    { type: 'BIWEEKLY', name: '體驗方案', price: 19, period: '兩週', features: ['解除發起揪團上限', '專屬 PLUS 徽章'] },
    { type: 'MONTHLY', name: '月租方案', price: 30, period: '月', features: ['包含體驗方案功能', '無限查看參與者聯絡資訊'] },
    { type: 'QUARTERLY', name: '超值季卡', price: 80, period: '季', features: ['包含月租方案功能', '解鎖智慧配對進階條件'] },
    { type: 'LIFETIME', name: '終身黑金卡', price: 199, period: '永久', features: ['專屬「⚜️ 黑金永恆」稱號', '揪團金框標示', '未來所有新功能免費', '未來周邊商品最優惠價格'] },
] as const;
