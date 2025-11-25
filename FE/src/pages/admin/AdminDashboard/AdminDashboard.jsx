import { useEffect, useState } from 'react'
import { getDashboardStats } from '../../../services/features/adminService.js'
import { usePageTitle } from '../../../hooks/usePageTitle.js'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts'

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']

const AdminDashboard = () => {
  usePageTitle('Bảng điều khiển Admin')
  const [stats, setStats] = useState({ loading: true, data: null, error: null })

  useEffect(() => {
    let isMounted = true
    getDashboardStats()
      .then((data) => {
        if (isMounted) setStats({ loading: false, data, error: null })
      })
      .catch((error) => {
        if (isMounted) setStats({ loading: false, data: null, error: error.message })
      })

    return () => {
      isMounted = false
    }
  }, [])

  const renderContent = () => {
    if (stats.loading) {
      return <p>Đang tải dữ liệu tổng quan...</p>
    }

    if (stats.error) {
      return <p className="error-text">Không thể tải dữ liệu: {stats.error}</p>
    }

    if (!stats.data) {
      return <p>Không có dữ liệu hiển thị.</p>
    }

    const { overview, diseaseDistribution, trend, confidenceAnalysis } = stats.data

    // Format trend data for chart
    // item.date is already in format YYYY-MM-DD from backend
    const trendData = trend.map(item => {
      // Parse YYYY-MM-DD string directly to avoid timezone issues
      const [year, month, day] = item.date.split('-')
      return {
        date: `${day}-${month}`, // Format as DD-MM for display
        count: item.count
      }
    })

    // Format confidence data for bar chart
    const confidenceData = [
      { name: 'Cao (≥0.9)', value: confidenceAnalysis.high, color: '#22c55e' },
      { name: 'Trung bình (0.7-0.9)', value: confidenceAnalysis.medium, color: '#f59e0b' },
      { name: 'Thấp (<0.7)', value: confidenceAnalysis.low, color: '#ef4444' }
    ]

    return (
      <div className="admin-dashboard__content">
        {/* Overview Cards */}
        <div className="admin-cards">
          <div className="admin-card">
            <h3>Tổng người dùng</h3>
            <p>{overview.totalUsers || 0}</p>
          </div>
          <div className="admin-card">
            <h3>Tổng lượt chuẩn đoán</h3>
            <p>{overview.totalScans || 0}</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="admin-dashboard__charts">
          {/* Disease Distribution Pie Chart */}
          <div className="admin-chart-card">
            <h3>Phân bố bệnh (Top 5)</h3>
            {diseaseDistribution && diseaseDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={diseaseDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {diseaseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const total = diseaseDistribution.reduce((sum, item) => sum + item.count, 0)
                      const percent = total > 0 ? ((value / total) * 100).toFixed(0) : 0
                      return [`Số lượng: ${value} (${percent}%)`, props.payload.name]
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => {
                      const total = diseaseDistribution.reduce((sum, item) => sum + item.count, 0)
                      const percent = total > 0 ? ((entry.payload.count / total) * 100).toFixed(0) : 0
                      return `${value} (${percent}%)`
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                Chưa có dữ liệu
              </p>
            )}
          </div>

          {/* 7-Day Trend Line Chart */}
          <div className="admin-chart-card">
            <h3>Xu hướng 7 ngày gần đây</h3>
            {trendData && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#667eea"
                    fill="#667eea"
                    fillOpacity={0.3}
                    name="Số lượt chuẩn đoán"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                Chưa có dữ liệu
              </p>
            )}
          </div>

          {/* AI Confidence Analysis Bar Chart */}
          <div className="admin-chart-card">
            <h3>Phân tích độ tin cậy AI</h3>
            {confidenceData && confidenceData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={confidenceData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-15}
                    textAnchor="end"
                    height={70}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Số lượng" radius={[8, 8, 0, 0]}>
                    {confidenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                Chưa có dữ liệu
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1>Tổng quan hệ thống</h1>
        <p>Nhanh chóng nắm bắt tình hình với dữ liệu thống kê từ hệ thống.</p>
      </header>
      {renderContent()}
    </section>
  )
}

export default AdminDashboard
