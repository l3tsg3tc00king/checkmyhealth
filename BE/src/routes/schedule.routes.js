const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware); // Tất cả đều cần đăng nhập

router.post('/', scheduleController.createSchedule);
router.get('/daily', scheduleController.getDailyTasks); // Lấy task của ngày
router.get('/all', scheduleController.getAll); // Lấy tất cả lịch trình
router.put('/:scheduleId/toggle', scheduleController.toggleTask); // Check xong
router.delete('/:id', scheduleController.deleteSchedule);
router.get('/stats', scheduleController.getStats); // Thống kê
router.put('/:id', scheduleController.updateSchedule);

module.exports = router;