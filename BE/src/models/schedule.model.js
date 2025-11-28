const { pool } = require('../config/db');

const scheduleModel = {
    // Tạo lịch mới
    // 1. Create: Thêm logic specific_date
    create: async (userId, data) => {
        try {
            // Nếu repeat_days rỗng -> lưu specific_date
            const repeatDays = (data.repeat_days && data.repeat_days.length > 0) ? data.repeat_days : null;
            const specificDate = repeatDays ? null : data.specific_date; // 'YYYY-MM-DD'

            const [result] = await pool.query(
                `INSERT INTO schedules (user_id, title, type, reminder_time, repeat_days, specific_date) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, data.title, data.type, data.reminder_time, repeatDays, specificDate]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error create schedule:', error);
            throw error;
        }
    },

    // 2. Update (MỚI)
    update: async (userId, scheduleId, data) => {
        try {
            const repeatDays = (data.repeat_days && data.repeat_days.length > 0) ? data.repeat_days : null;
            const specificDate = repeatDays ? null : data.specific_date;

            await pool.query(
                `UPDATE schedules 
                 SET title = ?, type = ?, reminder_time = ?, repeat_days = ?, specific_date = ?
                 WHERE schedule_id = ? AND user_id = ?`,
                [data.title, data.type, data.reminder_time, repeatDays, specificDate, scheduleId, userId]
            );
            return true;
        } catch (error) { throw error; }
    },

    // 3. Get Tasks: Sửa logic OR (Lặp lại HOẶC Đúng ngày cụ thể)
    getTasksByDate: async (userId, dateStr, dayOfWeek) => {
        try {
            const sql = `
                SELECT 
                    s.*, 
                    l.status as log_status, 
                    l.completed_at,
                    DATE_FORMAT(s.specific_date, '%Y-%m-%d') as specific_date
                FROM schedules s
                LEFT JOIN schedule_logs l 
                    ON s.schedule_id = l.schedule_id 
                    AND l.check_date = ?
                WHERE s.user_id = ? 
                  AND s.is_active = TRUE
                  AND (
                      (s.repeat_days LIKE ?) -- Trường hợp lặp lại
                      OR 
                      (s.specific_date = ?)  -- Trường hợp không lặp (đúng ngày)
                  )
                ORDER BY s.reminder_time ASC
            `;
            const dayPattern = `%${dayOfWeek}%`; 
            
            const [rows] = await pool.query(sql, [dateStr, userId, dayPattern, dateStr]);
            return rows;
        } catch (error) {
            console.error('Error get tasks:', error);
            throw error;
        }
    },

    // Đánh dấu hoàn thành (Check-in)
    toggleStatus: async (userId, scheduleId, dateStr, status) => {
        try {
            // Kiểm tra xem đã có log chưa
            const [existing] = await pool.query(
                'SELECT log_id FROM schedule_logs WHERE schedule_id = ? AND check_date = ?',
                [scheduleId, dateStr]
            );

            if (existing.length > 0) {
                // Nếu có rồi -> Cập nhật (hoặc xóa nếu bỏ check - tùy logic, ở đây ta update)
                await pool.query(
                    'UPDATE schedule_logs SET status = ?, completed_at = NOW() WHERE log_id = ?',
                    [status, existing[0].log_id]
                );
            } else {
                // Chưa có -> Tạo mới
                await pool.query(
                    'INSERT INTO schedule_logs (schedule_id, user_id, check_date, status) VALUES (?, ?, ?, ?)',
                    [scheduleId, userId, dateStr, status]
                );
            }
            return true;
        } catch (error) { throw error; }
    },

    // Xóa lịch
    delete: async (id, userId) => {
        try {
            await pool.query('DELETE FROM schedules WHERE schedule_id = ? AND user_id = ?', [id, userId]);
            return true;
        } catch (error) { throw error; }
    },
    
    // Lấy thống kê % hoàn thành (cho biểu đồ)
    getStats: async (userId) => {
         try {
             const [rows] = await pool.query(`
                SELECT 
                    COUNT(*) as total_logs,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
                FROM schedule_logs
                WHERE user_id = ?
             `, [userId]);
             return rows[0];
         } catch (error) { throw error; }
    },

    // Lấy tất cả lịch trình (không filter theo ngày)
    getAll: async (userId) => {
        try {
            const sql = `
                SELECT 
                    s.*,
                    DATE_FORMAT(s.specific_date, '%Y-%m-%d') as specific_date
                FROM schedules s
                WHERE s.user_id = ? 
                  AND s.is_active = TRUE
                ORDER BY s.reminder_time ASC, s.title ASC
            `;
            const [rows] = await pool.query(sql, [userId]);
            return rows;
        } catch (error) {
            console.error('Error get all schedules:', error);
            throw error;
        }
    }
};

module.exports = scheduleModel;