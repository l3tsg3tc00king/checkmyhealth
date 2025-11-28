const userModel = require('../models/user.model');
const diagnosisModel = require('../models/diagnosis.model');
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const feedbackModel = require('../models/feedback.model');
const notificationModel = require('../models/notification.model');
const XLSX = require('xlsx');
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
     * Lấy thống kê tổng hợp cho Admin Dashboard với charts
     * Bao gồm: Overview cards, Disease Distribution, 7-Day Trend, Confidence Analysis
     */
    getDashboardStats: async (req, res) => {
        try {
            // Chạy tất cả queries song song
            const [
                totalUsersResult,
                totalScansResult,
                diseaseDistributionResult,
                trendResult,
                confidenceResult
            ] = await Promise.all([
                // 1. Total Users (tất cả users, bao gồm cả admin)
                pool.query('SELECT COUNT(*) as total FROM users'),
                
                // 2. Total Scans
                pool.query('SELECT COUNT(*) as total FROM diagnosis_history'),
                
                // 3. Disease Distribution (Top 5)
                pool.query(
                    `SELECT disease_name, COUNT(*) as count 
                     FROM diagnosis_history 
                     GROUP BY disease_name 
                     ORDER BY count DESC 
                     LIMIT 5`
                ),
                
                // 4. 7-Day Usage Trend (last 7 days including today)
                // Use DATE() to get date part only, and ensure we include today
                pool.query(
                    `SELECT DATE(diagnosed_at) as date, COUNT(*) as count
                     FROM diagnosis_history
                     WHERE DATE(diagnosed_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                     AND DATE(diagnosed_at) <= CURDATE()
                     GROUP BY DATE(diagnosed_at)
                     ORDER BY date ASC`
                ),
                
                // 5. AI Confidence Analysis
                pool.query(
                    `SELECT 
                        SUM(CASE WHEN confidence_score >= 0.9 THEN 1 ELSE 0 END) as high,
                        SUM(CASE WHEN confidence_score >= 0.7 AND confidence_score < 0.9 THEN 1 ELSE 0 END) as medium,
                        SUM(CASE WHEN confidence_score < 0.7 THEN 1 ELSE 0 END) as low
                     FROM diagnosis_history`
                )
            ]);

            // Format 7-Day Trend: Fill missing days with 0
            const trendMap = new Map();
            trendResult[0].forEach(row => {
                let dateStr = null;
                if (row.date) {
                    // Handle both Date object and string
                    if (row.date instanceof Date) {
                        // Use local date, not UTC to avoid timezone issues
                        const year = row.date.getFullYear();
                        const month = String(row.date.getMonth() + 1).padStart(2, '0');
                        const day = String(row.date.getDate()).padStart(2, '0');
                        dateStr = `${year}-${month}-${day}`;
                    } else if (typeof row.date === 'string') {
                        // If it's already a date string (YYYY-MM-DD), use it directly
                        dateStr = row.date.split('T')[0];
                    }
                }
                if (dateStr) {
                    trendMap.set(dateStr, Number(row.count) || 0);
                }
            });

            // Build full 7-day series (last 7 days including today)
            // Use server's local date to match database CURDATE()
            const trendSeries = [];
            const now = new Date();
            // Get server timezone offset (assuming server is in same timezone as client or UTC)
            // For 7 days: from 6 days ago to today (inclusive)
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                // Use local date components to avoid timezone conversion issues
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;
                trendSeries.push({
                    date: dateStr,
                    count: trendMap.get(dateStr) || 0
                });
            }

            // Format response
            res.status(200).json({
                overview: {
                    totalUsers: Number(totalUsersResult[0][0]?.total || 0),
                    totalScans: Number(totalScansResult[0][0]?.total || 0)
                },
                diseaseDistribution: diseaseDistributionResult[0].map(row => ({
                    name: row.disease_name || 'Unknown',
                    count: Number(row.count) || 0
                })),
                trend: trendSeries,
                confidenceAnalysis: {
                    high: Number(confidenceResult[0][0]?.high || 0),
                    medium: Number(confidenceResult[0][0]?.medium || 0),
                    low: Number(confidenceResult[0][0]?.low || 0)
                }
            });
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
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
     * (Admin) Lấy danh sách feedback
     */
    getFeedbackList: async (req, res) => {
        try {
            // Gọi hàm model vừa tạo
            const feedbackList = await feedbackModel.getAll();
            res.status(200).json(feedbackList);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * (Admin) Lấy lịch sử chuẩn đoán của 1 user cụ thể
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
    },

    /**
     * (Admin) Xóa phản hồi
     */
    deleteFeedback: async (req, res) => {
        try {
            const { feedbackId } = req.params;
            await feedbackModel.delete(feedbackId);
            res.status(200).json({ message: 'Đã xóa phản hồi.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * (Admin) Cập nhật trạng thái phản hồi & Gửi thông báo
     */
    updateFeedbackStatus: async (req, res) => {
        try {
            const { feedbackId } = req.params;
            const { status } = req.body; // 'processing' hoặc 'resolved'

            // 1. Cập nhật trạng thái trong DB
            await feedbackModel.updateStatus(feedbackId, status);

            // 2. Lấy thông tin feedback để biết ai là người gửi
            const feedback = await feedbackModel.getById(feedbackId);

            // 3. Nếu có user_id (không phải ẩn danh), tạo thông báo
            if (feedback && feedback.user_id) {
                let title = 'Phản hồi hệ thống';
                let message = '';

                if (status === 'processing') {
                    title = 'Đã tiếp nhận phản hồi';
                    message = 'Chúng tôi đã nhận được phản hồi của bạn và đang xem xét.';
                } else if (status === 'resolved') {
                    title = 'Phản hồi đã được xử lý';
                    message = 'Cảm ơn bạn đã đóng góp. Vấn đề của bạn đã được giải quyết.';
                }

                await notificationModel.create(feedback.user_id, title, message);
            }

            res.status(200).json({ message: 'Cập nhật trạng thái thành công.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * (Admin) Báo cáo Chi tiết Chuẩn đoán với filters
     * GET /api/admin/reports/diagnosis?startDate=2024-01-01&endDate=2024-12-31&diseaseName=Melanoma&minConfidence=0.7&page=1&pageSize=50
     */
    getDiagnosisReport: async (req, res) => {
        try {
            const {
                startDate,
                endDate,
                diseaseName,
                minConfidence,
                maxConfidence,
                page = 1,
                pageSize = 50
            } = req.query;

            const filters = {};
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            if (diseaseName) filters.diseaseName = diseaseName;
            if (minConfidence !== undefined) filters.minConfidence = parseFloat(minConfidence);
            if (maxConfidence !== undefined) filters.maxConfidence = parseFloat(maxConfidence);

            const result = await diagnosisModel.getFilteredDiagnoses(filters, page, pageSize);

            res.status(200).json(result);
        } catch (error) {
            console.error('Error getting diagnosis report:', error);
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * (Admin) Export Báo cáo Chi tiết Chuẩn đoán ra Excel
     * GET /api/admin/reports/diagnosis/export?startDate=...&format=xlsx
     */
    exportDiagnosisReport: async (req, res) => {
        try {
            const {
                startDate,
                endDate,
                diseaseName,
                minConfidence,
                maxConfidence,
                format = 'xlsx'
            } = req.query;

            const filters = {};
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            if (diseaseName) filters.diseaseName = diseaseName;
            if (minConfidence !== undefined) filters.minConfidence = parseFloat(minConfidence);
            if (maxConfidence !== undefined) filters.maxConfidence = parseFloat(maxConfidence);

            // Lấy tất cả records (không pagination)
            const result = await diagnosisModel.getFilteredDiagnoses(filters, 1, 10000);

            if (result.items.length === 0) {
                return res.status(404).json({ message: 'Không có dữ liệu để export' });
            }

            // Format data for Excel
            const excelData = result.items.map(item => ({
                'ID Chuẩn đoán': item.history_id,
                'Tên người dùng': item.full_name || 'N/A',
                'Email': item.email || 'N/A',
                'Ngày giờ': item.diagnosed_at ? new Date(item.diagnosed_at).toLocaleString('vi-VN') : 'N/A',
                'Tên bệnh': item.disease_name || 'N/A',
                'Độ tin cậy (%)': item.confidence_score ? (item.confidence_score * 100).toFixed(2) + '%' : 'N/A',
                'URL ảnh': item.image_url || 'N/A'
            }));

            // Tạo workbook
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo cáo Chuẩn đoán');

            if (format === 'csv') {
                const csv = XLSX.utils.sheet_to_csv(worksheet);
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="diagnosis_report_${Date.now()}.csv"`);
                res.send('\ufeff' + csv); // BOM cho UTF-8
            } else {
                const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="diagnosis_report_${Date.now()}.xlsx"`);
                res.send(buffer);
            }
        } catch (error) {
            console.error('Error exporting diagnosis report:', error);
            res.status(500).json({ message: 'Lỗi export', error: error.message });
        }
    },

    /**
     * (Admin) Báo cáo Tăng trưởng Người dùng
     * GET /api/admin/reports/user-growth?period=day|week|month
     */
    getUserGrowthReport: async (req, res) => {
        try {
            const period = req.query.period || 'month'; // 'day', 'week', 'month'
            
            let query, groupBy, orderBy;
            
            if (period === 'day') {
                // Group by day
                query = `SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM users
                WHERE role = 'user'
                GROUP BY DATE(created_at)
                ORDER BY date ASC`;
                groupBy = 'date';
            } else if (period === 'week') {
                // Group by week (year-week)
                query = `SELECT 
                    YEAR(created_at) as year,
                    WEEK(created_at) as week,
                    COUNT(*) as count
                FROM users
                WHERE role = 'user'
                GROUP BY YEAR(created_at), WEEK(created_at)
                ORDER BY year ASC, week ASC`;
                groupBy = 'week';
            } else {
                // Group by month (default)
                query = `SELECT 
                    YEAR(created_at) as year,
                    MONTH(created_at) as month,
                    COUNT(*) as count
                FROM users
                WHERE role = 'user'
                GROUP BY YEAR(created_at), MONTH(created_at)
                ORDER BY year ASC, month ASC`;
                groupBy = 'month';
            }
            
            const [growthResult] = await pool.query(query);

            // 2. Retention Rate: % users có >= 2 scans
            const [retentionData] = await pool.query(
                `SELECT 
                    COUNT(DISTINCT CASE WHEN scan_count >= 2 THEN user_id END) as returning_users,
                    COUNT(DISTINCT user_id) as total_users_with_scans
                FROM (
                    SELECT user_id, COUNT(*) as scan_count
                    FROM diagnosis_history
                    GROUP BY user_id
                ) as user_scans`
            );

            const totalUsersWithScans = retentionData[0]?.total_users_with_scans || 0;
            const returningUsers = retentionData[0]?.returning_users || 0;
            const retentionRate = totalUsersWithScans > 0 
                ? ((returningUsers / totalUsersWithScans) * 100).toFixed(2) 
                : 0;

            // Format data based on period
            let formattedGrowth = [];
            if (period === 'day') {
                formattedGrowth = growthResult.map(item => {
                    // Parse YYYY-MM-DD string directly to avoid timezone issues
                    let label = '';
                    if (item.date) {
                        if (typeof item.date === 'string') {
                            const [year, month, day] = item.date.split('-');
                            label = `${day}-${month}`;
                        } else if (item.date instanceof Date) {
                            const year = item.date.getFullYear();
                            const month = String(item.date.getMonth() + 1).padStart(2, '0');
                            const day = String(item.date.getDate()).padStart(2, '0');
                            label = `${day}-${month}`;
                        }
                    }
                    return {
                        date: item.date,
                        count: Number(item.count),
                        label: label
                    };
                });
            } else if (period === 'week') {
                formattedGrowth = growthResult.map(item => ({
                    year: item.year,
                    week: item.week,
                    count: Number(item.count),
                    label: item.label || `${item.year}-W${String(item.week).padStart(2, '0')}`
                }));
            } else {
                formattedGrowth = growthResult.map(item => ({
                    year: item.year,
                    month: item.month,
                    count: Number(item.count),
                    label: `${item.year}-${String(item.month).padStart(2, '0')}`
                }));
            }

            res.status(200).json({
                period,
                growth: formattedGrowth,
                retention: {
                    totalUsersWithScans,
                    returningUsers,
                    retentionRate: parseFloat(retentionRate)
                }
            });
        } catch (error) {
            console.error('Error getting user growth report:', error);
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * (Admin) Báo cáo AI Performance - Ca khó
     * GET /api/admin/reports/ai-difficult-cases?threshold=0.6&limit=100
     */
    getAIDifficultCases: async (req, res) => {
        try {
            const threshold = parseFloat(req.query.threshold || 0.6);
            const limit = parseInt(req.query.limit || 100, 10);

            const cases = await diagnosisModel.getDifficultCases(threshold, limit);

            res.status(200).json({
                threshold,
                total: cases.length,
                cases: cases.map(item => ({
                    history_id: item.history_id,
                    user_id: item.user_id,
                    user_name: item.full_name || 'N/A',
                    user_email: item.email || 'N/A',
                    disease_name: item.disease_name,
                    confidence_score: item.confidence_score,
                    confidence_percent: item.confidence_score ? (item.confidence_score * 100).toFixed(2) + '%' : 'N/A',
                    diagnosed_at: item.diagnosed_at,
                    image_url: item.image_url,
                    response_time_ms: item.result_json ? JSON.parse(item.result_json).response_time_ms : null
                }))
            });
        } catch (error) {
            console.error('Error getting AI difficult cases:', error);
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    /**
     * (Admin) Export AI Difficult Cases ra Excel
     * GET /api/admin/reports/ai-difficult-cases/export?threshold=0.6&format=xlsx
     */
    exportAIDifficultCases: async (req, res) => {
        try {
            const threshold = parseFloat(req.query.threshold || 0.6);
            const format = req.query.format || 'xlsx';

            const cases = await diagnosisModel.getDifficultCases(threshold, 10000);

            if (cases.length === 0) {
                return res.status(404).json({ message: 'Không có dữ liệu để export' });
            }

            // Format data for Excel
            const excelData = cases.map(item => {
                const resultJson = item.result_json ? JSON.parse(item.result_json) : {};
                return {
                    'ID Chuẩn đoán': item.history_id,
                    'Tên người dùng': item.full_name || 'N/A',
                    'Email': item.email || 'N/A',
                    'Tên bệnh': item.disease_name || 'N/A',
                    'Độ tin cậy (%)': item.confidence_score ? (item.confidence_score * 100).toFixed(2) + '%' : 'N/A',
                    'Ngày giờ': item.diagnosed_at ? new Date(item.diagnosed_at).toLocaleString('vi-VN') : 'N/A',
                    'Thời gian phản hồi (ms)': resultJson.response_time_ms || 'N/A',
                    'URL ảnh': item.image_url || 'N/A'
                };
            });

            // Tạo workbook
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Ca khó AI');

            if (format === 'csv') {
                const csv = XLSX.utils.sheet_to_csv(worksheet);
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="ai_difficult_cases_${Date.now()}.csv"`);
                res.send('\ufeff' + csv);
            } else {
                const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="ai_difficult_cases_${Date.now()}.xlsx"`);
                res.send(buffer);
            }
        } catch (error) {
            console.error('Error exporting AI difficult cases:', error);
            res.status(500).json({ message: 'Lỗi export', error: error.message });
        }
    }

};

module.exports = adminController;