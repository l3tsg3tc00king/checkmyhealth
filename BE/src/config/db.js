const mysql = require('mysql2/promise');
require('dotenv').config(); 

const connectionString = process.env.DATABASE_URL;

// -----------------------------------------------------------------
// SỬA Ở ĐÂY:
// Truyền thẳng chuỗi `connectionString` vào `createPool`.
// Đừng bọc nó trong { connectionString: ... }
// -----------------------------------------------------------------
const pool = mysql.createPool(connectionString); 

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