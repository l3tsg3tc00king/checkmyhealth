const { pool } = require('../config/db');

const diseaseModel = {
    // Lấy danh sách (có tìm kiếm)
    getAll: async (search = '') => {
        try {
            let query = 'SELECT info_id, disease_code, disease_name_vi, image_url FROM skin_diseases_info';
            let params = [];

            if (search) {
                query += ' WHERE disease_name_vi LIKE ? OR disease_code LIKE ?';
                params.push(`%${search}%`, `%${search}%`);
            }
            
            query += ' ORDER BY disease_name_vi ASC';

            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error('Error getting diseases:', error);
            throw error;
        }
    },

    // Lấy chi tiết 1 bệnh
    getById: async (id) => {
        try {
            const [rows] = await pool.query('SELECT * FROM skin_diseases_info WHERE info_id = ?', [id]);
            return rows[0];
        } catch (error) {
            console.error('Error getting disease detail:', error);
            throw error;
        }
    },

    // (Admin) Thêm bệnh mới
    create: async (data) => {
        try {
            const sql = `
                INSERT INTO skin_diseases_info 
                (disease_code, disease_name_vi, description, symptoms, identification_signs, prevention_measures, treatments_medications, dietary_advice, source_references, image_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await pool.query(sql, [
                data.disease_code,
                data.disease_name_vi,
                data.description,
                data.symptoms,
                data.identification_signs,
                data.prevention_measures,
                data.treatments_medications,
                data.dietary_advice,
                data.source_references,
                data.image_url || null
            ]);
            return result.insertId;
        } catch (error) {
            console.error('Error creating disease:', error);
            throw error;
        }
    },

    // (Admin) Cập nhật
    update: async (id, data) => {
        try {
            const sql = `
                UPDATE skin_diseases_info SET
                disease_code = ?, disease_name_vi = ?, description = ?, symptoms = ?, 
                identification_signs = ?, prevention_measures = ?, treatments_medications = ?, 
                dietary_advice = ?, source_references = ?, image_url = ?
                WHERE info_id = ?
            `;
            await pool.query(sql, [
                data.disease_code,
                data.disease_name_vi,
                data.description,
                data.symptoms,
                data.identification_signs,
                data.prevention_measures,
                data.treatments_medications,
                data.dietary_advice,
                data.source_references,
                data.image_url || null,
                id
            ]);
            return true;
        } catch (error) {
            console.error('Error updating disease:', error);
            throw error;
        }
    },

    // (Admin) Xóa
    delete: async (id) => {
        try {
            await pool.query('DELETE FROM skin_diseases_info WHERE info_id = ?', [id]);
            return true;
        } catch (error) {
            console.error('Error deleting disease:', error);
            throw error;
        }
    }
};

module.exports = diseaseModel;