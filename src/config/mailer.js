const nodemailer = require('nodemailer');
require('dotenv').config();

// Tạo 'transporter' (phương tiện vận chuyển)
const transporter = nodemailer.createTransport({
    service: 'gmail', // Dùng dịch vụ Gmail
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Hàm gửi email chung
 * @param {string} to - Email người nhận
 * @param {string} subject - Chủ đề
 * @param {string} html - Nội dung HTML
 */
const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"CheckMyHealth App" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
    }
};

module.exports = { sendEmail };