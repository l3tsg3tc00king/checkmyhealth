import { useEffect, useMemo, useState } from 'react'
import '../AdminUsers/AdminUsers.css'
import './AdminFeedback.css'
import {
  getFeedbackList,
  updateFeedbackStatus as updateFeedbackStatusApi,
  deleteFeedback as deleteFeedbackApi,
} from '../../../services/features/adminService.js'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog.jsx'
import { usePageTitle } from '../../../hooks/usePageTitle.js'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'resolved', label: 'Đã xử lý' },
]

const TYPE_LABELS = {
  suggestion: 'Đề xuất',
  bug: 'Báo lỗi',
  question: 'Câu hỏi',
  complaint: 'Khiếu nại',
  other: 'Khác',
}

const normalizeStatus = (status) => (status || 'pending').toLowerCase()

const AdminFeedback = () => {
  usePageTitle('Quản lý phản hồi người dùng')
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getFeedbackList()
      setFeedbacks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch feedback list:', err)
      setError(err.message || 'Không thể tải danh sách phản hồi')
    } finally {
      setLoading(false)
    }
  }

  const filteredFeedbacks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return feedbacks.filter((item) => {
      const statusValue = normalizeStatus(item.status)
      const matchesStatus = statusFilter === 'all' ? true : statusValue === statusFilter
      if (!matchesStatus) return false

      if (!query) return true
      const haystack = [
        item.content,
        item.feedback_type,
        item.email,
        item.full_name,
        item.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [feedbacks, searchTerm, statusFilter])

  const formatDate = (value) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return value
    }
  }

  const handleStatusChange = async (feedbackId, nextStatus) => {
    if (!nextStatus) return
    try {
      setStatusUpdatingId(feedbackId)
      await updateFeedbackStatusApi(feedbackId, nextStatus)
      setFeedbacks((prev) =>
        prev.map((item) =>
          item.feedback_id === feedbackId ? { ...item, status: nextStatus } : item
        )
      )
    } catch (err) {
      console.error('Failed to update feedback status:', err)
      setError(err.message || 'Không thể cập nhật trạng thái phản hồi')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return
    try {
      await deleteFeedbackApi(confirmDeleteId)
      setFeedbacks((prev) => prev.filter((item) => item.feedback_id !== confirmDeleteId))
    } catch (err) {
      console.error('Failed to delete feedback:', err)
      setError(err.message || 'Không thể xóa phản hồi')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Phản hồi người dùng</h1>
          <p>Theo dõi và xử lý các phản hồi do người dùng gửi lên hệ thống</p>
        </div>
        <button className="btn" onClick={loadFeedbacks} disabled={loading}>
          Tải lại
        </button>
      </header>

      <div className="admin-feedback__filters">
        <input
          type="text"
          placeholder="Tìm theo nội dung, email hoặc loại phản hồi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-feedback__search"
        />
        <div className="admin-feedback__status-filter">
          {['all', ...STATUS_OPTIONS.map((s) => s.value)].map((value) => (
            <button
              key={value}
              className={`admin-feedback__status-btn ${
                statusFilter === value ? 'active' : ''
              }`}
              onClick={() => setStatusFilter(value)}
            >
              {value === 'all'
                ? 'Tất cả'
                : STATUS_OPTIONS.find((option) => option.value === value)?.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="admin-feedback__error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-feedback__loading">
          <div className="admin-feedback__spinner" />
          <p>Đang tải phản hồi...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="admin-feedback__empty">
          <p>Không tìm thấy phản hồi nào phù hợp.</p>
          <p>Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="admin-feedback__list">
          {filteredFeedbacks.map((item) => {
            const statusValue = normalizeStatus(item.status)
            const typeLabel = TYPE_LABELS[item.feedback_type] || 'Khác'
            const statusLabel =
              STATUS_OPTIONS.find((option) => option.value === statusValue)?.label ||
              'Chờ xử lý'

            return (
              <div key={item.feedback_id} className="admin-feedback__item">
                <div className="admin-feedback__item-header">
                  <div className="admin-feedback__item-meta">
                    <span className={`admin-feedback__badge type-${item.feedback_type || 'other'}`}>
                      {typeLabel}
                    </span>
                    <div>
                      <strong>{item.full_name || 'Người dùng ẩn danh'}</strong>
                      <p className="admin-feedback__email">
                        {item.email || 'Không có email'}
                      </p>
                    </div>
                  </div>
                  <div className="admin-feedback__status-control">
                    <span className={`admin-feedback__status-badge status-${statusValue}`}>
                      {statusLabel}
                    </span>
                    <select
                      value={statusValue}
                      onChange={(e) => handleStatusChange(item.feedback_id, e.target.value)}
                      disabled={statusUpdatingId === item.feedback_id}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-feedback__content">
                  {item.content}
                </div>

                <div className="admin-feedback__footer">
                  <span>{formatDate(item.submitted_at || item.created_at)}</span>
                  <div className="admin-feedback__actions">
                    <button
                      className="btn btn-danger"
                      onClick={() => setConfirmDeleteId(item.feedback_id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa phản hồi"
        message="Bạn có chắc chắn muốn xóa phản hồi này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </section>
  )
}

export default AdminFeedback


