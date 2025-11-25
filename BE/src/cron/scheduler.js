const cron = require('node-cron');
const { pool } = require('../config/db');
const notificationModel = require('../models/notification.model');

// Hàm ánh xạ ngày: JS(0=CN, 1=T2...) -> DB(8=CN, 2=T2...)
const getDbDay = (jsDay) => {
    return jsDay === 0 ? 8 : jsDay + 1;
};

const initScheduledJobs = () => {
    // Chạy mỗi phút (* * * * *)
    cron.schedule('* * * * *', async () => {
        // === SỬA LỖI MÚI GIỜ TẠI ĐÂY ===
        // Lấy giờ hiện tại của Server, nhưng chuyển sang múi giờ Việt Nam
        const serverNow = new Date();
        const vnTimeStr = serverNow.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
        const vnNow = new Date(vnTimeStr); 

        const currentDay = getDbDay(vnNow.getDay());
        
        const hours = String(vnNow.getHours()).padStart(2, '0');
        const minutes = String(vnNow.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${hours}:${minutes}`;

        try {
            console.log(`[Cron] Checking schedules for ${currentTimeStr}, Day ${currentDay}...`);

            // 1. Tìm các lịch trình khớp giờ và khớp ngày
            // Lưu ý: Cần xử lý chuỗi repeat_days (VD: "2,3,4" chứa "2")
            const [schedules] = await pool.query(`
                SELECT s.schedule_id, s.user_id, s.title, s.type 
                FROM schedules s
                WHERE s.is_active = TRUE 
                AND DATE_FORMAT(s.reminder_time, '%H:%i') = ?
                AND FIND_IN_SET(?, s.repeat_days) > 0
            `, [currentTimeStr, currentDay]);

            if (schedules.length > 0) {
                console.log(`[Cron] Found ${schedules.length} tasks due.`);
                
                for (const schedule of schedules) {
                    // 2. Tạo thông báo trong Database (để hiện ở Tab Thông báo)
                    const title = `Đến giờ: ${schedule.title}`;
                    const message = `Đã đến giờ cho hoạt động ${schedule.type}. Hãy thực hiện và đánh dấu hoàn thành nhé!`;
                    
                    // Kiểm tra xem đã tạo thông báo hôm nay chưa (tránh spam nếu cron chạy trùng)
                    // (Ở đây làm đơn giản: cứ đến giờ là tạo)
                    await notificationModel.create(schedule.user_id, title, message);
                }
            }
        } catch (error) {
            console.error('[Cron] Error:', error);
        }
    });
};

module.exports = initScheduledJobs;