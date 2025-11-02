const { pool } = require('../config/db'); // Nhập pool kết nối

const userModel = {
    /**
     * Tìm một user bằng email.
     * Dùng để kiểm tra email tồn tại (đăng ký) và để lấy thông tin (đăng nhập).
     */
    findByEmail: async (email) => {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM users WHERE email = ?', 
                [email]
            );
            // rows là một mảng, chúng ta chỉ cần phần tử đầu tiên (nếu có)
            return rows[0]; 
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    },

    /**
     * Tạo một user mới.
     * Dùng cho chức năng đăng ký.
     */
    create: async (email, passwordHash, fullName) => {
        try {
            const [result] = await pool.query(
                // Cột 'role' sẽ tự động nhận giá trị DEFAULT 'user'
                'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
                [email, passwordHash, fullName]
            );
            // Trả về ID của user vừa được tạo
            return result.insertId;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
};

module.exports = userModel;