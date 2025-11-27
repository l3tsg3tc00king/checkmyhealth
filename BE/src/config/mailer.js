const nodemailer = require('nodemailer');
require('dotenv').config();

// Tạo 'transporter' với cấu hình SMTP rõ ràng (tương thích với Render)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Port 587 cho TLS (Render cho phép outbound connections)
    secure: false, // false cho port 587, true cho port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Phải là App Password từ Gmail
    },
    tls: {
        // Cho phép kết nối ngay cả khi certificate không hoàn toàn hợp lệ
        rejectUnauthorized: false
    },
    // Timeout settings cho môi trường cloud
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000
});

/**
 * Hàm gửi email chung
 * @param {string} to - Email người nhận
 * @param {string} subject - Chủ đề
 * @param {string} html - Nội dung HTML
 */
const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"CheckMyHealth App" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        });
        console.log(`✅ Email sent to ${to} - Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        // Log chi tiết để debug trên Render
        if (error.response) {
            console.error('SMTP Error Response:', error.response);
        }
        if (error.code) {
            console.error('Error Code:', error.code);
        }
        throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
    }
};

// Verify connection khi khởi động (chỉ log, không block)
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Mailer connection error:', error.message);
        console.error('⚠️  Email functionality may not work. Check EMAIL_USER and EMAIL_PASS in environment variables.');
    } else {
        console.log('✅ Mailer server is ready to send emails');
    }
});

module.exports = { sendEmail };