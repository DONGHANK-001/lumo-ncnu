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
    TENNIS: '網球',
    STUDY: '讀家回憶',
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
    TENNIS: '🎾',
    STUDY: '📚',
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

/** 暨大科系清單（依學院分組） */
export const DEPARTMENT_GROUPS: Record<string, readonly string[]> = {
    '人文學院': [
        '中國語文學系',
        '外國語文學系',
        '歷史學系',
        '公共行政與政策學系',
        '社會政策與社會工作學系',
        '東南亞學系',
        '原住民文化產業與社會工作學士學位學程（原住民族專班）',
    ],
    '管理學院': [
        '國際企業學系',
        '經濟學系',
        '資訊管理學系',
        '財務金融學系',
        '觀光休閒與餐旅管理學系',
        '管理學院學士班',
    ],
    '科技學院': [
        '資訊工程學系',
        '電機工程學系',
        '土木工程學系',
        '應用化學系',
        '應用材料及光電工程學系',
        '科技學院學士班',
    ],
    '教育學院': [
        '國際文教與比較教育學系',
        '教育政策與行政學系',
        '諮商心理與人力資源發展學系',
        '教育學院學士班',
    ],
    '護理暨健康福祉學院': [
        '護理學系',
    ],
    '其他獨立學程／專班': [
        '智慧暨永續農業學士學位學程',
    ],
};

/** 扁平科系清單（向下相容） */
export const DEPARTMENTS = Object.values(DEPARTMENT_GROUPS).flat();

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
    { type: 'BIWEEKLY', name: '體驗方案', price: 25, period: '兩週', features: ['解除發起揪團上限', '專屬 PLUS 徽章'] },
    { type: 'MONTHLY', name: '月租方案', price: 49, period: '月', features: ['包含體驗方案功能', '無限查看參與者聯絡資訊'] },
    { type: 'QUARTERLY', name: '超值季卡', price: 99, period: '季', features: ['包含月租方案功能', '解鎖智慧配對進階條件'] },
    { type: 'LIFETIME', name: '終身黑金卡', price: 199, period: '永久', features: ['專屬「⚜️ 黑金永恆」稱號', '揪團金框標示', '未來所有新功能免費', '未來周邊商品最優惠價格'] },
] as const;

// ============================================
// 讀家回憶｜系所對抗賽 活動設定（4/7 - 4/17）
// ============================================
export const READING_EVENT_START = new Date('2026-04-07T00:00:00+08:00');
export const READING_EVENT_END = new Date('2026-04-17T12:00:00+08:00');
export const READING_EVENT_DAILY_HOUR = 9;

export function isReadingEventActive(): boolean {
    const now = new Date();
    return now >= READING_EVENT_START && now < READING_EVENT_END;
}

export function shouldShowReadingEventNotification(): boolean {
    if (!isReadingEventActive()) return false;
    return new Date().getHours() >= READING_EVENT_DAILY_HOUR;
}

export function isReadingEventNotifReadToday(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('reading_event_notif_read') === 'true';
}

export function markReadingEventNotifRead(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('reading_event_notif_read', 'true');
}

// ============================================
// 期中燃脂王｜運動排行榜 活動設定（4/13 - 4/17）
// ============================================
export const MIDTERM_FIT_START = new Date('2026-04-11T00:00:00+08:00');
export const MIDTERM_FIT_END = new Date('2026-04-17T12:00:00+08:00');

export function isMidtermFitActive(): boolean {
    const now = new Date();
    return now >= MIDTERM_FIT_START && now < MIDTERM_FIT_END;
}

export function shouldShowMidtermFitNotification(): boolean {
    if (!isMidtermFitActive()) return false;
    return new Date().getHours() >= READING_EVENT_DAILY_HOUR;
}

export function isMidtermFitNotifReadToday(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('midterm_fit_notif_read') === 'true';
}

export function markMidtermFitNotifRead(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('midterm_fit_notif_read', 'true');
}

/** 任一活動進行中（用於共用判斷） */
export function isAnyEventActive(): boolean {
    return isReadingEventActive() || isMidtermFitActive();
}
