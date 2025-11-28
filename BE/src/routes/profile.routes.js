const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const userModel = require('../models/user.model');
const uploadCloud = require('../config/cloudinary');
const bcrypt = require('bcryptjs');
/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Lấy thông tin hồ sơ người dùng
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin hồ sơ người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                 email:
 *                   type: string
 *                   format: email
 *                 fullName:
 *                   type: string
 *                 provider:
 *                   type: string
 *                   enum: [local, google]
 *                   description: Phương thức đăng nhập
 *       401:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi máy chủ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await userModel.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        // Trả về thêm avatar_url (có thể là null)
        res.status(200).json({
            userId: user.user_id,
            email: user.email,
            fullName: user.full_name,
            provider: user.provider,
            role: user.role,
            avatar_url: user.avatar_url 
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
});

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Cập nhật thông tin hồ sơ người dùng
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Họ và tên mới
 *                 example: "Nguyễn Văn A"
 *     responses:
 *       200:
 *         description: Cập nhật hồ sơ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cập nhật hồ sơ thành công.
 *       400:
 *         description: Dữ liệu không hợp lệ
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
 *       500:
 *         description: Lỗi máy chủ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { fullName } = req.body;
        if (!fullName) {
            return res.status(400).json({ message: 'Họ và tên là bắt buộc.' });
        }
        await userModel.updateProfile(req.user.userId, fullName);
        res.status(200).json({ message: 'Cập nhật hồ sơ thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
});

/**
 * @swagger
 * /api/profile/avatar:
 *   put:
 *     summary: Cập nhật ảnh đại diện
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh đại diện
 *     responses:
 *       200:
 *         description: Cập nhật ảnh đại diện thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cập nhật ảnh đại diện thành công!"
 *                 avatar_url:
 *                   type: string
 *                   format: uri
 *                   description: URL ảnh đại diện mới
 *       400:
 *         description: Không có file ảnh hoặc file không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.put(
    '/avatar',
    authMiddleware,
    (req, res, next) => {
        uploadCloud.single('image')(req, res, (err) => {
            if (err) {
                console.error('Upload avatar error:', err);
                return res.status(400).json({
                    message: 'Lỗi upload ảnh. Vui lòng thử lại với file khác.',
                    error: err.message || String(err)
                });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Vui lòng upload một file ảnh.' });
            }

            const imageUrl = req.file.secure_url || req.file.url; // Lấy URL từ Cloudinary
            const userId = req.user.userId;

            // 4. Lưu URL vào DB (gọi Model)
            await userModel.updateAvatar(userId, imageUrl);

            // 5. Trả về URL mới cho app
            res.status(200).json({
                message: 'Cập nhật ảnh đại diện thành công!',
                avatar_url: imageUrl
            });

        } catch (error) {
            console.error('Error updating avatar:', error);
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/profile/password:
 *   put:
 *     summary: Đổi mật khẩu trực tiếp (cần nhập mật khẩu cũ)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu hiện tại
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mới (tối thiểu 6 ký tự)
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
 *         description: Mật khẩu cũ không đúng hoặc dữ liệu không hợp lệ
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
 *       500:
 *         description: Lỗi máy chủ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/password', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.userId;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
        }

        // Lấy user từ DB
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        // Kiểm tra provider
        if (user.provider !== 'local') {
            return res.status(400).json({ message: 'Tài khoản đăng nhập qua Google không thể đổi mật khẩu.' });
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu cũ không đúng.' });
        }

        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Cập nhật mật khẩu
        await userModel.resetPassword(userId, newPasswordHash);

        res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
});

module.exports = router;
