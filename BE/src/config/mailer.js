// const nodemailer = require('nodemailer');
// require('dotenv').config();

// // Tạo 'transporter' (phương tiện vận chuyển)
// const transporter = nodemailer.createTransport({
//     service: 'gmail', // Dùng dịch vụ Gmail
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// /**
//  * Hàm gửi email chung
//  * @param {string} to - Email người nhận
//  * @param {string} subject - Chủ đề
//  * @param {string} html - Nội dung HTML
//  */
// const sendEmail = async (to, subject, html) => {
//     try {
//         await transporter.sendMail({
//             from: `"CheckMyHealth App" <${process.env.EMAIL_USER}>`,
//             to: to,
//             subject: subject,
//             html: html
//         });
//         console.log(`Email sent to ${to}`);
//     } catch (error) {
//         console.error('Error sending email:', error);
//         throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
//     }
// };

// module.exports = { sendEmail };

// backend/config/mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        console.log(`[Mailer] Đang chuẩn bị gửi mail đến: ${to}`);
        console.log(`[Mailer] User đang dùng: ${process.env.EMAIL_USER}`);
        
        // Kiểm tra xem có pass chưa (không in ra log để bảo mật, chỉ check length)
        if (!process.env.EMAIL_PASS) {
             throw new Error("Chưa cấu hình EMAIL_PASS");
        }

        const info = await transporter.sendMail({
            from: `"CheckMyHealth App" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        });
        
        console.log(`[Mailer] Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('[Mailer] Lỗi chi tiết:', error); // Quan trọng: Xem log này trên Render
        throw new Error(`Gửi mail thất bại: ${error.message}`);
    }
};

module.exports = { sendEmail };