const app = require('./app');
const { testConnection } = require('./config/db');

// Lấy PORT từ file .env, nếu không có thì mặc định là 3000
const PORT = process.env.PORT || 3000;

// Hàm khởi động server
const startServer = async () => {
    // 1. Kiểm tra kết nối database
    await testConnection();

    // 2. Khởi động server
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`Access at: http://localhost:${PORT}`);
    });
};

// Chạy server
startServer();