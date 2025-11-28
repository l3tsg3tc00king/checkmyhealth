
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

// Public (Không cần đăng nhập)
/**
 * @swagger
 * /api/diseases:
 *   get:
 *     summary: Lấy danh sách bệnh lý (Public)
 *     tags: [Diseases]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mã bệnh
 *     responses:
 *       200:
 *         description: Danh sách bệnh lý
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   info_id:
 *                     type: integer
 *                   disease_code:
 *                     type: string
 *                   disease_name_vi:
 *                     type: string
 *                   description:
 *                     type: string
 *                   image_url:
 *                     type: string
 *                     format: uri
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/', diseaseController.getList);

/**
 * @swagger
 * /api/diseases/{id}:
 *   get:
 *     summary: Lấy chi tiết bệnh lý (Public)
 *     tags: [Diseases]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bệnh lý
 *     responses:
 *       200:
 *         description: Chi tiết bệnh lý
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 info_id:
 *                   type: integer
 *                 disease_code:
 *                   type: string
 *                 disease_name_vi:
 *                   type: string
 *                 description:
 *                   type: string
 *                 symptoms:
 *                   type: string
 *                 identification_signs:
 *                   type: string
 *                 prevention_measures:
 *                   type: string
 *                 treatments_medications:
 *                   type: string
 *                 dietary_advice:
 *                   type: string
 *                 source_references:
 *                   type: string
 *                 image_url:
 *                   type: string
 *                   format: uri
 *       404:
 *         description: Không tìm thấy bệnh lý
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id', diseaseController.getDetail);

// Admin Only (CRUD)
/**
 * @swagger
 * /api/diseases:
 *   post:
 *     summary: Tạo bệnh lý mới (Admin only)
 *     tags: [Diseases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - disease_code
 *               - disease_name_vi
 *             properties:
 *               disease_code:
 *                 type: string
 *                 example: "E11.9"
 *               disease_name_vi:
 *                 type: string
 *                 example: "Bệnh vẩy nến"
 *               description:
 *                 type: string
 *               symptoms:
 *                 type: string
 *               identification_signs:
 *                 type: string
 *               prevention_measures:
 *                 type: string
 *               treatments_medications:
 *                 type: string
 *               dietary_advice:
 *                 type: string
 *               source_references:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh minh họa (file upload)
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: URL ảnh minh họa (thay thế cho file upload)
 *     responses:
 *       201:
 *         description: Tạo bệnh lý thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', authMiddleware, adminMiddleware, uploadDiseaseImage, diseaseController.create);

/**
 * @swagger
 * /api/diseases/{id}:
 *   put:
 *     summary: Cập nhật bệnh lý (Admin only)
 *     tags: [Diseases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bệnh lý
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               disease_code:
 *                 type: string
 *               disease_name_vi:
 *                 type: string
 *               description:
 *                 type: string
 *               symptoms:
 *                 type: string
 *               identification_signs:
 *                 type: string
 *               prevention_measures:
 *                 type: string
 *               treatments_medications:
 *                 type: string
 *               dietary_advice:
 *                 type: string
 *               source_references:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh minh họa mới (file upload)
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: URL ảnh minh họa (thay thế cho file upload)
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       404:
 *         description: Không tìm thấy bệnh lý
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id', authMiddleware, adminMiddleware, uploadDiseaseImage, diseaseController.update);

/**
 * @swagger
 * /api/diseases/{id}:
 *   delete:
 *     summary: Xóa bệnh lý (Admin only)
 *     tags: [Diseases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bệnh lý
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       404:
 *         description: Không tìm thấy bệnh lý
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/:id', authMiddleware, adminMiddleware, diseaseController.delete);

// Admin Only (Import/Export)
/**
 * @swagger
 * /api/diseases/export/all:
 *   get:
 *     summary: Export tất cả bệnh lý ra file CSV (Admin only)
 *     tags: [Diseases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File CSV được tải về
 *         content:
 *           text/csv:
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
router.get('/export/all', authMiddleware, adminMiddleware, diseaseController.exportAll);

/**
 * @swagger
 * /api/diseases/export/sample:
 *   get:
 *     summary: Export file template CSV mẫu (Admin only)
 *     tags: [Diseases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File CSV template được tải về
 *         content:
 *           text/csv:
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
router.get('/export/sample', authMiddleware, adminMiddleware, diseaseController.exportSample);

/**
 * @swagger
 * /api/diseases/import:
 *   post:
 *     summary: Import bệnh lý từ file CSV/Excel (Admin only)
 *     tags: [Diseases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File CSV hoặc Excel (.csv, .xlsx, .xls)
 *     responses:
 *       200:
 *         description: Import thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 imported:
 *                   type: integer
 *                   description: Số bệnh lý đã import thành công
 *                 total:
 *                   type: integer
 *                   description: Tổng số dòng trong file
 *                 duplicates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       disease_code:
 *                         type: string
 *                       disease_name_vi:
 *                         type: string
 *                       existing_name:
 *                         type: string
 *       400:
 *         description: File không hợp lệ hoặc lỗi import
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/import', authMiddleware, adminMiddleware, uploadMemory.single('file'), diseaseController.import);

module.exports = router;