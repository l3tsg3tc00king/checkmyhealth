const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Nhập routes (MỚI)
const authRoutes = require('./routes/auth.routes'); 
const diagnosisRoutes = require('./routes/diagnosis.routes');
const profileRoutes = require('./routes/profile.routes');
const adminRoutes = require('./routes/admin.routes');
const newsRoutes = require('./routes/news.routes');

// Database initialization
const { initializeDatabase } = require('./config/init');

// Swagger
const { swaggerUi, swaggerSpec } = require('./config/swagger');

const app = express();

// --- Middlewares ---

// -----------------------------------------------------------------
// BẮT ĐẦU PHẦN CẬP NHẬT CORS
// -----------------------------------------------------------------
// Cấu hình CORS để chấp nhận URL chính, localhost, và tất cả các URL preview của Vercel
const allowedOrigins = [
    process.env.FRONTEND_URL, // URL chính (ví dụ: https://checkmyhealthskindetect.vercel.app)
    'http://localhost:5173',    // Cho phép dev ở local (sửa port nếu cần)
    'http://localhost:3000'     // Thêm các port dev khác nếu có
];

const corsOptions = {
    origin: function (origin, callback) {
        // 1. Cho phép nếu origin nằm trong "danh sách trắng" (allowedOrigins)
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        // 2. Cho phép nếu origin là một URL "preview" của Vercel
        else if (origin && origin.endsWith('.vercel.app')) {
            callback(null, true);
        }
        // 3. Cho phép các request không có origin (ví dụ: Postman, Mobile Apps)
        else if (!origin) {
            callback(null, true);
        }
        // 4. Chặn tất cả các trường hợp khác
        else {
            callback(new Error('CORS Error: This origin is not allowed.'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions)); // <-- SỬ DỤNG CẤU HÌNH MỚI
// -----------------------------------------------------------------
// KẾT THÚC PHẦN CẬP NHẬT CORS
// -----------------------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- Routes ---
/**
 * @swagger
 * /:
 * get:
 * summary: Welcome endpoint
 * tags: [General]
 * responses:
 * 200:
 * description: Welcome message
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: Welcome to Skin Disease Diagnosis API!
 */
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Skin Disease Diagnosis API!' });
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Gắn auth routes vào app (MỚI)
// Tất cả các route trong 'authRoutes' sẽ có tiền tố là '/api/auth'
// Ví dụ: /api/auth/register, /api/auth/login
app.use('/api/auth', authRoutes);
app.use('/api/diagnose', diagnosisRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);

// Initialize database tables
initializeDatabase().catch(error => {
    console.error('Fatal: Database initialization failed:', error);
    process.exit(1);
});

// --- Xuất app ra ---
module.exports = app;