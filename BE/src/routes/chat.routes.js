const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authMiddleware } = require('../middleware/auth.middleware');


/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Gửi tin nhắn chat và nhận phản hồi từ AI
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Nội dung tin nhắn
 *                 example: "Bệnh vẩy nến có lây không?"
 *     responses:
 *       200:
 *         description: Phản hồi từ AI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   description: Phản hồi từ AI
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', authMiddleware, chatController.generateResponse);

/**
 * @swagger
 * /api/chat/history:
 *   get:
 *     summary: Lấy lịch sử chat của người dùng
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch sử chat
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   chat_id:
 *                     type: integer
 *                   user_id:
 *                     type: integer
 *                   message:
 *                     type: string
 *                   response:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/history', authMiddleware, chatController.getChatHistory);

module.exports = router;