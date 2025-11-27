import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getHistoryForUser } from '../../../services/features/adminService.js'
import { deleteHistory } from '../../../services/features/diagnosisService.js'
import { usePageTitle } from '../../../hooks/usePageTitle.js'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog.jsx'
import ImageViewer from '../../../components/ui/ImageViewer/ImageViewer.jsx'
import '../../user/HistoryPage/History.css'

const AdminUserHistoryPage = () => {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [userName, setUserName] = useState('')

  usePageTitle(`Lịch sử chuẩn đoán - User #${userId}`)

  useEffect(() => {
    if (userId) {
      fetchHistory()
    }
  }, [userId])

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getHistoryForUser(userId)
      // Normalize data giống như HistoryPage
      const safeParse = (value) => {
        if (!value) return null
        if (typeof value === 'object') return value
        try {
          return JSON.parse(value)
        } catch {
          return null
        }
      }

      const normalized = (data || []).map((entry) => {
        const parsed = safeParse(entry.result_json)
        const timestamp =
          entry.diagnosed_at ||
          entry.created_at ||
          entry.createdAt ||
          entry.updated_at ||
          null

        return {
          ...entry,
          result_json: parsed || entry.result_json,
          diagnosed_at: entry.diagnosed_at || null,
          created_at: entry.created_at || timestamp,
        }
      })
      setHistoryData(normalized)
      
      // Lấy tên user từ data đầu tiên nếu có
      if (normalized.length > 0 && normalized[0].user_id) {
        // Có thể lấy từ API hoặc từ data
        setUserName(`User #${userId}`)
      }
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử chuẩn đoán')
    } finally {
      setLoading(false)
    }
  }

  const getTimestamp = (item) =>
    item.diagnosed_at || item.created_at || item.createdAt || item.updated_at || null

  const getConfidence = (item) =>
    item.confidence_score ?? item.result_json?.confidence_score ?? null

  const getDiseaseName = (item) =>
    item.disease_name || item.result_json?.disease_name || 'Không xác định'

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A'
    const date = new Date(dateValue)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDeleteClick = (e, item) => {
    e.stopPropagation()
    const itemId = item.diagnosis_id || item.history_id
    if (itemId) {
      setDeleteTarget(itemId)
      setConfirmOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    
    try {
      setDeleting(true)
      setError(null)
      await deleteHistory(deleteTarget)
      setConfirmOpen(false)
      setDeleteTarget(null)
      await fetchHistory()
    } catch (err) {
      setError(err.message || 'Không thể xóa lịch sử chuẩn đoán')
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setConfirmOpen(false)
    setDeleteTarget(null)
  }

  return (
    <div className="history-container">
      <div className="history-card">
        <div className="history-header">
          <div>
            <button 
              className="history-new-btn"
              onClick={() => navigate('/admin/users')}
              style={{ marginBottom: '1rem', background: '#e2e8f0', color: '#2d3748' }}
            >
              ← Quay lại danh sách người dùng
            </button>
            <h1 className="history-title">Lịch sử chuẩn đoán - User #{userId}</h1>
            <p className="history-subtitle">Xem lịch sử chuẩn đoán của người dùng này</p>
          </div>
        </div>

        {error && (
          <div className="history-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="history-loading">
            <div className="history-spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : historyData.length === 0 ? (
          <div className="history-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
            <p>Người dùng này chưa có lịch sử chuẩn đoán nào.</p>
          </div>
        ) : (
          <div className="history-list">
            {historyData.map((item, index) => {
              const itemId = item.diagnosis_id || item.history_id || `history-${index}`
              const isExpanded = expandedId === itemId
              
              return (
                <div key={itemId} className="history-item">
                  <div 
                    className="history-item-header"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedId(isExpanded ? null : itemId)
                    }}
                  >
                    <div className="history-item-image">
                      {item.image_url ? (
                        <ImageViewer src={item.image_url} alt="Diagnosis" />
                      ) : (
                        <div className="history-item-placeholder">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="history-item-main">
                      <h3>{getDiseaseName(item)}</h3>
                      <div className="history-item-meta">
                        <span className="history-item-date">
                          {formatDate(getTimestamp(item))}
                        </span>
                        <span className="history-item-confidence">
                          Độ tin cậy: {getConfidence(item)
                            ? `${(getConfidence(item) * 100).toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {!isExpanded && (
                        <button
                          className="history-item-delete"
                          onClick={(e) => handleDeleteClick(e, item)}
                          disabled={deleting}
                          title="Xóa lịch sử này"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                      <button 
                        className="history-item-toggle"
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedId(isExpanded ? null : itemId)
                        }}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="history-item-details">
                      {item.result_json?.description && (
                        <div className="history-detail-section">
                          <h4>Mô tả</h4>
                          <p>{item.result_json.description}</p>
                        </div>
                      )}
                      {item.result_json?.info_id && (
                        <div className="history-detail-section">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/diseases/${item.result_json.info_id}`)
                            }}
                            className="history-detail-link"
                          >
                            Xem thông tin y khoa chi tiết
                          </button>
                        </div>
                      )}
                      <div className="history-detail-section">
                        <button
                          onClick={(e) => handleDeleteClick(e, item)}
                          className="history-delete-btn"
                          disabled={deleting}
                        >
                          {deleting && deleteTarget === (item.diagnosis_id || item.history_id) ? 'Đang xóa...' : 'Xóa lịch sử này'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa lịch sử"
        message={`Bạn có chắc chắn muốn xóa lịch sử chuẩn đoán này? Hành động này không thể hoàn tác.`}
        confirmText={deleting ? 'Đang xóa...' : 'Xóa'}
        cancelText="Hủy"
        type="danger"
        isConfirming={deleting}
      />
    </div>
  )
}

export default AdminUserHistoryPage

