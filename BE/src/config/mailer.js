const nodemailer = require('nodemailer');
require('dotenv').config();

// === CẤU HÌNH MỚI: DÙNG PORT 587 (ỔN ĐỊNH HƠN TRÊN RENDER) ===
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Host chuẩn của Gmail
    port: 587,              // Port 587 (STARTTLS) ít bị chặn hơn 465
    secure: false,          // false cho port 587, true cho port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        // Không từ chối chứng chỉ máy chủ (giúp tránh lỗi SSL handshake trên Render)
        rejectUnauthorized: false 
    },
    // Tăng thời gian chờ kết nối (quan trọng)
    connectionTimeout: 10000, // 10 giây
    greetingTimeout: 10000,   // 10 giây
    socketTimeout: 10000      // 10 giây
});

const sendEmail = async (to, subject, html) => {
    try {
        console.log(`[Mailer] Đang chuẩn bị gửi mail đến: ${to}`);
        console.log(`[Mailer] User đang dùng: ${process.env.EMAIL_USER}`);
        
        if (!process.env.EMAIL_PASS) {
             throw new Error("Chưa cấu hình EMAIL_PASS");
        }

        const info = await transporter.sendMail({
            from: `"CheckMyHealth App" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        });
        
        console.log(`[Mailer] Email sent thành công: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('[Mailer] Lỗi chi tiết:', error);
        // Ném lỗi ra ngoài để Controller bắt được và báo về App
        throw new Error(`Gửi mail thất bại: ${error.message}`);
    }
};

module.exports = { sendEmail };