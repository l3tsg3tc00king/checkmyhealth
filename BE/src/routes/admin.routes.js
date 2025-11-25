const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');
router.get('/statistics/export', adminController.exportStatistics);
router.delete('/feedback/:feedbackId', adminController.deleteFeedback);
router.put('/feedback/:feedbackId/status', adminController.updateFeedbackStatus);

// Tuyến đường chung, bảo vệ tất cả API bên dưới
router.use(authMiddleware, adminMiddleware);

// === Dashboard ===
/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: Lấy thống kê tổng quan (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   description: Tổng số người dùng
 *                 totalDiagnoses:
 *                   type: integer
 *                   description: Tổng số chuẩn đoán
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/statistics', adminController.getStatistics);
router.get('/statistics/timeseries', adminController.getStatisticsTimeseries);
router.get('/statistics/breakdown', adminController.getStatisticsBreakdown);
router.get('/statistics/export', adminController.exportStatistics);
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/feedback', adminController.getFeedbackList);

// === User Management ===

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Lấy danh sách người dùng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo email hoặc tên
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                   full_name:
 *                     type: string
 *                   role:
 *                     type: string
 *                   status:
 *                     type: string
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/users', adminController.getUserList);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Tạo người dùng mới (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               fullName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *     responses:
 *       201:
 *         description: Tạo người dùng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Email đã được sử dụng
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/users', adminController.createUser);

/**
 * @swagger
 * /api/admin/users/{userId}/status:
 *   put:
 *     summary: Cập nhật trạng thái người dùng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended]
 *                 description: Trạng thái mới
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/users/:userId/status', adminController.updateUserStatus);

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: Cập nhật quyền người dùng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: Quyền mới
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không thể tự thay đổi quyền của chính mình
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/users/:userId/role', adminController.updateUserRole);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Xóa người dùng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Không thể tự xóa chính mình
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/users/:userId', adminController.deleteUser);

/**
 * @swagger
 * /api/admin/history/{userId}:
 *   get:
 *     summary: Lấy lịch sử chuẩn đoán của một người dùng (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Danh sách lịch sử chuẩn đoán
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   diagnosis_id:
 *                     type: integer
 *                   user_id:
 *                     type: integer
 *                   image_url:
 *                     type: string
 *                     format: uri
 *                   disease_name:
 *                     type: string
 *                   confidence_score:
 *                     type: number
 *                     format: float
 *                   result_json:
 *                     type: object
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/history/:userId', adminController.getHistoryForUser);

// === Reports ===
/**
 * @swagger
 * /api/admin/reports/diagnosis:
 *   get:
 *     summary: Báo cáo Chi tiết Chuẩn đoán với filters (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: diseaseName
 *         schema:
 *           type: string
 *       - in: query
 *         name: minConfidence
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxConfidence
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Báo cáo chuẩn đoán
 */
router.get('/reports/diagnosis', adminController.getDiagnosisReport);
router.get('/reports/diagnosis/export', adminController.exportDiagnosisReport);
router.get('/reports/user-growth', adminController.getUserGrowthReport);
router.get('/reports/ai-difficult-cases', adminController.getAIDifficultCases);
router.get('/reports/ai-difficult-cases/export', adminController.exportAIDifficultCases);

module.exports = router;