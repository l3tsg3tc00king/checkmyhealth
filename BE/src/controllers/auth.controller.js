const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

// Yêu cầu: Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt
const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};
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

            // [NEW] Kiểm tra độ mạnh mật khẩu
            if (!isStrongPassword(password)) {
                return res.status(400).json({ 
                    message: 'Mật khẩu quá yếu. Yêu cầu: Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.' 
                });
            }

            const existingUser = await userModel.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ message: 'Email đã được sử dụng.' });
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

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
    },



    // ========================================
// THÊM VÀO CUỐI authController OBJECT
// (THAY THẾ googleAuth và googleCallback trước đó)
// ========================================

    // ===== GOOGLE LOGIN CHO WEB =====

    /**
     * Bước 1: Redirect user đến Google (cho Web)
     */
    googleAuth: (req, res, next) => {
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            session: false
        })(req, res, next);
    },

    /**
     * Bước 2: Google callback (cho Web)
     */
    googleCallback: (req, res, next) => {
        passport.authenticate('google', { 
            session: false 
        }, (err, user) => {
            if (err) {
                console.error('Google Auth Error:', err);
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
            }

            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
            }

            // Kiểm tra account status
            if (user.account_status === 'suspended') {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_suspended`);
            }

            try {
                // Tạo JWT
                const payload = {
                    userId: user.user_id,
                    email: user.email,
                    role: user.role
                };

                const token = jwt.sign(
                    payload,
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                // Redirect về frontend kèm token
                const userData = encodeURIComponent(JSON.stringify({
                    userId: user.user_id,
                    email: user.email,
                    fullName: user.full_name,
                    avatar: user.avatar_url,
                    role: user.role
                }));

                return res.redirect(
                    `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${userData}`
                );

            } catch (error) {
                console.error('JWT Error:', error);
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_failed`);
            }
        })(req, res, next);
    },

    // ===== GOOGLE LOGIN CHO MOBILE =====

    /**
     * Xác thực Google từ Mobile (Flutter/React Native)
     */
    googleLoginMobile: async (req, res) => {
        try {
            const { idToken, googleId, email, name, photoUrl } = req.body;

            // Validate input
            if (!googleId || !email) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Thiếu thông tin Google' 
                });
            }

            // Tạo fake profile object giống Google Strategy
            const googleProfile = {
                id: googleId,
                displayName: name || email.split('@')[0],
                emails: [{ value: email }],
                photos: photoUrl ? [{ value: photoUrl }] : []
            };

            // Tìm hoặc tạo user
            const user = await userModel.findOrCreateGoogleUser(googleProfile);

            // Kiểm tra account status
            if (user.account_status === 'suspended') {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản đã bị tạm khóa'
                });
            }

            // Tạo JWT token
            const payload = {
                userId: user.user_id,
                email: user.email,
                role: user.role
            };

            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Trả về token và user info
            res.status(200).json({
                success: true,
                message: 'Đăng nhập Google thành công!',
                token: token,
                user: {
                    userId: user.user_id,
                    email: user.email,
                    fullName: user.full_name,
                    avatar: user.avatar_url,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Google Login Mobile Error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi đăng nhập Google',
                error: error.message
            });
        }
    },




};

module.exports = authController;