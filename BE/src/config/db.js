const mysql = require('mysql2/promise');
require('dotenv').config();
const { URL } = require('url'); // Dùng trình phân tích URL của Node.js

/**
 * Tạo cấu hình pool MySQL an toàn, tránh crash khi thiếu biến môi trường.
 */
let pool;

try {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // 1. Phân tích chuỗi DATABASE_URL
    const dbUrl = new URL(connectionString);

    // 2. Lấy các tùy chọn pool từ chuỗi (nếu có)
    const waitForConnections = dbUrl.searchParams.get('waitForConnections') === 'true';
    const connectionLimit = parseInt(dbUrl.searchParams.get('connectionLimit'), 10) || 10;
    const queueLimit = parseInt(dbUrl.searchParams.get('queueLimit'), 10) || 0;

    // 3. Kiểm tra xem có đang kết nối local không
    const isLocal = dbUrl.hostname === 'localhost' || dbUrl.hostname === '127.0.0.1';

    // 4. Tạo cấu hình pool cơ bản
    const poolConfig = {
        host: dbUrl.hostname,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.substring(1), // Bỏ dấu '/' ở đầu
        port: dbUrl.port,
        waitForConnections,
        connectionLimit,
        queueLimit
    };

    // 5. Chỉ thêm SSL nếu KHÔNG phải là local (tức là khi deploy lên Render)
    if (!isLocal) {
        poolConfig.ssl = {
            rejectUnauthorized: true
        };
    }

    // 6. Tạo Pool với cấu hình đã hoàn thiện
    pool = mysql.createPool(poolConfig);
} catch (error) {
    // Log lỗi rõ ràng để dễ debug khi deploy
    console.error('❌ Failed to initialize MySQL pool:', error.message);
    // Để quá trình khởi động fail sớm thay vì lỗi ngầm
    throw error;
}

// Hàm kiểm tra kết nối (giữ nguyên)
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully!');
        connection.release(); 
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = {
    pool,
    testConnection
};