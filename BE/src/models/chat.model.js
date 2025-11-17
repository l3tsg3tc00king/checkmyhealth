const { pool } = require('../config/db');

const chatModel = {
    /**
     * Lấy lịch sử chat của một user
     * @param {number} userId
     * @param {number} limit - số bản ghi tối đa, mặc định 50 (tính theo tin nhắn mới nhất)
     */
    getHistory: async (userId, limit = 50) => {
        try {
            const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;
            // Lấy các tin mới nhất rồi sắp xếp lại theo thời gian tăng dần để giữ ngữ cảnh
            const [rows] = await pool.query(
                `SELECT role, content 
                 FROM (
                   SELECT role, content, timestamp
                   FROM chat_history 
                   WHERE user_id = ? 
                   ORDER BY timestamp DESC 
                   LIMIT ?
                 ) AS recent
                 ORDER BY timestamp ASC`,
                [userId, safeLimit]
            );
            return rows; // Trả về mảng [ {role: 'user', content: '...'}, {role: 'model', content: '...'} ]
        } catch (error) {
            console.error('Error getting chat history:', error);
            throw error;
        }
    },

    /**
     * Thêm một tin nhắn vào lịch sử
     */
    createEntry: async (userId, role, content) => {
        try {
            await pool.query(
                'INSERT INTO chat_history (user_id, `role`, content) VALUES (?, ?, ?)',
                [userId, role, content]
            );
            return true;
        } catch (error) {
            console.error('Error creating chat entry:', error);
            throw error;
        }
    }
};

module.exports = chatModel;