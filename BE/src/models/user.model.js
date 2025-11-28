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
    create: async (email, passwordHash, fullName, avatarUrl = null) => {
        try {
            const [result] = await pool.query(
                `INSERT INTO users (email, password_hash, full_name, avatar_url) 
                VALUES (?, ?, ?, ?)`,
                [email, passwordHash, fullName, avatarUrl]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    /**
     * Tạo một user mới với role (Admin only)
     */
    createWithRole: async (email, passwordHash, fullName, role = 'user') => {
        try {
            const [result] = await pool.query(
                'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
                [email, passwordHash, fullName, role]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating user with role:', error);
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
    },

    /**
     * Đếm tổng số người dùng
     */
    getTotalUsers: async () => {
        try {
            const [rows] = await pool.query('SELECT COUNT(*) as total FROM users');
            return rows[0].total;
        } catch (error) {
            console.error('Error counting users:', error);
            throw error;
        }
    },

    /**
     * (Admin) Lấy danh sách user có phân trang đơn giản
     * @param {string} searchTerm
     * @param {number} page - trang hiện tại (bắt đầu từ 1)
     * @param {number} pageSize - số bản ghi mỗi trang
     */
    getAllUsers: async (searchTerm = '', page = 1, pageSize = 100) => {
        try {
            const safePage = Math.max(parseInt(page, 10) || 1, 1);
            const safePageSize = Math.min(Math.max(parseInt(pageSize, 10) || 100, 1), 500);
            const offset = (safePage - 1) * safePageSize;

            let baseQuery = 'FROM users';
            const params = [];

            if (searchTerm) {
                // Tìm kiếm cả tên VÀ email
                baseQuery += ' WHERE full_name LIKE ? OR email LIKE ?';
                params.push(`%${searchTerm}%`, `%${searchTerm}%`);
            }

            // Lấy tổng số trước (phục vụ paging nếu cần)
            const [countRows] = await pool.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
            const total = countRows[0]?.total ?? 0;

            // Lấy dữ liệu trang hiện tại
            const [rows] = await pool.query(
                `SELECT user_id, email, full_name, role, provider, account_status, created_at ${baseQuery} ORDER BY user_id ASC LIMIT ? OFFSET ?`,
                [...params, safePageSize, offset]
            );

            return {
                items: rows,
                total,
                page: safePage,
                pageSize: safePageSize
            };
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    },

    /**
     * (Admin) Cập nhật trạng thái (active/suspended)
     */
    updateUserStatus: async (userId, status) => {
        try {
            await pool.query(
                'UPDATE users SET account_status = ? WHERE user_id = ?',
                [status, userId]
            );
            return true;
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    },

    /**
     * (Admin) Cập nhật quyền (user/admin)
     */
    updateUserRole: async (userId, role) => {
        try {
            await pool.query(
                'UPDATE users SET role = ? WHERE user_id = ?',
                [role, userId]
            );
            return true;
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    },

    /**
     * (Admin) Xóa vĩnh viễn user (Yêu cầu ON DELETE CASCADE)
     */
    deleteUserById: async (userId) => {
        try {
            await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    /**
     * (User) Cập nhật avatar
     */
    updateAvatar: async (userId, avatarUrl) => {
        try {
            await pool.query(
                'UPDATE users SET avatar_url = ? WHERE user_id = ?',
                [avatarUrl, userId]
            );
            return true;
        } catch (error) {
            console.error('Error updating avatar:', error);
            throw error;
        }
    }

};

module.exports = userModel;