const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');
const { sendEmail } = require('../config/mailer'); // Gửi email
const crypto = require('crypto'); // Tạo mã ngẫu nhiên
const bcrypt = require('bcryptjs'); // Hash mã
const userModel = require('../models/user.model'); // Tương tác DB
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đăng ký thành công!
 *                 userId:
 *                   type: integer
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email đã được sử dụng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Yêu cầu đặt lại mật khẩu (gửi mã OTP qua email)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mã xác nhận đã được gửi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đã gửi mã xác nhận tới user@example.com
 *       400:
 *         description: Lỗi yêu cầu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/auth/reset-password-with-code:
 *   post:
 *     summary: Đặt lại mật khẩu bằng mã OTP
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - newPassword
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã OTP 6 số
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mới
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đổi mật khẩu thành công!
 *       400:
 *         description: Mã OTP không đúng hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

// === API MỚI 1: (CÔNG KHAI) YÊU CẦU RESET KHI QUÊN ===

/**
 * @swagger
 * /api/auth/public-forgot-password:
 *   post:
 *     summary: Yêu cầu đặt lại mật khẩu khi quên (Public, không cần đăng nhập)
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email của tài khoản cần reset mật khẩu
 *     responses:
 *       200:
 *         description: Mã xác nhận đã được gửi (nếu email tồn tại)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Nếu email này tồn tại, chúng tôi đã gửi một mã xác nhận."
 *       400:
 *         description: Email không hợp lệ
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/public-forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Vui lòng nhập email.' });
        }

        // 1. Tìm user bằng email
        const user = await userModel.findByEmail(email);
        
        // 2. Kiểm tra:
        // (Bảo mật: Kể cả khi không tìm thấy user, ta vẫn trả về 200
        // để kẻ tấn công không thể "dò" email nào đã đăng ký)
        if (!user || user.provider !== 'local') {
            return res.status(200).json({ message: 'Nếu email này tồn tại, chúng tôi đã gửi một mã xác nhận.' });
        }

        // 3. Tái sử dụng logic cũ: Tạo mã 6 số
        const code = crypto.randomInt(100000, 999999).toString();
        const salt = await bcrypt.genSalt(10);
        const tokenHash = await bcrypt.hash(code, salt);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        // 4. Lưu vào DB
        await userModel.setResetToken(user.user_id, tokenHash, expiresAt);

        // 5. Gửi email
        const emailSubject = 'Mã xác nhận đặt lại mật khẩu CheckMyHealth';
        const emailHtml = `
            <p>Xin chào ${user.full_name},</p>
            <p>Mã xác nhận để đặt lại mật khẩu của bạn là:</p>
            <h2 style="color: #3B82F6;">${code}</h2>
            <p>Mã này sẽ hết hạn sau 10 phút.</p>
        `;
        await sendEmail(user.email, emailSubject, emailHtml);

        res.status(200).json({ message: 'Nếu email này tồn tại, chúng tôi đã gửi một mã xác nhận.' });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
});


// === API MỚI 2: (CÔNG KHAI) ĐẶT LẠI MẬT KHẨU BẰNG MÃ ===

/**
 * @swagger
 * /api/auth/public-reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng mã OTP (Public, không cần đăng nhập)
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email của tài khoản
 *               code:
 *                 type: string
 *                 description: Mã OTP 6 số đã nhận qua email
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mới
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Đổi mật khẩu thành công!"
 *       400:
 *         description: Mã OTP không đúng, đã hết hạn hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/public-reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email, mã và mật khẩu mới.' });
        }

        // 1. Tìm user
        const user = await userModel.findByEmail(email);
        if (!user || !user.reset_token || !user.reset_token_expires) {
            return res.status(400).json({ message: 'Mã không hợp lệ hoặc đã hết hạn.' });
        }

        // 2. Kiểm tra hạn
        if (new Date() > user.reset_token_expires) {
            return res.status(400).json({ message: 'Mã xác nhận đã hết hạn.' });
        }

        // 3. Kiểm tra mã
        const isMatch = await bcrypt.compare(code, user.reset_token);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mã xác nhận không đúng.' });
        }

        // 4. Hash và lưu mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        await userModel.resetPassword(user.user_id, newPasswordHash);

        res.status(200).json({ message: 'Đổi mật khẩu thành công!' });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
});

module.exports = router;