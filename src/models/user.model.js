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
    },

    /**
     * Tìm user bằng ID
     */
    findById: async (userId) => {
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
            return rows[0];
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    },

    /**
     * Cập nhật thông tin cơ bản (ví dụ: fullName)
     */
    updateProfile: async (userId, fullName) => {
        try {
            await pool.query(
                'UPDATE users SET full_name = ? WHERE user_id = ?',
                [fullName, userId]
            );
            return true;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    /**
     * Lưu mã reset (đã hash) và thời gian hết hạn vào DB
     */
    setResetToken: async (userId, tokenHash, expiresAt) => {
        try {
            await pool.query(
                'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?',
                [tokenHash, expiresAt, userId]
            );
            return true;
        } catch (error) {
            console.error('Error setting reset token:', error);
            throw error;
        }
    },

    /**
     * Cập nhật mật khẩu mới và xóa token
     */
    resetPassword: async (userId, newPasswordHash) => {
        try {
            await pool.query(
                'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?',
                [newPasswordHash, userId]
            );
            return true;
        } catch (error) {
            console.error('Error resetting password:', error);
            throw error;
        }
    }



};

module.exports = userModel;