const rateLimit = require('express-rate-limit');

// 1. Giới hạn chung cho toàn bộ ứng dụng (Chống DDoS cơ bản)
// Mỗi IP chỉ được gửi 100 request trong 15 phút
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true, 
    legacyHeaders: false,
    message: {
        message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút."
    }
});

// 2. Giới hạn đăng nhập/đăng ký (Chống Brute Force)
// Mỗi IP chỉ được thử đăng nhập/đăng ký 5 lần trong 15 phút
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, 
    message: {
        message: "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút."
    }
});

// 3. Giới hạn yêu cầu gửi Email OTP (Chống Spam Email)
// Mỗi IP chỉ được yêu cầu gửi mail 3 lần trong 1 giờ
const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3, 
    message: {
        message: "Bạn đã yêu cầu gửi mã quá nhiều lần. Vui lòng thử lại sau 1 giờ."
    }
});

module.exports = {
    globalLimiter,
    authLimiter,
    emailLimiter
};