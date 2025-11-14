const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const feedbackModel = require('../models/feedback.model');

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