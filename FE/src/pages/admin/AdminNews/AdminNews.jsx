import { useEffect, useState, useMemo } from 'react'
import '../AdminUsers/AdminUsers.css'
import newsService from '../../../services/features/newsService.js'
import Pagination from '../../../components/ui/Pagination/Pagination.jsx'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog.jsx'
import { usePageTitle } from '../../../hooks/usePageTitle.js'

const AdminNews = () => {
  usePageTitle('Quản lý tin tức')
  const [sources, setSources] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [customItemsPerPage, setCustomItemsPerPage] = useState(false)
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [confirmLabel, setConfirmLabel] = useState('')

  // Load sources from API
  const loadSources = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await newsService.getAllSources()
      setSources(data)
      setCurrentPage(1)
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

  const paginatedSources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sources.slice(startIndex, endIndex)
  }, [sources, currentPage, itemsPerPage])

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

  const openConfirm = (id, labelOrUrl) => {
    setConfirmTarget(id)
    setConfirmLabel(labelOrUrl)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return
    try {
      setConfirmOpen(false)
      await handleRemove(confirmTarget)
    } catch (err) {
      // handleRemove already sets error
    } finally {
      setConfirmTarget(null)
      setConfirmLabel('')
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
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paginatedSources.map((s) => (
                <div key={s.source_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.label || new URL(s.url).hostname}</div>
                    <div style={{ color: '#6b7280' }}>{s.url}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={() => navigator.clipboard?.writeText(s.url)}>Sao chép</button>
                    <button className="btn" onClick={() => openConfirm(s.source_id, s.label || s.url)}>Xóa</button>
                  </div>
                </div>
              ))}
            </div>

            {sources.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(sources.length / itemsPerPage))}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={sources.length}
                onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1) }}
                customItemsPerPage={customItemsPerPage}
                onCustomItemsPerPageChange={setCustomItemsPerPage}
                itemLabel="nguồn"
              />
            )}
          </>
        )}
      </div>
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa nguồn"
        message={confirmLabel ? `Bạn có chắc muốn xóa nguồn: ${confirmLabel} ?` : 'Bạn có chắc muốn xóa nguồn này?'}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </section>
  )
}

export default AdminNews
