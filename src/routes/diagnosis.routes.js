const express = require('express');
const router = express.Router();
const diagnosisController = require('../controllers/diagnosis.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const uploadCloud = require('../config/cloudinary');

router.post(
    '/',
    authMiddleware,    // 1. Kiểm tra token
    uploadCloud.single('image'),  // 2. Xử lý file upload
    diagnosisController.diagnose // 3. Xử lý logic
);

router.get('/history', authMiddleware, diagnosisController.getHistory);

module.exports = router;