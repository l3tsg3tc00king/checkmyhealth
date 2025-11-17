const userModel = require('../models/user.model');
const diagnosisModel = require('../models/diagnosis.model');
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

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
     * (Admin) Lấy chuỗi thời gian cho metric (ví dụ: diagnoses) trong N ngày
     * Query params: ?metric=diagnoses&period=30 (days)
     */
    getStatisticsTimeseries: async (req, res) => {
        try {
            const metric = req.query.metric || 'diagnoses'
            const period = parseInt(req.query.period || '30', 10)
            const days = isNaN(period) || period <= 0 ? 30 : period

            if (metric !== 'diagnoses') {
                return res.status(400).json({ message: 'Metric không được hỗ trợ' })
            }

            // Get counts grouped by date
            const [rows] = await pool.query(
                `SELECT DATE(diagnosed_at) as day, COUNT(*) as value
                 FROM diagnosis_history
                 WHERE diagnosed_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                 GROUP BY day
                 ORDER BY day ASC`,
                [days]
            )

            // Đưa rows về dạng Map để tránh O(n^2) khi fill chuỗi thời gian
            const valueByDay = new Map()
            rows.forEach(r => {
                const key = String(r.day)
                valueByDay.set(key, Number(r.value) || 0)
            })

            // Build full series of days (fill zeros) với tra cứu O(1)
            const result = []
            const now = new Date()
            // start from days-1 days ago to today
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now)
                d.setDate(now.getDate() - i)
                const yyyy = d.getFullYear()
                const mm = String(d.getMonth() + 1).padStart(2, '0')
                const dd = String(d.getDate()).padStart(2, '0')
                const dayStr = `${yyyy}-${mm}-${dd}`
                const value = valueByDay.get(dayStr) ?? 0
                result.push({ day: dayStr, value })
            }

            res.status(200).json({ metric, period: days, series: result })
        } catch (error) {
            console.error('Error timeseries:', error)
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message })
        }
    },

    /**
     * (Admin) Lấy breakdown theo role hoặc danh sách nguồn
     * Query params: ?by=role|source
     */
    getStatisticsBreakdown: async (req, res) => {
        try {
            const by = req.query.by || 'role'
            if (by === 'role') {
                const [rows] = await pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role')
                res.status(200).json({ by: 'role', items: rows })
                return
            }

            if (by === 'source') {
                // Return list of sources (no per-source diagnosis linkage available)
                const [rows] = await pool.query('SELECT source_id, label, url, created_at FROM news_sources ORDER BY created_at DESC')
                res.status(200).json({ by: 'source', items: rows })
                return
            }

            res.status(400).json({ message: 'Tham số by không hợp lệ (role|source)' })
        } catch (error) {
            console.error('Error breakdown:', error)
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message })
        }
    },

    /**
     * (Admin) Export statistics as CSV
     * Query params: ?type=timeseries|breakdown&metric=diagnoses&period=30&by=role
     */
    exportStatistics: async (req, res) => {
        try {
            const type = req.query.type || 'timeseries'

            if (type === 'timeseries') {
                const metric = req.query.metric || 'diagnoses'
                const period = parseInt(req.query.period || '30', 10)
                // reuse timeseries logic
                const [rows] = await pool.query(
                    `SELECT DATE(diagnosed_at) as day, COUNT(*) as value
                     FROM diagnosis_history
                     WHERE diagnosed_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                     GROUP BY day
                     ORDER BY day ASC`,
                    [period]
                )

                // Build CSV
                let csv = 'day,value\n'
                rows.forEach(r => {
                    csv += `${r.day},${r.value}\n`
                })

                res.setHeader('Content-Type', 'text/csv')
                res.setHeader('Content-Disposition', `attachment; filename="timeseries_${metric}_${period}d.csv"`)
                res.send(csv)
                return
            }

            if (type === 'breakdown') {
                const by = req.query.by || 'role'
                if (by === 'role') {
                    const [rows] = await pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role')
                    let csv = 'role,count\n'
                    rows.forEach(r => { csv += `${r.role},${r.count}\n` })
                    res.setHeader('Content-Type', 'text/csv')
                    res.setHeader('Content-Disposition', `attachment; filename="breakdown_role.csv"`)
                    res.send(csv)
                    return
                }

                if (by === 'source') {
                    const [rows] = await pool.query('SELECT source_id, label, url, created_at FROM news_sources ORDER BY created_at DESC')
                    let csv = 'source_id,label,url,created_at\n'
                    rows.forEach(r => {
                        // Escape commas
                        const label = r.label ? String(r.label).replace(/\r?\n/g, ' ').replace(/,/g, ' ') : ''
                        csv += `${r.source_id},"${label}","${r.url}",${r.created_at}\n`
                    })
                    res.setHeader('Content-Type', 'text/csv')
                    res.setHeader('Content-Disposition', `attachment; filename="breakdown_source.csv"`)
                    res.send(csv)
                    return
                }
            }

            res.status(400).json({ message: 'Tham số type không hợp lệ' })
        } catch (error) {
            console.error('Error export:', error)
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message })
        }
    },

    /**
     * (Admin) Lấy danh sách người dùng
     */
    getUserList: async (req, res) => {
        try {
            // Lấy tham số ?search=... từ URL
            const { search } = req.query;
            // Cho phép client truyền phân trang: ?page=&pageSize=
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            const pageSizeRaw = parseInt(req.query.pageSize, 10) || 100;
            const pageSize = Math.min(Math.max(pageSizeRaw, 1), 500);

            const users = await userModel.getAllUsers(search, page, pageSize);
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * (Admin) Tạo người dùng mới
     */
    createUser: async (req, res) => {
        try {
            const { email, password, fullName, role = 'user' } = req.body;

            // Validate input
            if (!email || !password || !fullName) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
            }

            if (!['user', 'admin'].includes(role)) {
                return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
            }

            // Kiểm tra email đã tồn tại chưa
            const existingUser = await userModel.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ message: 'Email đã được sử dụng.' });
            }

            // Hash mật khẩu
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Tạo user với role
            const userId = await userModel.createWithRole(email, passwordHash, fullName, role);

            res.status(201).json({ 
                message: 'Tạo người dùng thành công!', 
                userId: userId 
            });
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