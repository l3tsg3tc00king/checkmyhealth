const scheduleModel = require('../models/schedule.model');

const scheduleController = {
   createSchedule: async (req, res) => {
        try {
            // specific_date: "2023-11-25" (Optional)
            const { title, type, reminder_time, repeat_days, specific_date } = req.body;
            if (!title || !reminder_time) return res.status(400).json({ message: 'Thiếu thông tin' });

            // Logic: Nếu không có repeat_days thì bắt buộc phải có specific_date
            if ((!repeat_days || repeat_days.length === 0) && !specific_date) {
                return res.status(400).json({message: 'Phải chọn ngày lặp lại hoặc ngày cụ thể'});
            }

            // Validate và normalize type
            // Các giá trị hợp lệ theo database schema:
            // 'medication', 'skincare', 'checkup', 'other', 'exercise', 'appointment'
            const validTypes = ['medication', 'skincare', 'checkup', 'other', 'exercise', 'appointment'];
            // Nếu type không hợp lệ, mặc định là 'medication'
            const normalizedType = validTypes.includes(type) ? type : 'medication';

            const id = await scheduleModel.create(req.user.userId, { 
                title, 
                type: normalizedType, 
                reminder_time, 
                repeat_days, 
                specific_date 
            });
            res.status(201).json({ message: 'Đã tạo lịch trình', id: id });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },

    // --- HÀM MỚI: Update ---
    updateSchedule: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, type, reminder_time, repeat_days, specific_date } = req.body;
            
            // Validate và normalize type
            // Các giá trị hợp lệ theo database schema:
            // 'medication', 'skincare', 'checkup', 'other', 'exercise', 'appointment'
            const validTypes = ['medication', 'skincare', 'checkup', 'other', 'exercise', 'appointment'];
            // Nếu type không hợp lệ, mặc định là 'medication'
            const normalizedType = validTypes.includes(type) ? type : 'medication';
            
            await scheduleModel.update(req.user.userId, id, { 
                title, 
                type: normalizedType, 
                reminder_time, 
                repeat_days, 
                specific_date 
            });
            res.status(200).json({ message: 'Cập nhật thành công' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },
    
    

    // Lấy danh sách nhiệm vụ cho ngày cụ thể
    getDailyTasks: async (req, res) => {
        try {
            // Client gửi lên: ?date=2023-11-20&dayOfWeek=2
            const { date, dayOfWeek } = req.query; 
            if(!date || !dayOfWeek) return res.status(400).json({message: 'Thiếu ngày'});

            const tasks = await scheduleModel.getTasksByDate(req.user.userId, date, dayOfWeek);
            res.status(200).json(tasks);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },

    // Check / Uncheck
    toggleTask: async (req, res) => {
        try {
            const { scheduleId } = req.params;
            const { date, status } = req.body; // status: 'completed' or 'pending'
            
            await scheduleModel.toggleStatus(req.user.userId, scheduleId, date, status);
            res.status(200).json({ message: 'Đã cập nhật trạng thái' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },
    
    // Xóa
    deleteSchedule: async (req, res) => {
         try {
            const { id } = req.params;
            await scheduleModel.delete(id, req.user.userId);
            res.status(200).json({ message: 'Đã xóa' });
         } catch (error) {
            res.status(500).json({ message: 'Lỗi server', error: error.message });
         }
    },
    
    // Thống kê
    getStats: async (req, res) => {
        try {
            const stats = await scheduleModel.getStats(req.user.userId);
            res.status(200).json(stats);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },

    // Lấy tất cả lịch trình (không filter theo ngày)
    getAll: async (req, res) => {
        try {
            const schedules = await scheduleModel.getAll(req.user.userId);
            res.status(200).json(schedules);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    }
};

module.exports = scheduleController;