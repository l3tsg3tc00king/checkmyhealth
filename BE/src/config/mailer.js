const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false 
    },
    // === CẤU HÌNH QUAN TRỌNG ĐỂ FIX LỖI RENDER ===
    family: 4,              // <--- Ép buộc dùng IPv4 (Fix lỗi ETIMEDOUT IPv6)
    
    // Tăng thời gian chờ lên 30 giây cho thoải mái
    connectionTimeout: 30000, 
    greetingTimeout: 30000,   
    socketTimeout: 30000      
});

const sendEmail = async (to, subject, html) => {
    try {
        console.log(`[Mailer] Đang chuẩn bị gửi mail đến: ${to}`);
        
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
        throw new Error(`Gửi mail thất bại: ${error.message}`);
    }
};

module.exports = { sendEmail };