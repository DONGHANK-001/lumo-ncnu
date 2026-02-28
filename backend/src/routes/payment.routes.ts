import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';
import { generateCheckMacValue, MERCHANT_ID } from '../utils/ecpay.js';

const router = Router();

// 定義金流 ReturnURL & NotifyURL (未來部署後需改成正式網域)
const DOMAIN = process.env.PUBLIC_URL || 'http://localhost:3000';
const BACKEND_DOMAIN = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * [POST] /payment/checkout
 * 產生綠界結帳表單所需參數
 * 需要登入 (AuthRequired)
 */
router.post('/checkout', firebaseAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { planType = 'PLUS' } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        }

        let amount = 0;
        let planName = '';

        switch (planType) {
            case 'WEEKLY':
                amount = 19;
                planName = '一週';
                break;
            case 'MONTHLY':
                amount = 60;
                planName = '一個月';
                break;
            case 'QUARTERLY':
                amount = 150;
                planName = '一季';
                break;
            case 'LIFETIME':
                amount = 399;
                planName = '永久';
                break;
            default:
                // Fallback for previous PLUS plan type or invalid types
                if (planType === 'PLUS') {
                    amount = 60;
                    planName = '一個月';
                } else {
                    return res.status(400).json({ success: false, error: { message: '無效的方案' } });
                }
        }

        // 產生訂單編號 (必須唯一，綠界規定不得重複，長度小於20字元)
        const merchantOrderNo = `LUMO${Date.now()}${Math.floor(Math.random() * 100)}`;

        // 建立 PaymentLog 紀錄為 PENDING
        await prisma.paymentLog.create({
            data: {
                userId,
                merchantOrderNo,
                amount,
                status: 'PENDING'
            }
        });

        const tradeDesc = `LUMO PLUS ${planName} 方案`;
        const itemName = `LUMO PLUS 會員 (${planName})`;

        // 準備送給綠界的基礎參數
        const ecpayParams: Record<string, any> = {
            MerchantID: MERCHANT_ID,
            MerchantTradeNo: merchantOrderNo,
            MerchantTradeDate: new Date().toLocaleString('zh-TW', { hour12: false }).replace(/\//g, '/'), // 格式: yyyy/MM/dd HH:mm:ss
            PaymentType: 'aio',
            TotalAmount: amount,
            TradeDesc: tradeDesc,
            ItemName: itemName,
            ReturnURL: `${BACKEND_DOMAIN}/payment/callback`, // 綠界伺服器端回傳付款結果的網址
            OrderResultURL: `${DOMAIN}/payment/success`,     // 綠界前端跳轉回我們網站的網址
            ChoosePayment: 'Credit',                         // 預設採用信用卡
            EncryptType: 1                                   // 固定填 1 (SHA256)
        };

        // 計算 CheckMacValue
        const checkMacValue = generateCheckMacValue(ecpayParams);
        ecpayParams.CheckMacValue = checkMacValue;

        // 將完整參數回傳給前端，由前端建構 HTML Form 送出
        res.json({ success: true, data: ecpayParams });
    } catch (error: any) {
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, error: { message: error.message || '結帳失敗' } });
    }
});

/**
 * [POST] /payment/callback
 * 綠界金流幕後回傳付款結果 (Webhook)
 * 不需要登入，但需要驗證 CheckMacValue
 */
router.post('/callback', async (req, res) => {
    try {
        // 綠界透過 application/x-www-form-urlencoded 傳遞資料
        const params = req.body;

        // 取出回傳的 CheckMacValue，並且將原本的物件複製一份來驗證
        const receivedMac = params.CheckMacValue;
        const validParams = { ...params };
        delete validParams.CheckMacValue;

        // 自己算一次
        const calculatedMac = generateCheckMacValue(validParams);

        if (receivedMac !== calculatedMac) {
            console.error('ECPay MAC Validation Failed!', { receivedMac, calculatedMac });
            return res.status(400).send('0|ErrorMessage'); // 回傳錯誤讓綠界知道
        }

        // 驗證成功，讀取訂單狀態
        const { MerchantTradeNo, RtnCode, PaymentType } = params;

        // RtnCode === '1' 代表成功
        if (RtnCode === '1') {
            const paymentLog = await prisma.paymentLog.update({
                where: { merchantOrderNo: MerchantTradeNo },
                data: {
                    status: 'SUCCESS',
                    paymentMethod: PaymentType,
                }
            });

            if (paymentLog) {
                // 幫使用者訂閱（或是延長時間）
                const userId = paymentLog.userId;

                // 計算到期日
                const endDate = new Date();
                if (paymentLog.amount === 19) {
                    endDate.setDate(endDate.getDate() + 7); // 7天
                } else if (paymentLog.amount === 60) {
                    endDate.setMonth(endDate.getMonth() + 1); // 1個月
                } else if (paymentLog.amount === 150) {
                    endDate.setMonth(endDate.getMonth() + 3); // 3個月
                } else if (paymentLog.amount === 399) {
                    endDate.setFullYear(endDate.getFullYear() + 100); // 永久 (加100年)
                } else {
                    // Fallback
                    endDate.setMonth(endDate.getMonth() + 1);
                }

                // 檢查是否已經有訂閱記錄 (用 upsert 更新或新建)
                await prisma.plusSubscription.upsert({
                    where: { userId },
                    update: {
                        status: 'ACTIVE',
                        endAt: endDate,
                        planPrice: paymentLog.amount,
                    },
                    create: {
                        userId,
                        status: 'ACTIVE',
                        endAt: endDate,
                        planPrice: paymentLog.amount,
                    }
                });

                // 同步更新 User 的 planType
                await prisma.user.update({
                    where: { id: userId },
                    data: { planType: 'PLUS' }
                });
            }
        } else {
            // 付款失敗或取消
            await prisma.paymentLog.update({
                where: { merchantOrderNo: MerchantTradeNo },
                data: { status: 'FAILED', paymentMethod: PaymentType }
            });
        }

        // 一定要回傳 1|OK 讓綠界知道收到
        res.send('1|OK');
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('0|ErrorMessage');
    }
});

export default router;
