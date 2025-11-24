import { useEffect, useState } from 'react'
import { getHistoryForUser } from '../../../../services/features/adminService.js'
import { formatDateAndTime } from '../../../../utils/format.js'
import './UserHistoryModal.css'

const UserHistoryModal = ({ isOpen, onClose, userId, userName }) => {
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory()
    }
  }, [isOpen, userId])

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getHistoryForUser(userId)
      setHistoryData(data || [])
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử chẩn đoán')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Lịch sử chẩn đoán - {userName}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading && <p className="loading-text">Đang tải dữ liệu...</p>}
          
          {error && <p className="error-text">Lỗi: {error}</p>}

          {!loading && !error && historyData.length === 0 && (
            <p className="empty-text">Chưa có lịch sử chẩn đoán nào.</p>
          )}

          {!loading && !error && historyData.length > 0 && (
            <div className="history-list">
              {historyData.map((record) => (
                <div key={record.diagnosis_id} className="history-item">
                  <div className="history-item__header">
                    <span className="history-item__id">
                      Chẩn đoán #{record.diagnosis_id}
                    </span>
                    <span className="history-item__date">
                      {formatDateAndTime(record.created_at)}
                    </span>
                  </div>

                  <div className="history-item__content">
                    {record.image_url && (
                      <div className="history-item__image">
                        <img 
                          src={record.image_url} 
                          alt="Hình ảnh chẩn đoán"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image'
                          }}
                        />
                      </div>
                    )}

                    <div className="history-item__details">
                      <div className="detail-row">
                        <span className="detail-label">Bệnh:</span>
                        <span className="detail-value">{record.disease_name || '--'}</span>
                      </div>

                      <div className="detail-row">
                        <span className="detail-label">Độ chính xác:</span>
                        <span className="detail-value">
                          {record.confidence_score 
                            ? `${(record.confidence_score * 100).toFixed(2)}%` 
                            : '--'
                          }
                        </span>
                      </div>

                      {record.result_json && (
                        <div className="detail-row">
                          <span className="detail-label">Chi tiết:</span>
                          <pre className="detail-json">
                            {JSON.stringify(record.result_json, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserHistoryModal
