import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    // 預設支援 Gmail 等多種服務器，可根據環境變數自行調整
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'false' ? false : true, // 465 true; 587 false
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // 如果用 Gmail，這裡是應用程式專用密碼
    },
});

interface SendJoinGroupEmailParams {
    toEmail: string;
    organizerName: string;
    joinerName: string;
    groupTitle: string;
    sportType: string;
    time: string;
    isFull: boolean;
}

/**
 * 寄送有人加入揪團的通知信
 */
export async function sendJoinGroupEmail({
    toEmail,
    organizerName,
    joinerName,
    groupTitle,
    sportType,
    time,
    isFull,
}: SendJoinGroupEmailParams) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP 尚未設定，略過發送 Email 通知。請設定 SMTP_USER 及 SMTP_PASS');
        return;
    }

    try {
        const timeString = new Date(time).toLocaleString('zh-TW', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const subject = `[LUMO] 有人加入了你的 ${sportType} 揪團！`;

        let htmlContext = `
            <h2>嗨 ${organizerName || '發起人'}，</h2>
            <p>好消息！<strong>${joinerName || '有新成員'}</strong> 剛剛加入了你發起的揪團：</p>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>活動主題：</strong>${groupTitle}</p>
                <p><strong>活動時間：</strong>${timeString}</p>
            </div>
        `;

        if (isFull) {
            htmlContext += `
                <div style="background-color: #e6f7ff; color: #0050b3; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #91d5ff;">
                    🎉 <strong>恭喜！你的揪團人數已經滿了！</strong> 🎉<br>
                    記得準時到場，祝你們玩得開心！
                </div>
            `;
        }

        htmlContext += `
            <br>
            <p>這是一封系統自動發送的信件，請勿直接回覆。</p>
            <p>祝你運動愉快！<br>LUMO 團隊 敬上</p>
        `;

        await transporter.sendMail({
            from: `"LUMO 運動平台" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject,
            html: htmlContext,
        });

        console.log(`✅ 已發送 Email 通知給 ${toEmail} (揪團：${groupTitle})`);
    } catch (error) {
        console.error('❌ 發送 Email 失敗:', error);
    }
}
