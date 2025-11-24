import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext.jsx'
import feedbackService from '../../../services/features/feedbackService.js'
import { usePageTitle } from '../../../hooks/usePageTitle.js'
import '../HistoryPage/History.css'

const FeedbackPage = () => {
  usePageTitle('Góp ý & Phản hồi')
  const { isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    feedback_type: 'suggestion',
    content: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.content.trim()) {
      setError('Vui lòng nhập nội dung phản hồi')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await feedbackService.create(formData.feedback_type, formData.content)
      setSuccess('Cảm ơn bạn! Phản hồi của bạn đã được ghi nhận. Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.')
      setFormData({
        feedback_type: 'suggestion',
        content: ''
      })
    } catch (err) {
      setError(err.message || 'Không thể gửi phản hồi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="history-container">
        <div className="history-card">
          <h2>Yêu cầu đăng nhập</h2>
          <p>Bạn cần đăng nhập để gửi phản hồi.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="history-container">
      <div className="history-card">
        <h1 className="history-title">Góp ý & Phản hồi</h1>
        <p className="history-subtitle">
          Chúng tôi rất mong nhận được ý kiến đóng góp của bạn để cải thiện dịch vụ
        </p>

        {error && (
          <div style={{ background: '#fed7d7', color: '#c53030', padding: 12, borderRadius: 6, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#c6f6d5', color: '#22543d', padding: 12, borderRadius: 6, marginBottom: 16 }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Loại phản hồi *
            </label>
            <select
              name="feedback_type"
              value={formData.feedback_type}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 16 }}
            >
              <option value="suggestion">Đề xuất cải tiến</option>
              <option value="bug">Báo lỗi</option>
              <option value="question">Câu hỏi</option>
              <option value="complaint">Khiếu nại</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Nội dung phản hồi *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Vui lòng mô tả chi tiết phản hồi của bạn..."
              rows={8}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 16, fontFamily: 'inherit' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#cbd5e0' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-start'
            }}
          >
            {loading ? 'Đang gửi...' : 'Gửi phản hồi'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default FeedbackPage

