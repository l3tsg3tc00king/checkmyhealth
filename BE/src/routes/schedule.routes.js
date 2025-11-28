const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware); // Tất cả đều cần đăng nhập

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Tạo lịch trình mới
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - scheduled_date
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tiêu đề lịch trình
 *               description:
 *                 type: string
 *               scheduled_date:
 *                 type: string
 *                 format: date
 *                 description: Ngày thực hiện (YYYY-MM-DD)
 *               time:
 *                 type: string
 *                 description: Thời gian (HH:mm)
 *     responses:
 *       201:
 *         description: Tạo lịch trình thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', scheduleController.createSchedule);

/**
 * @swagger
 * /api/schedules/daily:
 *   get:
 *     summary: Lấy danh sách task theo ngày
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần lấy (YYYY-MM-DD), mặc định là hôm nay
 *     responses:
 *       200:
 *         description: Danh sách task theo ngày
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   schedule_id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   scheduled_date:
 *                     type: string
 *                     format: date
 *                   time:
 *                     type: string
 *                   is_completed:
 *                     type: boolean
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/daily', scheduleController.getDailyTasks);

/**
 * @swagger
 * /api/schedules/all:
 *   get:
 *     summary: Lấy tất cả lịch trình của người dùng
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tất cả lịch trình
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   schedule_id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   scheduled_date:
 *                     type: string
 *                     format: date
 *                   time:
 *                     type: string
 *                   is_completed:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/all', scheduleController.getAll);

/**
 * @swagger
 * /api/schedules/{scheduleId}/toggle:
 *   put:
 *     summary: Toggle trạng thái hoàn thành của task
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của lịch trình
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy lịch trình
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:scheduleId/toggle', scheduleController.toggleTask);

/**
 * @swagger
 * /api/schedules/{id}:
 *   delete:
 *     summary: Xóa lịch trình
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của lịch trình
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy lịch trình
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/:id', scheduleController.deleteSchedule);

/**
 * @swagger
 * /api/schedules/stats:
 *   get:
 *     summary: Lấy thống kê lịch trình
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê lịch trình
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Tổng số lịch trình
 *                 completed:
 *                   type: integer
 *                   description: Số lịch trình đã hoàn thành
 *                 pending:
 *                   type: integer
 *                   description: Số lịch trình chưa hoàn thành
 *                 completion_rate:
 *                   type: number
 *                   format: float
 *                   description: Tỷ lệ hoàn thành (%)
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/stats', scheduleController.getStats);

/**
 * @swagger
 * /api/schedules/{id}:
 *   put:
 *     summary: Cập nhật lịch trình
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của lịch trình
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               scheduled_date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               is_completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy lịch trình
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id', scheduleController.updateSchedule);

module.exports = router;