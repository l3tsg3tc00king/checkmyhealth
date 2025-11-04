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
     */
    findByUserId: async (userId) => {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM diagnosis_history WHERE user_id = ? ORDER BY diagnosed_at DESC',
                [userId]
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
    }



};

module.exports = diagnosisModel;