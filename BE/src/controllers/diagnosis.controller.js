const diagnosisModel = require('../models/diagnosis.model');
const axios = require('axios');
const FormData = require('form-data');

// --- HÀM GỌI API AI THỰC TẾ ---
const callAiApiReal = async (imageUrl) => {
    try {
        console.log(`[AI Step 1] Bắt đầu tải ảnh từ Cloudinary: ${imageUrl}`);

        // 1. Tải ảnh về (Thêm timeout 10s)
        const imageResponse = await axios.get(imageUrl, { 
            responseType: 'stream',
            timeout: 10000 // 10 giây
        });
        console.log('[AI Step 2] Đã tải ảnh xong. Đang chuẩn bị gửi sang AI Server...');

        // 2. Chuẩn bị Form Data
        const form = new FormData();
        form.append('file', imageResponse.data, {
            filename: 'skin_image.jpg',
            contentType: 'image/jpeg'
        });

        // 3. Gửi sang AI Server (Thêm timeout 60s và config upload)
        const aiResponse = await axios.post(
            'https://skin-lesion-api.fly.dev/predict', 
            form, 
            {
                headers: {
                    ...form.getHeaders(),
                },
                timeout: 60000, // Chờ tối đa 60 giây cho AI xử lý
                maxContentLength: Infinity,
                maxBodyLength: Infinity // Cho phép ảnh dung lượng lớn
            }
        );

        console.log('[AI Step 3] AI Server đã phản hồi!');
        const aiResult = aiResponse.data;
        console.log('[AI Result]', JSON.stringify(aiResult, null, 2)); // Log đẹp để dễ đọc

        // 4. Xử lý kết quả trả về (CẬP NHẬT CHO API MỚI)
        let diseaseName = "Không xác định";
        let confidence = 0.0;
        // Giá trị mặc định
        let description = "AI đã phân tích ảnh nhưng chưa rõ kết luận.";
        let recommendation = "Vui lòng tham khảo ý kiến bác sĩ.";

        if (aiResult && aiResult.success) {
            // Lấy tên đầy đủ (VD: "Melanocytic Nevus")
            diseaseName = aiResult.full_name || aiResult.prediction || "Không xác định";
            
            // Lấy độ tin cậy (API trả về 0.98..., ta giữ nguyên hoặc nhân 100 tùy App hiển thị)
            // Code App của bạn đang nhân 100 ở UI, nên ở đây ta để nguyên số thập phân (0.0 - 1.0)
            // API của bạn trả về 0.988... (tức là < 1) -> Ổn.
            // NHƯNG CẨN THẬN: Nếu API trả về 98.8 (lớn hơn 1) thì phải chia 100.
            // Nhìn log: "confidence": 0.988... -> OK, giữ nguyên.
            confidence = aiResult.confidence || 0.0;

            // Lấy mô tả từ API (Nếu có)
            if (aiResult.description) {
                description = aiResult.description;
            } else {
                description = `Hệ thống phát hiện dấu hiệu của: ${diseaseName}.`;
            }

            // Lấy khuyến nghị từ API (Nếu có)
            if (aiResult.recommendation) {
                recommendation = aiResult.recommendation;
            }
        }

        return {
            disease_name: diseaseName,
            confidence_score: confidence,
            description: description,
            recommendation: recommendation,
            raw_data: aiResult
        };

    } catch (error) {
        // Log lỗi chi tiết hơn để biết sai ở đâu
        if (error.response) {
            // Lỗi do Server AI trả về (VD: 400, 500)
            console.error('[AI Error Response]', error.response.status, error.response.data);
        } else if (error.request) {
            // Lỗi do không nhận được phản hồi (Timeout)
            console.error('[AI Error Request] Không nhận được phản hồi từ AI Server (Timeout)');
        } else {
            console.error('[AI Error Message]', error.message);
        }

        return {
            disease_name: "Lỗi kết nối AI",
            confidence_score: 0.0,
            description: "Máy chủ AI đang bận hoặc quá tải. Vui lòng thử lại sau.",
            recommendation: "Vui lòng kiểm tra lại kết nối mạng."
        };
    }
};

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
            
            // Lấy URL từ Cloudinary
            const imageUrl = req.file.secure_url || req.file.url;

            if (!imageUrl) {
                 return res.status(500).json({ message: 'Lỗi khi upload. Không nhận được URL ảnh.' });
            }
            
            // === GỌI AI THẬT ===
            const aiResult = await callAiApiReal(imageUrl);

            // Chuẩn bị dữ liệu lưu DB
            // (Lưu ý: result_json sẽ chứa toàn bộ data trả về từ AI để sau này Admin soi)
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

            // Trả kết quả về cho App Flutter
            res.status(200).json(resultToSave);
                
        } catch (error) {
            console.error('Lỗi trong hàm diagnose:', error);
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * Lấy lịch sử chẩn đoán
     */
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