const { pool } = require('../config/db');

const diagnosisModel = {
    /**
     * Lưu kết quả chẩn đoán vào DB
     */
    create: async (userId, imageUrl, diseaseName, confidence, resultJson) => {
        try {
            const [result] = await pool.query(
                'INSERT INTO diagnosis_history (user_id, image_url, disease_name, confidence_score, result_json) VALUES (?, ?, ?, ?, ?)',
                [userId, imageUrl, diseaseName, confidence, JSON.stringify(resultJson)]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating diagnosis record:', error);
            throw error;
        }
    },

    /**
     * Lấy lịch sử chẩn đoán của một user
     * @param {number} userId
     * @param {number} limit - số bản ghi tối đa, mặc định 100
     */
    findByUserId: async (userId, limit = 100) => {
        try {
            const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 100;
            const [rows] = await pool.query(
                'SELECT * FROM diagnosis_history WHERE user_id = ? ORDER BY diagnosed_at DESC LIMIT ?',
                [userId, safeLimit]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching history:', error);
            throw error;
        }
    },
    
    /**
     * Đếm tổng số lượt chẩn đoán
     */
    getTotalDiagnoses: async () => {
        try {
            const [rows] = await pool.query('SELECT COUNT(*) as total FROM diagnosis_history');
            return rows[0].total;
        } catch (error) {
            console.error('Error counting diagnoses:', error);
            throw error;
        }
    },

    
    deleteById: async (historyId, userId) => {
        try {
            // Chỉ xóa nếu history_id khớp VÀ user_id khớp (Bảo mật)
            const [result] = await pool.query(
                'DELETE FROM diagnosis_history WHERE history_id = ? AND user_id = ?',
                [historyId, userId]
            );
            // result.affectedRows > 0 nghĩa là xóa thành công
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting history:', error);
            throw error;
        }
    },

    /**
     * (Admin) Lấy danh sách chẩn đoán với filters và pagination
     * @param {Object} filters - { startDate, endDate, diseaseName, minConfidence, maxConfidence }
     * @param {number} page - trang hiện tại (bắt đầu từ 1)
     * @param {number} pageSize - số bản ghi mỗi trang
     */
    getFilteredDiagnoses: async (filters = {}, page = 1, pageSize = 100) => {
        try {
            const safePage = Math.max(parseInt(page, 10) || 1, 1);
            const safePageSize = Math.min(Math.max(parseInt(pageSize, 10) || 100, 1), 500);
            const offset = (safePage - 1) * safePageSize;

            let query = `
                SELECT 
                    dh.history_id,
                    dh.user_id,
                    dh.image_url,
                    dh.disease_name,
                    dh.confidence_score,
                    dh.diagnosed_at,
                    dh.result_json,
                    u.email,
                    u.full_name
                FROM diagnosis_history dh
                LEFT JOIN users u ON dh.user_id = u.user_id
                WHERE 1=1
            `;
            const params = [];

            // Filter by date range
            if (filters.startDate) {
                query += ' AND DATE(dh.diagnosed_at) >= ?';
                params.push(filters.startDate);
            }
            if (filters.endDate) {
                // Include full day by adding time to end of day
                query += ' AND DATE(dh.diagnosed_at) <= ?';
                params.push(filters.endDate);
            }

            // Filter by disease name
            if (filters.diseaseName) {
                query += ' AND dh.disease_name LIKE ?';
                params.push(`%${filters.diseaseName}%`);
            }

            // Filter by confidence range
            if (filters.minConfidence !== undefined && filters.minConfidence !== null) {
                query += ' AND dh.confidence_score >= ?';
                params.push(parseFloat(filters.minConfidence));
            }
            if (filters.maxConfidence !== undefined && filters.maxConfidence !== null) {
                query += ' AND dh.confidence_score <= ?';
                params.push(parseFloat(filters.maxConfidence));
            }

            // Get total count
            const countQuery = query.replace(
                'SELECT \n                    dh.history_id,\n                    dh.user_id,\n                    dh.image_url,\n                    dh.disease_name,\n                    dh.confidence_score,\n                    dh.diagnosed_at,\n                    dh.result_json,\n                    u.email,\n                    u.full_name',
                'SELECT COUNT(*) as total'
            ).replace(/\n\s+ORDER BY.*$/, '');

            const [countResult] = await pool.query(countQuery, params);
            const total = countResult[0]?.total || 0;

            // Get paginated results
            query += ' ORDER BY dh.diagnosed_at DESC LIMIT ? OFFSET ?';
            params.push(safePageSize, offset);

            const [rows] = await pool.query(query, params);

            return {
                items: rows,
                total,
                page: safePage,
                pageSize: safePageSize,
                totalPages: Math.ceil(total / safePageSize)
            };
        } catch (error) {
            console.error('Error getting filtered diagnoses:', error);
            throw error;
        }
    },

    /**
     * (Admin) Lấy các ca khó (confidence < threshold)
     * @param {number} threshold - ngưỡng confidence (mặc định 0.6)
     * @param {number} limit - số lượng tối đa
     */
    getDifficultCases: async (threshold = 0.6, limit = 100) => {
        try {
            const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);
            const [rows] = await pool.query(
                `SELECT 
                    dh.history_id,
                    dh.user_id,
                    dh.image_url,
                    dh.disease_name,
                    dh.confidence_score,
                    dh.diagnosed_at,
                    dh.result_json,
                    u.email,
                    u.full_name
                FROM diagnosis_history dh
                LEFT JOIN users u ON dh.user_id = u.user_id
                WHERE dh.confidence_score < ?
                ORDER BY dh.confidence_score ASC, dh.diagnosed_at DESC
                LIMIT ?`,
                [threshold, safeLimit]
            );
            return rows;
        } catch (error) {
            console.error('Error getting difficult cases:', error);
            throw error;
        }
    }


};

module.exports = diagnosisModel;