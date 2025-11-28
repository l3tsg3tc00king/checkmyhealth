const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');

/**
 * @swagger
 * /api/admin/statistics/export:
 *   get:
 *     summary: Export thống kê ra file (Public endpoint, không cần auth)
 *     tags: [Admin]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *         description: "Định dạng file (mặc định: csv)"
 *     responses:
 *       200:
 *         description: File được tải về
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/statistics/export', adminController.exportStatistics);

/**
 * @swagger
 * /api/admin/feedback/{feedbackId}:
 *   delete:
 *     summary: Xóa phản hồi (Public endpoint, không cần auth)
 *     tags: [Admin]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phản hồi
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy phản hồi
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/feedback/:feedbackId', adminController.deleteFeedback);

/**
 * @swagger
 * /api/admin/feedback/{feedbackId}/status:
 *   put:
 *     summary: Cập nhật trạng thái phản hồi (Public endpoint, không cần auth)
 *     tags: [Admin]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phản hồi
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
 *                 enum: [pending, reviewed, resolved]
 *                 description: Trạng thái mới
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy phản hồi
 *       500:
 *         description: Lỗi máy chủ
 */
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

/**
 * @swagger
 * /api/admin/statistics/timeseries:
 *   get:
 *     summary: Lấy thống kê theo chuỗi thời gian (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *         description: "Khoảng thời gian (mặc định: day)"
 *     responses:
 *       200:
 *         description: Thống kê theo chuỗi thời gian
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/statistics/timeseries', adminController.getStatisticsTimeseries);

/**
 * @swagger
 * /api/admin/statistics/breakdown:
 *   get:
 *     summary: Lấy thống kê chi tiết theo từng loại (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [disease, user, diagnosis]
 *         description: Loại thống kê
 *     responses:
 *       200:
 *         description: Thống kê chi tiết
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/statistics/breakdown', adminController.getStatisticsBreakdown);

/**
 * @swagger
 * /api/admin/statistics/export:
 *   get:
 *     summary: Export thống kê ra file (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *         description: "Định dạng file (mặc định: csv)"
 *     responses:
 *       200:
 *         description: File được tải về
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/statistics/export', adminController.exportStatistics);

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Lấy thống kê tổng quan cho dashboard (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 totalDiagnoses:
 *                   type: integer
 *                 totalDiseases:
 *                   type: integer
 *                 recentActivity:
 *                   type: object
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/dashboard/stats', adminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/feedback:
 *   get:
 *     summary: Lấy danh sách phản hồi (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: feedback_type
 *         schema:
 *           type: string
 *           enum: [bug, feature, improvement, other]
 *         description: Lọc theo loại phản hồi
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Số item mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách phản hồi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feedbacks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       feedback_id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       feedback_type:
 *                         type: string
 *                       content:
 *                         type: string
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
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

/**
 * @swagger
 * /api/admin/reports/diagnosis/export:
 *   get:
 *     summary: Export báo cáo chẩn đoán ra file (Admin only)
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
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *         description: "Định dạng file (mặc định: csv)"
 *     responses:
 *       200:
 *         description: File được tải về
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/reports/diagnosis/export', adminController.exportDiagnosisReport);

/**
 * @swagger
 * /api/admin/reports/user-growth:
 *   get:
 *     summary: Báo cáo tăng trưởng người dùng (Admin only)
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
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Báo cáo tăng trưởng người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 growth:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       newUsers:
 *                         type: integer
 *                       totalUsers:
 *                         type: integer
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/reports/user-growth', adminController.getUserGrowthReport);

/**
 * @swagger
 * /api/admin/reports/ai-difficult-cases:
 *   get:
 *     summary: Báo cáo các trường hợp chẩn đoán khó (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minConfidence
 *         schema:
 *           type: number
 *         description: Độ tin cậy tối thiểu (0-1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: "Số lượng kết quả (mặc định: 50)"
 *     responses:
 *       200:
 *         description: Danh sách trường hợp khó
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
 *                   disease_name:
 *                     type: string
 *                   confidence_score:
 *                     type: number
 *                   image_url:
 *                     type: string
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
router.get('/reports/ai-difficult-cases', adminController.getAIDifficultCases);

/**
 * @swagger
 * /api/admin/reports/ai-difficult-cases/export:
 *   get:
 *     summary: Export báo cáo trường hợp khó ra file (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *         description: "Định dạng file (mặc định: csv)"
 *     responses:
 *       200:
 *         description: File được tải về
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/reports/ai-difficult-cases/export', adminController.exportAIDifficultCases);

module.exports = router;