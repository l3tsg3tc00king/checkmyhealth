import { useEffect, useState } from 'react'
import './AdminUsers.css'
import newsService from '../services/newsService'

const AdminNews = () => {
  const [sources, setSources] = useState([])
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load sources from API
  const loadSources = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await newsService.getAllSources()
      setSources(data)
    } catch (err) {
      console.error('Failed to load sources:', err)
      setError('Lỗi khi tải danh sách nguồn tin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSources()
  }, [])

  const handleAdd = async () => {
    if (!url) {
      setError('Vui lòng nhập URL')
      return
    }

    try {
      setError('')
      await newsService.createSource(url, label)
      setUrl('')
      setLabel('')
      // Reload sources
      await loadSources()
    } catch (err) {
      console.error('Failed to add source:', err)
      setError(err.response?.data?.message || 'Lỗi khi thêm nguồn tin')
    }
  }

  const handleRemove = async (id) => {
    try {
      setError('')
      await newsService.deleteSource(id)
      // Reload sources
      await loadSources()
    } catch (err) {
      console.error('Failed to delete source:', err)
      setError(err.response?.data?.message || 'Lỗi khi xóa nguồn tin')
    }
  }

  const handleImportExample = async () => {
    const examples = [
      { url: 'https://news.net/health', label: 'news.net - Health' },
      { url: 'https://example.com/section/health', label: 'Example - Health' }
    ]

    try {
      setError('')
      for (const ex of examples) {
        await newsService.createSource(ex.url, ex.label)
      }
      // Reload sources
      await loadSources()
    } catch (err) {
      console.error('Failed to import examples:', err)
      setError('Lỗi khi nhập ví dụ')
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Tin tức</h1>
          <p>Quản lý các nguồn tin (URL). Các nguồn được lưu trên máy chủ database.</p>
        </div>
      </header>

      {error && (
        <div style={{ background: '#fed7d7', color: '#c53030', padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="URL nguồn tin (ví dụ: https://news.net/health)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ flex: 1, padding: '8px 10px' }}
          />
          <input
            type="text"
            placeholder="Nhãn (tùy chọn)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{ width: 240, padding: '8px 10px' }}
          />
          <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>Thêm</button>
          <button className="btn" onClick={handleImportExample} disabled={loading}>Import mẫu</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid rgba(102, 126, 234, 0.2)', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <p style={{ marginTop: 12, color: '#718096' }}>Đang tải...</p>
            <style>{`
              @keyframes spin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}</style>
          </div>
        ) : sources.length === 0 ? (
          <p>Chưa có nguồn tin nào. Thêm URL để hiển thị trên trang Tin tức.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sources.map((s) => (
              <div key={s.source_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.label || new URL(s.url).hostname}</div>
                  <div style={{ color: '#6b7280' }}>{s.url}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={() => navigator.clipboard?.writeText(s.url)}>Sao chép</button>
                  <button className="btn" onClick={() => handleRemove(s.source_id)}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default AdminNews
