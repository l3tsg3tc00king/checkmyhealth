const { pool } = require('../config/db');

const feedbackModel = {
    /**
     * Tạo một phản hồi mới
     */
    create: async (userId, feedbackType, content) => {
        try {
            const [result] = await pool.query(
                'INSERT INTO feedback (user_id, feedback_type, content) VALUES (?, ?, ?)',
                [userId, feedbackType, content]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating feedback:', error);
            throw error;
        }
    }
};

module.exports = feedbackModel;