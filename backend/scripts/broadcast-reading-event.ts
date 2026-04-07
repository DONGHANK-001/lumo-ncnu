/**
 * 一次性腳本：發送讀家回憶排行榜活動通知給所有使用者
 * 使用方式：cd backend && npx tsx scripts/broadcast-reading-event.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TITLE = '📚 讀家回憶對抗賽開跑！前三名送禮券';

const BODY = `4/7～4/17 排行榜只計算「讀家回憶」！

🎁 前 3 名「最強讀書王」送禮券：
🥇 第一名：300 元
🥈 第二名：200 元
🥉 第三名：100 元

🏆 參賽四步驟：
1️⃣ 進入「讀家回憶」專區
2️⃣ 尋找或發起揪團，找一位「不同系」的戰友一起讀書（成功配對才算）
3️⃣ 拍下活動過程照片 📸（可不露臉）
4️⃣ ⚠️ 結算時刻：4/17 12:00-14:00
請於 4/17 中午 12:00～14:00 發佈打卡限動標記 @lumo_dailyfit，並私訊提供：
✅ 個人排行榜成績截圖
✅ 讀書活動照片
✅ 系級與姓名
（得獎者公布於 @lumo_dailyfit）

⚠️ 私訊回傳活動照片即代表同意授權 Lumo 團隊於官方社群分享使用。`;

async function main() {
    const users = await prisma.user.findMany({
        where: { isBanned: false },
        select: { id: true },
    });

    console.log(`Found ${users.length} users, sending notifications...`);

    let sent = 0;
    let failed = 0;

    for (const user of users) {
        try {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: 'SYSTEM',
                    title: TITLE,
                    body: BODY,
                },
            });
            sent++;
        } catch (err) {
            failed++;
            console.error(`Failed for user ${user.id}:`, err);
        }
    }

    console.log(`Done! Sent: ${sent}, Failed: ${failed}, Total: ${users.length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
