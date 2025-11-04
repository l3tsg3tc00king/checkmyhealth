const userModel = require('../models/user.model');
const diagnosisModel = require('../models/diagnosis.model');

const adminController = {
    /**
     * Lấy số liệu thống kê cho dashboard
     */
    getStatistics: async (req, res) => {
        try {
            const [totalUsers, totalDiagnoses] = await Promise.all([
                userModel.getTotalUsers(),
                diagnosisModel.getTotalDiagnoses()
            ]);
            res.status(200).json({
                totalUsers: totalUsers,
                totalDiagnoses: totalDiagnoses
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * (Admin) Lấy danh sách người dùng
     */
    getUserList: async (req, res) => {
        try {
            // Lấy tham số ?search=... từ URL
            const { search } = req.query; 
            const users = await userModel.getAllUsers(search);
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * (Admin) Cập nhật trạng thái (Đình chỉ / Kích hoạt)
     */
    updateUserStatus: async (req, res) => {
        try {
            const { userId } = req.params;
            const { status } = req.body; // "active" hoặc "suspended"

            if (!status || !['active', 'suspended'].includes(status)) {
                return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
            }
            await userModel.updateUserStatus(userId, status);
            res.status(200).json({ message: `Đã cập nhật trạng thái user thành ${status}` });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * (Admin) Cập nhật quyền (Sửa)
     */
    updateUserRole: async (req, res) => {
        try {
            const { userId } = req.params;
            const { role } = req.body; // "user" hoặc "admin"
            if (req.user.userId == userId) {
                 return res.status(400).json({ message: 'Không thể tự thay đổi quyền của chính mình.' });
            }

            if (!role || !['user', 'admin'].includes(role)) {
                return res.status(400).json({ message: 'Quyền không hợp lệ.' });
            }
            await userModel.updateUserRole(userId, role);
            res.status(200).json({ message: `Đã cập nhật quyền user thành ${role}` });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * (Admin) Xóa người dùng (Xóa)
     */
    deleteUser: async (req, res) => {
        try {
            const { userId } = req.params;
            
            // Cẩn trọng: Không cho admin tự xóa chính mình
            if (req.user.userId == userId) {
                 return res.status(400).json({ message: 'Không thể tự xóa chính mình.' });
            }

            await userModel.deleteUserById(userId);
            res.status(200).json({ message: 'Đã xóa người dùng thành công.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ. (Lưu ý: Đảm bảo DB đã bật ON DELETE CASCADE)', error: error.message });
        }
    },

    /**
     * (Admin) Lấy lịch sử chẩn đoán của 1 user cụ thể
     */
    getHistoryForUser: async (req, res) => {
        try {
            const { userId } = req.params;
            // Dùng lại hàm model của user
            const history = await diagnosisModel.findByUserId(userId); 
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    }

};

module.exports = adminController;