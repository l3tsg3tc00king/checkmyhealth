const express = require('express');
const router = express.Router();
const multer = require('multer');
const diseaseController = require('../controllers/disease.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');
const uploadCloud = require('../config/cloudinary');

// Cấu hình multer cho import file (không upload lên cloudinary)
const uploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
            'application/csv'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv)'));
        }
    }
});

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

// Admin Only (Import/Export)
router.get('/export/all', authMiddleware, adminMiddleware, diseaseController.exportAll);
router.get('/export/sample', authMiddleware, adminMiddleware, diseaseController.exportSample);
router.post('/import', authMiddleware, adminMiddleware, uploadMemory.single('file'), diseaseController.import);

module.exports = router;