const diagnosisModel = require('../models/diagnosis.model');
// const axios = require('axios'); // Sẽ dùng khi team AI sẵn sàng

// --- MOCK FUNCTION (API AI) ---
const callAiApiMock = async (imageUrl) => {
    // Giả lập độ trễ mạng (AI đang xử lý)
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    console.log(`[Mock AI] Đã nhận ảnh để xử lý: ${imageUrl}`);
    
    // Giả lập kết quả
    return {
        disease_name: "Bệnh Vẩy Nến (Psoriasis)",
        confidence_score: 0.92,
        description: "Đây là mô tả giả lập về bệnh vẩy nến. Ảnh đã được upload thành công.",
        recommendation: "Bạn nên đi khám bác sĩ da liễu."
    };
};
// --- END MOCK ---

const diagnosisController = {
    /**
     * Xử lý upload ảnh và chẩn đoán
     */
    diagnose: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Vui lòng upload một file ảnh.' });
            }

            const userId = req.user.userId;

            // === SỬA LỖI Ở ĐÂY ===
            // Lấy URL từ 'secure_url' hoặc 'url', không phải 'path'
            const imageUrl = req.file.secure_url || req.file.url;
            // ====================

            // Kiểm tra lại nếu imageUrl vẫn undefined (dù hiếm)
            if (!imageUrl) {
                 return res.status(500).json({ message: 'Lỗi khi upload. Không nhận được URL ảnh.' });
            }
            
            const aiResult = await callAiApiMock(imageUrl);

            // Thêm image_url vào kết quả JSON để lưu vào DB
            const resultToSave = {
                ...aiResult,
                image_url: imageUrl // Thêm URL ảnh vào JSON
            };

            await diagnosisModel.create(
                userId,
                imageUrl, 
                aiResult.disease_name,
                aiResult.confidence_score,
                resultToSave // <-- Lưu JSON đầy đủ (có cả URL)
            );

            // Trả kết quả về cho App Flutter
            res.status(200).json(resultToSave);
                
        } catch (error) {
            console.error('Lỗi trong hàm diagnose:', error); // Log lỗi chi tiết
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * Lấy lịch sử chẩn đoán
     */
    getHistory: async (req, res) => {
        try {
            // 1. Lấy user ID từ token
            const userId = req.user.userId;

            // Cho phép client truyền ?limit=, mặc định 100, tối đa 500
            const limitParam = parseInt(req.query.limit, 10);
            const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 100;

            // 2. Gọi model để truy vấn DB
            const history = await diagnosisModel.findByUserId(userId, limit);

            // 3. Trả về kết quả
            res.status(200).json(history);

        } catch (error) {
            console.error('Lỗi trong hàm getHistory:', error); // Log lỗi chi tiết
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    }
};

module.exports = diagnosisController;