const diagnosisModel = require('../models/diagnosis.model');
const axios = require('axios');
const FormData = require('form-data');

// === DANH SÁCH CLASS HỢP LỆ ===
const VALID_DISEASE_CLASSES = {
    'akiec': 'Actinic Keratoses',
    'bcc': 'Basal Cell Carcinoma', 
    'bkl': 'Benign Keratosis',
    'df': 'Dermatofibroma',
    'mel': 'Melanoma',
    'nv': 'Melanocytic Nevus',
    'vasc': 'Vascular Lesion'
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
        if (!aiResult || !aiResult.success) {
            throw new Error('AI API trả về kết quả không hợp lệ');
        }

        const validation = validateSkinImage(aiResult);
        
        if (!validation.isValid) {
            // Trả về lỗi validation với thông báo cụ thể
            return {
                success: false,
                error_type: validation.reason,
                disease_name: "Không phải ảnh bệnh da",
                confidence_score: 0.0,
                description: validation.message,
                recommendation: "Vui lòng chụp ảnh vùng da bị tổn thương với ánh sáng đủ và góc chụp rõ ràng.",
                is_valid_skin_image: false
            };
        }
        // ================================================

        // 5. Map dữ liệu từ AI API sang format Backend
        const result = {
            success: true,
            is_valid_skin_image: true,
            disease_name: aiResult.full_name || aiResult.prediction || "Không xác định",
            confidence_score: aiResult.confidence || 0.0,
            description: aiResult.description || `Phát hiện dấu hiệu của: ${aiResult.full_name}`,
            recommendation: aiResult.recommendation || "Vui lòng tham khảo ý kiến bác sĩ",
            risk_level: aiResult.risk_level || "unknown",
            
            // Thông tin bổ sung
            prediction_code: aiResult.prediction,
            top5_predictions: aiResult.top5 || [],
            inference_time_ms: aiResult.inference_time_ms || 0,
            
            // Raw data
            raw_data: aiResult
        };

        console.log('[AI Result Validated & Mapped]', JSON.stringify(result, null, 2));
        return result;

    } catch (error) {
        console.error('=== AI API ERROR ===');
        
        if (error.response) {
            console.error('[Status]', error.response.status);
            console.error('[Data]', error.response.data);
            
            return {
                success: false,
                error_type: 'ai_server_error',
                disease_name: "Lỗi từ AI Server",
                confidence_score: 0.0,
                description: `AI Server trả về lỗi: ${error.response.status}`,
                recommendation: "Vui lòng thử lại sau",
                is_valid_skin_image: null
            };
            
        } else if (error.request) {
            console.error('[Request Error] Không nhận được phản hồi từ AI Server');
            
            return {
                success: false,
                error_type: 'timeout',
                disease_name: "Timeout kết nối AI",
                confidence_score: 0.0,
                description: "Máy chủ AI đang khởi động hoặc quá tải. Vui lòng thử lại sau 30 giây.",
                recommendation: "Nếu lỗi vẫn tiếp diễn, vui lòng liên hệ support",
                is_valid_skin_image: null
            };
            
        } else {
            console.error('[Error Message]', error.message);
            
            return {
                success: false,
                error_type: 'processing_error',
                disease_name: "Lỗi xử lý",
                confidence_score: 0.0,
                description: "Có lỗi xảy ra khi xử lý ảnh",
                recommendation: "Vui lòng kiểm tra định dạng ảnh và thử lại",
                is_valid_skin_image: null
            };
        }
    }
};

const diagnosisController = {
    diagnose: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Vui lòng upload một file ảnh.' });
            }

            const userId = req.user.userId;
            const imageUrl = req.file.secure_url || req.file.url;

            if (!imageUrl) {
                return res.status(500).json({ message: 'Lỗi khi upload. Không nhận được URL ảnh.' });
            }
            
            // Gọi AI
            const aiResult = await callAiApiReal(imageUrl);

            // === KIỂM TRA KẾT QUẢ VALIDATION ===
            if (!aiResult.success || aiResult.is_valid_skin_image === false) {
                // Không lưu vào database nếu ảnh không hợp lệ
                return res.status(400).json({
                    success: false,
                    message: aiResult.description,
                    error_type: aiResult.error_type,
                    recommendation: aiResult.recommendation
                });
            }
            // ====================================

            // Chuẩn bị dữ liệu lưu DB
            const resultToSave = {
                ...aiResult,
                image_url: imageUrl
            };

            // Lưu vào Database
            await diagnosisModel.create(
                userId,
                imageUrl, 
                aiResult.disease_name,
                aiResult.confidence_score,
                resultToSave 
            );

            // Trả kết quả về cho App
            res.status(200).json(resultToSave);
                
        } catch (error) {
            console.error('Lỗi trong hàm diagnose:', error);
            res.status(500).json({ 
                success: false,
                message: 'Lỗi máy chủ', 
                error: error.message 
            });
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