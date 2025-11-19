
const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/disease.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');

// Public (User đã đăng nhập đều xem được)
router.get('/', authMiddleware, diseaseController.getList);
router.get('/:id', authMiddleware, diseaseController.getDetail);

// Admin Only (CRUD)
router.post('/', authMiddleware, adminMiddleware, diseaseController.create);
router.put('/:id', authMiddleware, adminMiddleware, diseaseController.update);
router.delete('/:id', authMiddleware, adminMiddleware, diseaseController.delete);

module.exports = router;