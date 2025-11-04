const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const userModel = require('../models/user.model');


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
            provider: user.provider // Rất quan trọng (local, google...)
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
});

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

module.exports = router;