// Middleware này phải được dùng SAU authMiddleware

const adminMiddleware = (req, res, next) => {
    // req.user được gán từ authMiddleware
    if (req.user && req.user.role === 'admin') {
        next(); // Là admin, cho phép đi tiếp
    } else {
        return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Yêu cầu quyền Admin.' });
    }
};

module.exports = { adminMiddleware };