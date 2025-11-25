const cron = require('node-cron');
const { pool } = require('../config/db');
const notificationModel = require('../models/notification.model');

// Hàm ánh xạ ngày: JS(0=CN, 1=T2...) -> DB(8=CN, 2=T2...)
const getDbDay = (jsDay) => {
    return jsDay === 0 ? 8 : jsDay + 1;
};

const initScheduledJobs = () => {
    cron.schedule('* * * * *', async () => {
        const serverNow = new Date();
        const vnTimeStr = serverNow.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
        const vnNow = new Date(vnTimeStr); 

        const currentDay = getDbDay(vnNow.getDay());
        
        // Format YYYY-MM-DD cho so sánh ngày cụ thể
        const year = vnNow.getFullYear();
        const month = String(vnNow.getMonth() + 1).padStart(2, '0');
        const day = String(vnNow.getDate()).padStart(2, '0');
        const currentDateStr = `${year}-${month}-${day}`;

        const hours = String(vnNow.getHours()).padStart(2, '0');
        const minutes = String(vnNow.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${hours}:${minutes}`;

        try {
            // SỬA QUERY: Tìm task đúng giờ VÀ (có trong ngày lặp lại HOẶC đúng ngày cụ thể)
            const [schedules] = await pool.query(`
                SELECT s.schedule_id, s.user_id, s.title, s.type 
                FROM schedules s
                WHERE s.is_active = TRUE 
                AND DATE_FORMAT(s.reminder_time, '%H:%i') = ?
                AND (
                    FIND_IN_SET(?, s.repeat_days) > 0 
                    OR 
                    s.specific_date = ?
                )
            `, [currentTimeStr, currentDay, currentDateStr]);
            
            /* ... Phần gửi thông báo giữ nguyên ... */
            if (schedules.length > 0) {
                 for (const schedule of schedules) {
                    const title = `Đến giờ: ${schedule.title}`;
                    const message = `Đã đến giờ cho hoạt động ${schedule.type}.`;
                    await notificationModel.create(schedule.user_id, title, message);
                }
            }
        } catch (error) { console.error('[Cron] Error:', error); }
    });
};
module.exports = initScheduledJobs;