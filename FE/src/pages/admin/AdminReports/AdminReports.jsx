import { useEffect, useState, useMemo } from 'react'
import '../AdminUsers/AdminUsers.css'
import {
  getDiagnosisReport,
  exportDiagnosisReport,
  getUserGrowthReport,
  getAIDifficultCases,
  exportAIDifficultCases
} from '../../../services/features/adminService.js'
import Pagination from '../../../components/ui/Pagination/Pagination.jsx'
import { usePageTitle } from '../../../hooks/usePageTitle.js'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']

const AdminReports = () => {
  usePageTitle('Báo cáo & Thống kê')
  const [activeTab, setActiveTab] = useState('diagnosis') // 'diagnosis' | 'growth' | 'ai'

  // Diagnosis Report State
  const [diagnosisFilters, setDiagnosisFilters] = useState({
    startDate: '',
    endDate: '',
    diseaseName: '',
    minConfidence: '',
    maxConfidence: ''
  })
  const [diagnosisData, setDiagnosisData] = useState({ items: [], total: 0, page: 1, pageSize: 50, totalPages: 0 })
  const [diagnosisLoading, setDiagnosisLoading] = useState(false)

  // User Growth State
  const [growthData, setGrowthData] = useState({ growth: [], retention: null, period: 'month' })
  const [growthLoading, setGrowthLoading] = useState(false)
  const [growthPeriod, setGrowthPeriod] = useState('month') // 'day', 'week', 'month'

  // AI Difficult Cases State
  const [difficultCases, setDifficultCases] = useState({ cases: [], total: 0, threshold: 0.6 })
  const [difficultCasesLoading, setDifficultCasesLoading] = useState(false)
  const [difficultThreshold, setDifficultThreshold] = useState(0.6)

  const loadDiagnosisReport = async (page = 1) => {
    try {
      setDiagnosisLoading(true)
      const filters = {
        ...diagnosisFilters,
        page,
        pageSize: 50
      }
      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === '' || filters[key] === null || filters[key] === undefined) {
          delete filters[key]
        }
      })
      const data = await getDiagnosisReport(filters)
      setDiagnosisData(data)
    } catch (error) {
      console.error('Failed to load diagnosis report:', error)
      alert('Lỗi khi tải báo cáo: ' + error.message)
    } finally {
      setDiagnosisLoading(false)
    }
  }

  const handleExportDiagnosis = async () => {
    try {
      const filters = { ...diagnosisFilters }
      Object.keys(filters).forEach(key => {
        if (filters[key] === '' || filters[key] === null || filters[key] === undefined) {
          delete filters[key]
        }
      })
      const blob = await exportDiagnosisReport(filters, 'xlsx')
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `diagnosis_report_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Export thất bại: ' + error.message)
    }
  }

  const loadUserGrowth = async () => {
    try {
      setGrowthLoading(true)
      const data = await getUserGrowthReport(growthPeriod)
      setGrowthData(data)
    } catch (error) {
      console.error('Failed to load user growth:', error)
      alert('Lỗi khi tải báo cáo tăng trưởng: ' + error.message)
    } finally {
      setGrowthLoading(false)
    }
  }

  const loadAIDifficultCases = async () => {
    try {
      setDifficultCasesLoading(true)
      const data = await getAIDifficultCases(difficultThreshold, 100)
      setDifficultCases(data)
    } catch (error) {
      console.error('Failed to load difficult cases:', error)
      alert('Lỗi khi tải ca khó: ' + error.message)
    } finally {
      setDifficultCasesLoading(false)
    }
  }

  const handleExportDifficultCases = async () => {
    try {
      const blob = await exportAIDifficultCases(difficultThreshold, 'xlsx')
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai_difficult_cases_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Export thất bại: ' + error.message)
    }
  }

  useEffect(() => {
    if (activeTab === 'diagnosis') {
      loadDiagnosisReport(1)
    } else if (activeTab === 'growth') {
      loadUserGrowth()
    } else if (activeTab === 'ai') {
      loadAIDifficultCases()
    }
  }, [activeTab, growthPeriod])

  const renderDiagnosisReport = () => (
    <div>
      {/* Filter Bar */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Bộ lọc</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              Từ ngày
            </label>
            <input
              type="date"
              value={diagnosisFilters.startDate}
              onChange={(e) => setDiagnosisFilters({ ...diagnosisFilters, startDate: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              Đến ngày
            </label>
            <input
              type="date"
              value={diagnosisFilters.endDate}
              onChange={(e) => setDiagnosisFilters({ ...diagnosisFilters, endDate: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              Loại bệnh
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Melanoma"
              value={diagnosisFilters.diseaseName}
              onChange={(e) => setDiagnosisFilters({ ...diagnosisFilters, diseaseName: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              Độ tin cậy tối thiểu
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              placeholder="Ví dụ: 0.7"
              value={diagnosisFilters.minConfidence}
              onChange={(e) => setDiagnosisFilters({ ...diagnosisFilters, minConfidence: e.target.value ? parseFloat(e.target.value) : '' })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              Độ tin cậy tối đa
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              placeholder="Ví dụ: 0.9"
              value={diagnosisFilters.maxConfidence}
              onChange={(e) => setDiagnosisFilters({ ...diagnosisFilters, maxConfidence: e.target.value ? parseFloat(e.target.value) : '' })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={() => loadDiagnosisReport(1)} disabled={diagnosisLoading}>
            {diagnosisLoading ? 'Đang tải...' : 'Xem báo cáo'}
          </button>
          <button className="btn" onClick={handleExportDiagnosis} disabled={diagnosisLoading || diagnosisData.items.length === 0}>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Data Grid */}
      {diagnosisLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid rgba(102, 126, 234, 0.2)', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <p style={{ marginTop: 12, color: '#718096' }}>Đang tải...</p>
        </div>
      ) : diagnosisData.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
          Không có dữ liệu
        </div>
      ) : (
        <>
          <div className="data-table__wrapper" style={{ marginBottom: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Ngày giờ</th>
                  <th>Hình ảnh</th>
                  <th>Kết quả AI</th>
                  <th>Độ tin cậy</th>
                </tr>
              </thead>
              <tbody>
                {diagnosisData.items.map((item) => (
                  <tr key={item.history_id}>
                    <td>{item.history_id}</td>
                    <td>{item.full_name || 'N/A'}</td>
                    <td>{item.email || 'N/A'}</td>
                    <td>{item.diagnosed_at ? new Date(item.diagnosed_at).toLocaleString('vi-VN') : 'N/A'}</td>
                    <td>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt="Thumbnail"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={() => window.open(item.image_url, '_blank')}
                        />
                      ) : 'N/A'}
                    </td>
                    <td>{item.disease_name || 'N/A'}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: item.confidence_score >= 0.9 ? 'rgba(34, 197, 94, 0.18)' :
                          item.confidence_score >= 0.7 ? 'rgba(251, 191, 36, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                        color: item.confidence_score >= 0.9 ? '#166534' :
                          item.confidence_score >= 0.7 ? '#b45309' : '#b91c1c'
                      }}>
                        {item.confidence_score ? (item.confidence_score * 100).toFixed(2) + '%' : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {diagnosisData.totalPages > 1 && (
            <Pagination
              currentPage={diagnosisData.page}
              totalPages={diagnosisData.totalPages}
              onPageChange={(page) => loadDiagnosisReport(page)}
              itemsPerPage={diagnosisData.pageSize}
              totalItems={diagnosisData.total}
              itemLabel="bản ghi"
            />
          )}
        </>
      )}
    </div>
  )

  const renderUserGrowthReport = () => (
    <div>
      {growthLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid rgba(102, 126, 234, 0.2)', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <p style={{ marginTop: 12, color: '#718096' }}>Đang tải...</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Tăng trưởng đăng ký</h3>
                <select
                  value={growthPeriod}
                  onChange={(e) => {
                    setGrowthPeriod(e.target.value)
                  }}
                  style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.9rem' }}
                >
                  <option value="day">Theo ngày</option>
                  <option value="week">Theo tuần</option>
                  <option value="month">Theo tháng</option>
                </select>
              </div>
              {growthData.growth && growthData.growth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthData.growth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="label" 
                      angle={growthPeriod === 'day' ? -45 : 0}
                      textAnchor={growthPeriod === 'day' ? 'end' : 'middle'}
                      height={growthPeriod === 'day' ? 80 : 30}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#667eea" strokeWidth={2} name="Số người đăng ký" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: '#718096', textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu</p>
              )}
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0 }}>Chỉ số Retention</h3>
              {growthData.retention ? (
                <div style={{ padding: '1rem 0' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>Tỷ lệ người dùng quay lại</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#667eea' }}>
                      {growthData.retention.retentionRate}%
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    <div>Tổng người dùng có scan: <strong>{growthData.retention.totalUsersWithScans}</strong></div>
                    <div>Người dùng quay lại (≥2 scans): <strong>{growthData.retention.returningUsers}</strong></div>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#718096', textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu</p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={loadUserGrowth} disabled={growthLoading}>
              {growthLoading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </>
      )}
    </div>
  )

  const renderAIPerformanceReport = () => (
    <div>
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Bộ lọc</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: '300px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              Ngưỡng độ tin cậy (tối đa)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={difficultThreshold * 100}
              onChange={(e) => setDifficultThreshold(parseFloat(e.target.value) / 100)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            />
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Hiện tại: &lt; {(difficultThreshold * 100).toFixed(1)}%
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={loadAIDifficultCases} disabled={difficultCasesLoading}>
              {difficultCasesLoading ? 'Đang tải...' : 'Xem ca khó'}
            </button>
            <button className="btn" onClick={handleExportDifficultCases} disabled={difficultCasesLoading || difficultCases.cases.length === 0}>
              Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {difficultCasesLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid rgba(102, 126, 234, 0.2)', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <p style={{ marginTop: 12, color: '#718096' }}>Đang tải...</p>
        </div>
      ) : difficultCases.cases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
          Không có ca khó nào (confidence &lt; {(difficultThreshold * 100).toFixed(1)}%)
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
            <strong>Tìm thấy {difficultCases.total} ca khó</strong> (độ tin cậy &lt; {(difficultThreshold * 100).toFixed(1)}%)
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#92400e' }}>
              Đây là những ảnh mờ hoặc bệnh lạ mà AI chưa học kỹ. Cần lưu riêng để train lại sau này.
            </div>
          </div>
          <div className="data-table__wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Ngày giờ</th>
                  <th>Hình ảnh</th>
                  <th>Kết quả AI</th>
                  <th>Độ tin cậy</th>
                  <th>Thời gian phản hồi (ms)</th>
                </tr>
              </thead>
              <tbody>
                {difficultCases.cases.map((item) => (
                  <tr key={item.history_id}>
                    <td>{item.history_id}</td>
                    <td>{item.user_name}</td>
                    <td>{item.user_email}</td>
                    <td>{item.diagnosed_at ? new Date(item.diagnosed_at).toLocaleString('vi-VN') : 'N/A'}</td>
                    <td>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt="Thumbnail"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={() => window.open(item.image_url, '_blank')}
                        />
                      ) : 'N/A'}
                    </td>
                    <td>{item.disease_name || 'N/A'}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(239, 68, 68, 0.18)',
                        color: '#b91c1c'
                      }}>
                        {item.confidence_percent}
                      </span>
                    </td>
                    <td>{item.response_time_ms ? item.response_time_ms + ' ms' : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Báo cáo & Thống kê</h1>
          <p>Tổng quan và phân tích dữ liệu hệ thống</p>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
        <button
          className={`btn ${activeTab === 'diagnosis' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('diagnosis')}
          style={{
            borderBottom: activeTab === 'diagnosis' ? '2px solid #667eea' : '2px solid transparent',
            borderRadius: 0,
            marginBottom: '-2px'
          }}
        >
          Chi tiết Chuẩn đoán
        </button>
        <button
          className={`btn ${activeTab === 'growth' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('growth')}
          style={{
            borderBottom: activeTab === 'growth' ? '2px solid #667eea' : '2px solid transparent',
            borderRadius: 0,
            marginBottom: '-2px'
          }}
        >
          Tăng trưởng Người dùng
        </button>
        <button
          className={`btn ${activeTab === 'ai' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('ai')}
          style={{
            borderBottom: activeTab === 'ai' ? '2px solid #667eea' : '2px solid transparent',
            borderRadius: 0,
            marginBottom: '-2px'
          }}
        >
          Sức khỏe AI
        </button>
      </div>

      {/* Content */}
      {activeTab === 'diagnosis' && renderDiagnosisReport()}
      {activeTab === 'growth' && renderUserGrowthReport()}
      {activeTab === 'ai' && renderAIPerformanceReport()}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}

export default AdminReports
