const { pool } = require('../config/db');

const diseaseModel = {
    // Lấy danh sách (có tìm kiếm THEO TÊN HOẶC TRIỆU CHỨNG)
    getAll: async (search = '') => {
        try {
            let query = 'SELECT info_id, disease_code, disease_name_vi, image_url, symptoms FROM skin_diseases_info';
            let params = [];

            if (search) {
                // Tách từ khóa tìm kiếm thành các từ riêng biệt để tìm kiếm chính xác hơn
                const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
                
                if (searchTerms.length > 0) {
                    // Tạo điều kiện tìm kiếm cho mỗi từ khóa
                    // Mỗi từ khóa sẽ tìm trong: tên bệnh, mã bệnh, hoặc triệu chứng
                    const conditions = [];
                    const allParams = [];
                    
                    searchTerms.forEach(term => {
                        const searchPattern = `%${term}%`;
                        // Tìm kiếm trong tên bệnh, mã bệnh, hoặc triệu chứng
                        conditions.push('(disease_name_vi LIKE ? OR disease_code LIKE ? OR symptoms LIKE ?)');
                        allParams.push(searchPattern, searchPattern, searchPattern);
                    });
                    
                    // Tất cả các từ khóa phải xuất hiện (AND logic)
                    query += ' WHERE ' + conditions.join(' AND ');
                    params = allParams;
                }
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
    },

    // Lấy tất cả dữ liệu để export
    getAllForExport: async () => {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    disease_code,
                    disease_name_vi,
                    description,
                    symptoms,
                    identification_signs,
                    prevention_measures,
                    treatments_medications,
                    dietary_advice,
                    source_references,
                    image_url
                FROM skin_diseases_info
                ORDER BY disease_name_vi ASC
            `);
            return rows;
        } catch (error) {
            console.error('Error getting diseases for export:', error);
            throw error;
        }
    },

    // Kiểm tra duplicate theo disease_code
    checkDuplicates: async (diseaseCodes) => {
        try {
            if (diseaseCodes.length === 0) return [];
            
            const placeholders = diseaseCodes.map(() => '?').join(', ');
            const [rows] = await pool.query(
                `SELECT disease_code, disease_name_vi FROM skin_diseases_info WHERE disease_code IN (${placeholders})`,
                diseaseCodes
            );
            return rows;
        } catch (error) {
            console.error('Error checking duplicates:', error);
            throw error;
        }
    },

    // Import nhiều bệnh cùng lúc
    bulkCreate: async (diseases) => {
        try {
            if (diseases.length === 0) return 0;
            
            const placeholders = diseases.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
            const sql = `
                INSERT INTO skin_diseases_info 
                (disease_code, disease_name_vi, description, symptoms, identification_signs, 
                 prevention_measures, treatments_medications, dietary_advice, source_references, image_url)
                VALUES ${placeholders}
            `;
            
            const values = diseases.flatMap(d => [
                d.disease_code || null,
                d.disease_name_vi || null,
                d.description || null,
                d.symptoms || null,
                d.identification_signs || null,
                d.prevention_measures || null,
                d.treatments_medications || null,
                d.dietary_advice || null,
                d.source_references || null,
                d.image_url || null
            ]);
            
            const [result] = await pool.query(sql, values);
            return result.affectedRows;
        } catch (error) {
            console.error('Error bulk creating diseases:', error);
            throw error;
        }
    }
};

module.exports = diseaseModel;