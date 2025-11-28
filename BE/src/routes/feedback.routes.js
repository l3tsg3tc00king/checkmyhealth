const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const feedbackModel = require('../models/feedback.model');

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Gửi phản hồi/đánh giá
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback_type
 *               - content
 *             properties:
 *               feedback_type:
 *                 type: string
 *                 enum: [bug, feature, improvement, other]
 *                 description: Loại phản hồi
 *               content:
 *                 type: string
 *                 description: Nội dung phản hồi
 *                 example: "Tôi muốn thêm tính năng..."
 *     responses:
 *       201:
 *         description: Gửi phản hồi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cảm ơn bạn! Phản hồi của bạn đã được ghi nhận."
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { feedback_type, content } = req.body;
        const userId = req.user.userId; // Lấy từ token (đã check authMiddleware)

        if (!content || !feedback_type) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ loại và nội dung phản hồi.' });
        }

        await feedbackModel.create(userId, feedback_type, content);

        res.status(201).json({ message: 'Cảm ơn bạn! Phản hồi của bạn đã được ghi nhận.' });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
});

module.exports = router;