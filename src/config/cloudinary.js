const cloudinary = require('cloudinary').v2; // Dùng v2
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Cấu hình Cloudinary bằng biến môi trường
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình bộ lưu trữ cho Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'skin_app_uploads', // Tên thư mục trên Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png'],
        // (Tùy chọn) Tự động tối ưu hóa ảnh khi upload
        transformation: [{ width: 1024, height: 1024, crop: 'limit' }]
    }
});

// Xuất ra middleware upload đã cấu hình
const uploadCloud = multer({ storage: storage });

module.exports = uploadCloud;