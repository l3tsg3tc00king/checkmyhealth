import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { diagnose } from '../services/diagnosisService.js'
import './Diagnosis.css'

const DiagnosisPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (JPG, PNG, GIF, v.v.)')
      return
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 10MB')
      return
    }

    setSelectedFile(file)
    setError('')
    setResult(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      processFile(files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setError('Vui lòng chọn ảnh cần chẩn đoán')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      console.log('Starting diagnosis with file:', selectedFile.name, selectedFile.type, selectedFile.size)
      const diagnosisResult = await diagnose(selectedFile)
      console.log('Diagnosis result:', diagnosisResult)
      setResult(diagnosisResult)
    } catch (err) {
      const errorMsg = err?.message || err?.toString?.() || 'Chẩn đoán thất bại. Vui lòng thử lại.'
      console.error('Diagnosis failed:', errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
    setError('')
  }

  const handleViewHistory = () => {
    navigate('/history')
  }

  if (!isAuthenticated) {
    return (
      <div className="diagnosis-container">
        <div className="diagnosis-card">
          <h2>Yêu cầu đăng nhập</h2>
          <p>Bạn cần đăng nhập để sử dụng tính năng chẩn đoán.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="diagnosis-container">
      <div className="diagnosis-card">
        <h1 className="diagnosis-title">Chẩn đoán bệnh da</h1>
        <p className="diagnosis-subtitle">
          Tải lên hình ảnh vùng da cần kiểm tra để nhận kết quả chẩn đoán nhanh chóng
        </p>

        {error && (
          <div className="diagnosis-error">
            {error}
          </div>
        )}

        {!result ? (
          <form onSubmit={handleSubmit} className="diagnosis-form">
            <div 
              className={`diagnosis-upload-area ${dragActive ? 'diagnosis-upload-area--active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="diagnosis-preview">
                  <img src={preview} alt="Preview" />
                  <button 
                    type="button" 
                    onClick={handleReset}
                    className="diagnosis-remove-btn"
                  >
                    Xóa ảnh
                  </button>
                </div>
              ) : (
                <label className="diagnosis-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="diagnosis-file-input"
                    disabled={loading}
                  />
                  <div className="diagnosis-upload-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p>Nhấp để chọn ảnh hoặc kéo thả vào đây</p>
                    <span className="diagnosis-upload-hint">Hỗ trợ: JPG, PNG, GIF (tối đa 10MB)</span>
                  </div>
                </label>
              )}
            </div>

            <button 
              type="submit" 
              className="diagnosis-submit-btn"
              disabled={!selectedFile || loading}
            >
              {loading ? (
                <>
                  <span className="diagnosis-spinner"></span>
                  Đang chẩn đoán...
                </>
              ) : (
                'Bắt đầu chẩn đoán'
              )}
            </button>
          </form>
        ) : (
          <div className="diagnosis-result">
            <h2>Kết quả chẩn đoán</h2>
            
            {result.image_url && (
              <div className="diagnosis-result-image">
                <img src={result.image_url} alt="Diagnosed" />
              </div>
            )}

            <div className="diagnosis-result-content">
            {result.disease_name && (
                <div className="diagnosis-result-item diagnosis-result-item--disease">
                  <span className="diagnosis-result-label">Bệnh:</span>
                  <span className="diagnosis-result-value">{result.disease_name}</span>
                </div>
              )}

              {result.confidence_score !== undefined && (
                <div className="diagnosis-result-item diagnosis-result-item--confidence">
                  <span className="diagnosis-result-label">Độ tin cậy:</span>
                  <div className="diagnosis-confidence-bar">
                    <div className="diagnosis-confidence-fill" style={{width: `${result.confidence_score * 100}%`}}></div>
                    <span className="diagnosis-result-value">
                      {(result.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {result.description && (
                <div className="diagnosis-result-description">
                  <h3>Mô tả:</h3>
                  <p>{result.description}</p>
                </div>
              )}

              {result.recommendation && (
                <div className="diagnosis-result-recommendation">
                  <h3>Khuyến nghị:</h3>
                  <p>{result.recommendation}</p>
                </div>
              )}

              <div className="diagnosis-result-actions">
                <button 
                  onClick={handleReset}
                  className="diagnosis-new-btn"
                >
                  Chẩn đoán ảnh khác
                </button>
                <button 
                  onClick={handleViewHistory}
                  className="diagnosis-history-btn"
                >
                  Xem lịch sử
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiagnosisPage

