import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getHistory } from '../services/diagnosisService.js'
import './History.css'

const HistoryPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory()
    }
  }, [isAuthenticated])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getHistory()
      setHistory(data)
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử chẩn đoán')
    } finally {
      setLoading(false)
    }
  }

  const getSortedHistory = () => {
    const sorted = [...history]
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } else if (sortBy === 'confidence') {
      sorted.sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
    }
    return sorted
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="history-container">
        <div className="history-card">
          <h2>Yêu cầu đăng nhập</h2>
          <p>Bạn cần đăng nhập để xem lịch sử chẩn đoán.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="history-container">
      <div className="history-card">
        <div className="history-header">
          <div>
            <h1 className="history-title">Lịch sử chẩn đoán</h1>
            <p className="history-subtitle">Xem lại các lần chẩn đoán trước đây của bạn</p>
          </div>
          <button 
            className="history-new-btn"
            onClick={() => navigate('/diagnosis')}
          >
            Chẩn đoán mới
          </button>
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
        ) : history.length === 0 ? (
          <div className="history-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
            <p>Bạn chưa có lịch sử chẩn đoán nào.</p>
            <p>Hãy thử chẩn đoán ảnh đầu tiên của bạn!</p>
            <button 
              className="history-start-btn"
              onClick={() => navigate('/diagnosis')}
            >
              Bắt đầu chẩn đoán
            </button>
          </div>
        ) : (
          <>
            <div className="history-controls">
              <label className="history-sort">
                <span>Sắp xếp theo:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="confidence">Độ tin cậy cao nhất</option>
                </select>
              </label>
              <span className="history-count">{history.length} kết quả</span>
            </div>

            <div className="history-list">
              {getSortedHistory().map((item) => (
                <div key={item.diagnosis_id} className="history-item">
                  <div 
                    className="history-item-header"
                    onClick={() => setExpandedId(expandedId === item.diagnosis_id ? null : item.diagnosis_id)}
                  >
                    <div className="history-item-image">
                      {item.image_url ? (
                        <img src={item.image_url} alt="Diagnosis" />
                      ) : (
                        <div className="history-item-placeholder">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="history-item-main">
                      <h3>{item.disease_name || 'Không xác định'}</h3>
                      <div className="history-item-meta">
                        <span className="history-item-date">
                          {formatDate(item.created_at)}
                        </span>
                        <span className="history-item-confidence">
                          Độ tin cậy: {item.confidence_score 
                            ? `${(item.confidence_score * 100).toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <button className="history-item-toggle">
                      {expandedId === item.diagnosis_id ? '▼' : '▶'}
                    </button>
                  </div>

                  {expandedId === item.diagnosis_id && (
                    <div className="history-item-details">
                      {item.result_json?.description && (
                        <div className="history-detail-section">
                          <h4>Mô tả</h4>
                          <p>{item.result_json.description}</p>
                        </div>
                      )}
                      {item.result_json?.recommendation && (
                        <div className="history-detail-section">
                          <h4>Khuyến nghị</h4>
                          <p>{item.result_json.recommendation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default HistoryPage

