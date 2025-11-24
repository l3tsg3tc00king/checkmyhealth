import { useEffect, useState } from 'react'
import '../AdminUsers/AdminUsers.css'
import { getStatistics, getTimeseries, getBreakdown, exportStatisticsCSV } from '../../../services/features/adminService.js'
import { usePageTitle } from '../../../hooks/usePageTitle.js'

const StatCard = ({ title, value }) => (
  <div style={{ padding: 16, borderRadius: 8, background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: 180 }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 28, fontWeight: 700 }}>{value ?? '--'}</div>
  </div>
)

const AdminReports = () => {
  usePageTitle('Báo cáo & Thống kê')
  const [stats, setStats] = useState({ totalUsers: 0, totalDiagnoses: 0 })
  const [series, setSeries] = useState([])
  const [period, setPeriod] = useState(30)
  const [breakdownRole, setBreakdownRole] = useState([])
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)

  const loadStats = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getStatistics()
      // adminService.getStatistics returns parsed response or throws
      setStats({ totalUsers: data.totalUsers ?? 0, totalDiagnoses: data.totalDiagnoses ?? 0 })
    } catch (err) {
      console.error('Failed to load statistics:', err)
      setError(err.message || 'Không thể lấy dữ liệu thống kê')
    } finally {
      setLoading(false)
    }
  }

  const loadTimeseries = async (p = period) => {
    try {
      setLoadingMore(true)
      const res = await getTimeseries('diagnoses', p)
      setSeries(res.series || [])
    } catch (err) {
      console.error('Failed to load timeseries:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const loadBreakdowns = async () => {
    try {
      setLoadingMore(true)
      const r1 = await getBreakdown('role')
      setBreakdownRole(r1.items || [])
      const r2 = await getBreakdown('source')
      setSources(r2.items || [])
    } catch (err) {
      console.error('Failed to load breakdowns:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const doExport = async (params, filenameFallback) => {
    try {
      const blob = await exportStatisticsCSV(params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filenameFallback || 'export.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export thất bại: ' + (err.message || err))
    }
  }

  useEffect(() => {
    loadStats()
    loadTimeseries()
    loadBreakdowns()
  }, [])

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Báo cáo</h1>
          <p>Tổng quan số liệu hệ thống</p>
        </div>
        <div>
          <button className="btn" onClick={loadStats} disabled={loading}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </header>

      {error && (
        <div style={{ background: '#fed7d7', color: '#c53030', padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard title="Tổng số người dùng" value={stats.totalUsers} />
        <StatCard title="Tổng số lượt chẩn đoán" value={stats.totalDiagnoses} />
      </div>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        <div style={{ background: 'white', padding: 12, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Lượt chẩn đoán theo ngày (chuỗi thời gian)</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" min="7" max="365" value={period} onChange={(e) => setPeriod(Number(e.target.value))} style={{ width: 80, padding: 6 }} />
              <button className="btn" onClick={() => loadTimeseries(period)} disabled={loadingMore}>{loadingMore ? 'Đang...' : 'Lấy'}</button>
              <button className="btn" onClick={() => doExport({ type: 'timeseries', metric: 'diagnoses', period }, `timeseries_diagnoses_${period}d.csv`)}>Export CSV</button>
            </div>
          </div>
          <div style={{ height: 220, marginTop: 12 }}>
            {series.length === 0 ? (
              <div style={{ color: '#6b7280' }}>Không có dữ liệu chuỗi thời gian.</div>
            ) : (
              <svg width="100%" height="220" viewBox="0 0 600 220" preserveAspectRatio="none">
                {/** simple line chart mapping */}
                {(() => {
                  const w = 600
                  const h = 200
                  const padding = 20
                  const values = series.map(s => s.value)
                  const max = Math.max(...values, 1)
                  const stepX = (w - padding * 2) / Math.max(1, values.length - 1)
                  const points = values.map((v, i) => `${padding + i * stepX},${h - padding - (v / max) * (h - padding * 2)}`).join(' ')
                  return (
                    <g>
                      <polyline fill="none" stroke="#667eea" strokeWidth="2" points={points} />
                      {values.map((v, i) => {
                        const x = padding + i * stepX
                        const y = h - padding - (v / max) * (h - padding * 2)
                        return <circle key={i} cx={x} cy={y} r={2.5} fill="#667eea" />
                      })}
                    </g>
                  )
                })()}
              </svg>
            )}
          </div>
        </div>

        <div style={{ background: 'white', padding: 12, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Phân tích theo vai trò</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {breakdownRole.length === 0 ? (
              <div style={{ color: '#6b7280' }}>Không có dữ liệu.</div>
            ) : (
              breakdownRole.map((r) => (
                <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 80 }}>{r.role}</div>
                  <div style={{ height: 14, background: '#edf2ff', flex: 1, borderRadius: 6, position: 'relative' }}>
                    <div style={{ width: `${Math.round((r.count / Math.max(...breakdownRole.map(x => x.count))) * 100)}%`, height: '100%', background: '#667eea', borderRadius: 6 }} />
                  </div>
                  <div style={{ width: 48, textAlign: 'right' }}>{r.count}</div>
                </div>
              ))
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={loadBreakdowns} disabled={loadingMore}>{loadingMore ? 'Đang...' : 'Làm mới'}</button>
              <button className="btn" onClick={() => doExport({ type: 'breakdown', by: 'role' }, 'breakdown_role.csv')}>Export CSV</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, background: 'white', padding: 12, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Danh sách nguồn</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button className="btn" onClick={loadBreakdowns} disabled={loadingMore}>{loadingMore ? 'Đang...' : 'Lấy nguồn'}</button>
          <button className="btn" onClick={() => doExport({ type: 'breakdown', by: 'source' }, 'breakdown_source.csv')}>Export CSV</button>
        </div>
        {sources.length === 0 ? (
          <div style={{ color: '#6b7280' }}>Không có nguồn.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {sources.map(s => (
              <div key={s.source_id} style={{ padding: 8, border: '1px solid #e6e6f0', borderRadius: 6 }}>
                <div style={{ fontWeight: 600 }}>{s.label || new URL(s.url).hostname}</div>
                <div style={{ color: '#6b7280' }}>{s.url}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default AdminReports
