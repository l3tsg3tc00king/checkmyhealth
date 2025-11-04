const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');
const { sendEmail } = require('../config/mailer'); // Gửi email
const crypto = require('crypto'); // Tạo mã ngẫu nhiên
const bcrypt = require('bcryptjs'); // Hash mã
const userModel = require('../models/user.model'); // Tương tác DB
const { authMiddleware } = require('../middleware/auth.middleware');

router.post('/register', authController.register);

router.post('/login', authController.login);

router.post('/request-password-reset', authMiddleware, async (req, res) => {
    try {
        const user = await userModel.findById(req.user.userId);

        // === YÊU CẦU CHECK CỦA BẠN ===
        if (!user.email) {
            return res.status(400).json({ message: 'Tài khoản của bạn chưa có email. Vui lòng cập nhật hồ sơ.' });
        }
        if (user.provider !== 'local') {
            return res.status(400).json({ message: `Bạn đang đăng nhập qua ${user.provider}, không thể dùng tính năng này.` });
        }
        // =============================

        // 1. Tạo mã 6 số (OTP)
        const code = crypto.randomInt(100000, 999999).toString();
        // 2. Hash mã này để lưu vào DB (bảo mật)
        const salt = await bcrypt.genSalt(10);
        const tokenHash = await bcrypt.hash(code, salt);
        // 3. Đặt thời gian hết hạn (10 phút)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

        // 4. Lưu vào DB
        await userModel.setResetToken(user.user_id, tokenHash, expiresAt);

        // 5. Gửi email (plaintext code)
        const emailSubject = 'Mã xác nhận đổi mật khẩu CheckMyHealth';
        const emailHtml = `
            <p>Xin chào ${user.full_name},</p>
            <p>Mã xác nhận để đổi mật khẩu của bạn là:</p>
            <h2 style="color: #3B82F6;">${code}</h2>
            <p>Mã này sẽ hết hạn sau 10 phút.</p>
            <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email.</p>
        `;
        await sendEmail(user.email, emailSubject, emailHtml);

        res.status(200).json({ message: `Đã gửi mã xác nhận tới ${user.email}` });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
});

router.post('/reset-password-with-code', authMiddleware, async (req, res) => {
    try {
        const { code, newPassword } = req.body;
        const userId = req.user.userId;

        if (!code || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập mã và mật khẩu mới.' });
        }

        const user = await userModel.findById(userId);
        if (!user || !user.reset_token || !user.reset_token_expires) {
            return res.status(400).json({ message: 'Yêu cầu không hợp lệ. Vui lòng thử lại.' });
        }

        // 1. Kiểm tra mã còn hạn không
        if (new Date() > user.reset_token_expires) {
            return res.status(400).json({ message: 'Mã xác nhận đã hết hạn.' });
        }

        // 2. Kiểm tra mã có đúng không (so sánh hash)
        const isMatch = await bcrypt.compare(code, user.reset_token);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mã xác nhận không đúng.' });
        }

        // 3. Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // 4. Cập nhật mật khẩu và xóa token
        await userModel.resetPassword(userId, newPasswordHash);

        res.status(200).json({ message: 'Đổi mật khẩu thành công!' });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
});

module.exports = router;