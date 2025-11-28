const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = {
    /**
     * Xử lý đăng ký người dùng mới
     */
    register: async (req, res) => {
        try {
            const { email, password, fullName } = req.body;

            if (!email || !password || !fullName) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
            }

            const existingUser = await userModel.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ message: 'Email đã được sử dụng.' });
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Tạo avatar mặc định
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3B82F6&color=fff&bold=true&size=256`;

            const userId = await userModel.create(email, passwordHash, fullName, defaultAvatar);

            res.status(201).json({ 
                message: 'Đăng ký thành công!', 
                userId 
            });

        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * Xử lý đăng nhập
     */
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // 1. Validate input
            if (!email || !password) {
                return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu.' });
            }

            // 2. Tìm user trong DB
            const user = await userModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu.' });
            }

            // 3. So sánh mật khẩu
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu.' });
            }

            // 4. Tạo JWT Token
            // **Đây là phần quan trọng:** Chúng ta đưa 'role' vào trong token payload
            const payload = {
                userId: user.user_id,
                email: user.email,
                role: user.role // Thêm quyền của user vào token
            };

            const token = jwt.sign(
                payload, 
                process.env.JWT_SECRET, // Lấy từ file .env
                { expiresIn: '24h' } // Token hết hạn sau 24 giờ
            );

            // 5. Trả về token cho client
            res.status(200).json({
                message: 'Đăng nhập thành công!',
                token: token,
                user: { // Trả về một số thông tin cơ bản
                    userId: user.user_id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role
                }
            });

        } catch (error) {
            // Trả về message chung để bảo mật
            res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu.' });
        }
    }
};

module.exports = authController;