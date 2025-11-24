const diagnosisModel = require('../models/diagnosis.model');
const axios = require('axios');
const FormData = require('form-data');
const diseaseModel = require('../models/disease.model');
const { pool } = require('../config/db');

// === DANH SÁCH CLASS HỢP LỆ ===
const AI_TO_DB_MAP = {
    // 1. AI: nv (Melanocytic nevi) -> DB: Nevus
    'nv':    'Nevus',                   

    // 2. AI: vasc (Vascular lesions) -> DB: Vascular Lesion (Lưu ý: DB dùng số ít)
    'vasc':  'Vascular Lesion',          

    // 3. AI: bcc (Basal cell carcinoma) -> DB: Basal Cell Carcinoma
    'bcc':   'Basal Cell Carcinoma',    

    // 4. AI: mel (Melanoma) -> DB: Melanoma
    'mel':   'Melanoma',                

    // 5. AI: bkl (Benign keratosis) -> DB: Seborrheic Keratosis 
    // (Lưu ý: Trong y khoa và dataset, BKL thường ám chỉ Dày sừng tiết bã - Seborrheic Keratosis có trong DB của bạn)
    'bkl':   'Seborrheic Keratosis',    

    // 6. AI: df (Dermatofibroma) -> DB: Dermatofibroma
    'df':    'Dermatofibroma',          

    // 7. AI: akiec (Actinic keratoses) -> DB: Actinic Keratosis (Lưu ý: DB dùng số ít)
    'akiec': 'Actinic Keratosis'        
};

// === HÀM KIỂM TRA ẢNH CÓ PHẢI DA LIỄU KHÔNG ===
const validateSkinImage = (aiResult) => {
    // 1. Kiểm tra class có trong danh sách không
    const predictedClass = aiResult.prediction;
    
    if (!VALID_DISEASE_CLASSES[predictedClass]) {
        return {
            isValid: false,
            reason: 'unknown_class',
            message: 'AI không nhận diện được đây là ảnh bệnh da liễu'
        };
    }

    // 2. Kiểm tra confidence
    const confidence = aiResult.confidence;
    
    // Nếu confidence quá thấp (<30%), có thể là ảnh không đúng
    if (confidence < 0.3) {
        return {
            isValid: false,
            reason: 'low_confidence',
            message: 'Độ tin cậy quá thấp. Vui lòng chụp ảnh rõ hơn hoặc đảm bảo ảnh là vùng da bị tổn thương.'
        };
    }

    // 3. Kiểm tra top5 predictions
    // Nếu tất cả top5 đều có confidence thấp → có thể không phải ảnh da
    const top5Confidences = aiResult.top5.map(p => p.confidence);
    const maxTop5 = Math.max(...top5Confidences);
    
    if (maxTop5 < 0.5) {
        return {
            isValid: false,
            reason: 'ambiguous_image',
            message: 'Hình ảnh không rõ ràng hoặc không phải là ảnh bệnh da. Vui lòng chụp lại.'
        };
    }

    return {
        isValid: true
    };
};

// --- HÀM GỌI API AI THỰC TẾ (CẬP NHẬT) ---
const callAiApiReal = async (imageUrl) => {
    try {
        console.log(`[AI Step 1] Bắt đầu tải ảnh từ Cloudinary: ${imageUrl}`);

        // 1. Tải ảnh về
        const imageResponse = await axios.get(imageUrl, { 
            responseType: 'stream',
            timeout: 15000
        });
        console.log('[AI Step 2] Đã tải ảnh xong. Đang chuẩn bị gửi sang AI Server...');

        // 2. Chuẩn bị Form Data
        const form = new FormData();
        form.append('file', imageResponse.data, {
            filename: 'skin_image.jpg',
            contentType: 'image/jpeg'
        });

        // 3. Gửi sang AI Server
        console.log('[AI Step 2.5] Đang gửi request đến AI Server...');
        const aiResponse = await axios.post(
            'https://skin-lesion-api.fly.dev/predict', 
            form, 
            {
                headers: {
                    ...form.getHeaders(),
                },
                timeout: 90000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        console.log('[AI Step 3] AI Server đã phản hồi!');
        const aiResult = aiResponse.data;
        console.log('[AI Result]', JSON.stringify(aiResult, null, 2));

        // === 4. VALIDATION - KIỂM TRA ẢNH CÓ HỢP LỆ KHÔNG ===
       if (!aiResult || !aiResult.success) throw new Error('AI API Error');
        const validation = validateSkinImage(aiResult);
        if (!validation.isValid) {
            return {
                success: false,
                error_type: validation.reason,
                description: validation.message,
                is_valid_skin_image: false
            };
        }

        // === LOGIC MỚI: LẤY THÔNG TIN TỪ DB CỦA BẠN ===
        const predictedClass = aiResult.prediction; // VD: 'bcc'
        const dbDiseaseCode = AI_TO_DB_MAP[predictedClass]; // VD: 'Basal Cell Carcinoma'
        
        let diseaseInfo = null;
        let diseaseNameVi = "Chưa cập nhật";
        let infoId = null;

        // Truy vấn DB để lấy tên tiếng Việt và ID
        try {
            const [rows] = await pool.query(
                'SELECT info_id, disease_name_vi, description FROM skin_diseases_info WHERE disease_code = ?', 
                [dbDiseaseCode]
            );
            
            if (rows.length > 0) {
                diseaseInfo = rows[0];
                diseaseNameVi = diseaseInfo.disease_name_vi;
                infoId = diseaseInfo.info_id;
            }
        } catch (dbError) {
            console.error('Error fetching disease info:', dbError);
        }
        // ===============================================

        return {
            success: true,
            is_valid_skin_image: true,
            
            // Tên tiếng Anh (đúng chuẩn DB)
            disease_name: dbDiseaseCode, 
            // Tên tiếng Việt (Lấy từ DB)
            disease_name_vi: diseaseNameVi,
            // ID để frontend điều hướng (quan trọng)
            info_id: infoId,
            
            confidence_score: aiResult.confidence || 0.0,
            description: diseaseInfo ? diseaseInfo.description : (aiResult.description || "Đang cập nhật"),
            recommendation: aiResult.recommendation || "Vui lòng tham khảo ý kiến bác sĩ",
            
            prediction_code: predictedClass,
            top5_predictions: aiResult.top5 || [],
        };

    } catch (error) {
        console.error('AI Logic Error:', error);
        return { success: false, error_type: 'processing_error', description: 'Lỗi xử lý ảnh' };
    }
};

const diagnosisController = {
    diagnose: async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ message: 'Vui lòng upload ảnh.' });
            const imageUrl = req.file.secure_url || req.file.url;
            
            // Gọi AI + Tra cứu DB
            const aiResult = await callAiApiReal(imageUrl);

            if (!aiResult.success || aiResult.is_valid_skin_image === false) {
                return res.status(400).json(aiResult);
            }

            // Lưu lịch sử
            await diagnosisModel.create(
                req.user.userId,
                imageUrl, 
                aiResult.disease_name, // Lưu tên tiếng Anh chuẩn
                aiResult.confidence_score,
                aiResult // Lưu toàn bộ JSON (bao gồm info_id và tên tiếng Việt)
            );

            res.status(200).json(aiResult);
                
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    getHistory: async (req, res) => {
        try {
            const userId = req.user.userId;
            const history = await diagnosisModel.findByUserId(userId);
            res.status(200).json(history);
        } catch (error) {
            console.error('Lỗi trong hàm getHistory:', error);
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    }
};

module.exports = diagnosisController;