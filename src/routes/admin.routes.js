const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');

// Tuyến đường chung, bảo vệ tất cả API bên dưới
router.use(authMiddleware, adminMiddleware);

// === Dashboard ===
router.get('/statistics', adminController.getStatistics);

// === User Management ===

// Lấy danh sách
router.get('/users', adminController.getUserList);

// Cập nhật trạng thái (Đình chỉ)
router.put('/users/:userId/status', adminController.updateUserStatus);

// Cập nhật quyền (Sửa)
router.put('/users/:userId/role', adminController.updateUserRole);

// Xóa user (Xóa)
router.delete('/users/:userId', adminController.deleteUser);


// Lấy lịch sử của 1 user
router.get('/history/:userId', adminController.getHistoryForUser);

module.exports = router;