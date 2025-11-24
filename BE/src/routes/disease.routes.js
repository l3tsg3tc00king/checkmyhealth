
const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/disease.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');
const uploadCloud = require('../config/cloudinary');

const uploadDiseaseImage = (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
        return next();
    }

    uploadCloud.single('image')(req, res, (err) => {
        if (err) {
            console.error('Upload disease image error:', err);
            return res.status(400).json({
                message: 'Lỗi upload ảnh bệnh lý. Vui lòng thử lại với file khác.',
                error: err.message || String(err),
            });
        }
        next();
    });
};

// Public (User đã đăng nhập đều xem được)
router.get('/', authMiddleware, diseaseController.getList);
router.get('/:id', authMiddleware, diseaseController.getDetail);

// Admin Only (CRUD)
router.post('/', authMiddleware, adminMiddleware, uploadDiseaseImage, diseaseController.create);
router.put('/:id', authMiddleware, adminMiddleware, uploadDiseaseImage, diseaseController.update);
router.delete('/:id', authMiddleware, adminMiddleware, diseaseController.delete);

module.exports = router;