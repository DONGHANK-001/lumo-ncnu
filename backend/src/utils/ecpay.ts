import crypto from 'crypto';

// 使用綠界提供的測試環境參數
const HASH_KEY = process.env.ECPAY_HASH_KEY || '5294y06JbISpM5x9';
const HASH_IV = process.env.ECPAY_HASH_IV || 'v77hoKGq4kWxNNIS';
export const MERCHANT_ID = process.env.ECPAY_MERCHANT_ID || '2000132';

// 綠界的 URL 參數編碼需要符合特定的格式（與標準的 .NET UrlEncode 相同）
function ecpayUrlEncode(str: string): string {
    return encodeURIComponent(str)
        .replace(/%20/g, '+')
        .replace(/%2d/g, '-')
        .replace(/%5f/g, '_')
        .replace(/%2e/g, '.')
        .replace(/%21/g, '!')
        .replace(/%2a/g, '*')
        .replace(/%28/g, '(')
        .replace(/%29/g, ')');
}

/**
 * 產生綠界 CheckMacValue 檢查碼 (SHA256)
 * @param params 要送給綠界的 FormData 物件
 * @returns CheckMacValue
 */
export function generateCheckMacValue(params: Record<string, any>): string {
    // 1. 將參數依照英文字母順序排序 (A 到 Z)
    const keys = Object.keys(params).sort();

    // 2. 串接參數
    let rawString = `HashKey=${HASH_KEY}`;
    for (const key of keys) {
        // CheckMacValue 本身不需要加進去算
        if (key !== 'CheckMacValue') {
            rawString += `&${key}=${params[key]}`;
        }
    }
    rawString += `&HashIV=${HASH_IV}`;

    // 3. 進行 URL Encode
    const encodedString = ecpayUrlEncode(rawString);

    // 4. 轉小寫
    const lowerCaseString = encodedString.toLowerCase();

    // 5. 進行 SHA256 雜湊
    const hash = crypto.createHash('sha256').update(lowerCaseString).digest('hex');

    // 6. 轉大寫回傳
    return hash.toUpperCase();
}
