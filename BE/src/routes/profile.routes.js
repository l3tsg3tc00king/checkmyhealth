const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const userModel = require('../models/user.model');
const uploadCloud = require('../config/cloudinary');
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
        // req.user được gán từ authMiddleware
        const user = await userModel.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        // Chỉ trả về thông tin an toàn
        res.status(200).json({
            userId: user.user_id,
            email: user.email,
            fullName: user.full_name,
            provider: user.provider, // Rất quan trọng (local, google...)
            role: user.role, // Thêm role vào response
            avatar_url: user.avatar_url || null
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

            const imageUrl = req.file.path || req.file.secure_url || req.file.url;
            if (!imageUrl) {
                console.error('Không nhận được URL ảnh từ Cloudinary response:', req.file);
                return res.status(500).json({ message: 'Không nhận được URL ảnh từ dịch vụ lưu trữ.' });
            }

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


module.exports = router;
