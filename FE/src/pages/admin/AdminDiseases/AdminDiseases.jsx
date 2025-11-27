import { useEffect, useState, useMemo } from 'react'
import '../AdminUsers/AdminUsers.css'
import diseaseService from '../../../services/features/diseaseService.js'
import Pagination from '../../../components/ui/Pagination/Pagination.jsx'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog.jsx'
import ImageViewer from '../../../components/ui/ImageViewer/ImageViewer.jsx'
import { usePageTitle } from '../../../hooks/usePageTitle.js'

const AdminDiseases = () => {
  usePageTitle('Quản lý bệnh lý')
  const [diseases, setDiseases] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [customItemsPerPage, setCustomItemsPerPage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editingDisease, setEditingDisease] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    disease_code: '',
    disease_name_vi: '',
    description: '',
    symptoms: '',
    identification_signs: '',
    prevention_measures: '',
    treatments_medications: '',
    dietary_advice: '',
    source_references: '',
    image_url: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importExportExpanded, setImportExportExpanded] = useState(false)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const loadDiseases = async (keyword = searchTerm) => {
    try {
      setLoading(true)
      setError('')
      const data = await diseaseService.getAll(keyword)
      setDiseases(data || [])
      setCurrentPage(1)
    } catch (err) {
      console.error('Failed to load diseases:', err)
      setError('Lỗi khi tải danh sách bệnh lý')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDiseases()
  }, [])

  const paginatedDiseases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return diseases.slice(startIndex, endIndex)
  }, [diseases, currentPage, itemsPerPage])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    loadDiseases(searchTerm.trim())
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    loadDiseases('')
  }

  const handleAdd = () => {
    setEditMode(true)
    setEditingDisease(null)
    setFormData({
      disease_code: '',
      disease_name_vi: '',
      description: '',
      symptoms: '',
      identification_signs: '',
      prevention_measures: '',
      treatments_medications: '',
      dietary_advice: '',
      source_references: '',
      image_url: ''
    })
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview('')
    setImageFile(null)
  }

  const handleEdit = async (disease) => {
    try {
      setLoading(true)
      setError('')
      // Lấy đầy đủ thông tin bệnh từ API
      const fullDisease = await diseaseService.getById(disease.info_id)
      setEditMode(true)
      setEditingDisease(fullDisease)
      setFormData({
        disease_code: fullDisease.disease_code || '',
        disease_name_vi: fullDisease.disease_name_vi || '',
        description: fullDisease.description || '',
        symptoms: fullDisease.symptoms || '',
        identification_signs: fullDisease.identification_signs || '',
        prevention_measures: fullDisease.prevention_measures || '',
        treatments_medications: fullDisease.treatments_medications || '',
        dietary_advice: fullDisease.dietary_advice || '',
        source_references: fullDisease.source_references || '',
        image_url: fullDisease.image_url || ''
      })
      setImageFile(null)
      setImagePreview(fullDisease.image_url || '')
    } catch (err) {
      console.error('Failed to load disease details:', err)
      setError('Lỗi khi tải thông tin chi tiết bệnh lý')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setFormData((prev) => ({ ...prev, image_url: '' }))
  }

  const handleImageUrlChange = (event) => {
    const url = event.target.value.trim()
    setFormData((prev) => ({ ...prev, image_url: url }))
    
    // Nếu nhập URL, clear file upload
    if (url) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
      setImageFile(null)
      setImagePreview(url)
    } else {
      // Nếu xóa URL, chỉ clear preview nếu không có file
      if (!imageFile) {
        setImagePreview('')
      }
    }
  }

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview('')
    setImageFile(null)
    setFormData((prev) => ({ ...prev, image_url: '' }))
  }

  const handleSave = async () => {
    if (!formData.disease_code || !formData.disease_name_vi) {
      setError('Vui lòng nhập mã bệnh và tên bệnh')
      return
    }

    try {
      setError('')
      const payload = {
        ...formData
      }

      // Nếu có file upload, ưu tiên file (sẽ upload lên Cloudinary)
      // Nếu không có file nhưng có URL, dùng URL
      if (imageFile) {
        payload.image = imageFile
        // Clear image_url khi có file để backend ưu tiên file
        payload.image_url = ''
      } else if (formData.image_url) {
        // Chỉ gửi URL nếu không có file
        payload.image_url = formData.image_url.trim()
      } else {
        // Nếu không có cả file và URL, clear image_url
        payload.image_url = ''
      }

      if (editingDisease) {
        await diseaseService.update(editingDisease.info_id, payload)
      } else {
        await diseaseService.create(payload)
      }
      setEditMode(false)
      setEditingDisease(null)
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
      setImagePreview('')
      setImageFile(null)
      await loadDiseases()
    } catch (err) {
      console.error('Failed to save disease:', err)
      setError(err.response?.data?.message || 'Lỗi khi lưu bệnh lý')
    }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setEditingDisease(null)
    setError('')
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview('')
    setImageFile(null)
  }

  const handleDelete = async (id) => {
    try {
      setError('')
      await diseaseService.delete(id)
      await loadDiseases()
    } catch (err) {
      console.error('Failed to delete disease:', err)
      setError(err.response?.data?.message || 'Lỗi khi xóa bệnh lý')
    }
  }

  const openConfirm = (id, name) => {
    setConfirmTarget(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return
    try {
      setConfirmOpen(false)
      await handleDelete(confirmTarget)
    } catch (err) {
      // handleDelete already sets error
    } finally {
      setConfirmTarget(null)
    }
  }

  const handleExportAll = async () => {
    try {
      setError('')
      await diseaseService.exportAll('csv')
    } catch (err) {
      setError(err.message || 'Lỗi khi export dữ liệu')
    }
  }

  const handleExportSample = async () => {
    try {
      setError('')
      await diseaseService.exportSample('csv')
    } catch (err) {
      setError(err.message || 'Lỗi khi export template')
    }
  }

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setError('')
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      setError('Vui lòng chọn file để import')
      return
    }

    try {
      setImporting(true)
      setError('')
      setImportResult(null)
      const result = await diseaseService.import(importFile)
      setImportFile(null)
      // Reset file input
      const fileInput = document.getElementById('import-file-input')
      if (fileInput) fileInput.value = ''
      
      // Luôn hiển thị kết quả, có thể có duplicates
      if (result.duplicates && result.duplicates.length > 0) {
        setImportResult({
          type: 'duplicates',
          duplicates: result.duplicates,
          total: result.total,
          duplicates_count: result.duplicates_count,
          new_count: result.new_count,
          imported: result.imported
        })
      } else {
        setImportResult({
          type: 'success',
          imported: result.imported,
          total: result.total
        })
      }
      
      // Reload danh sách nếu có import thành công
      if (result.imported > 0) {
        await loadDiseases()
      }
    } catch (err) {
      const errorMessage = err.message || 'Lỗi khi import dữ liệu'
      setError(errorMessage)
      setImportResult(null)
    } finally {
      setImporting(false)
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Bệnh lý</h1>
          <p>Quản lý danh sách bệnh lý da liễu</p>
        </div>
        {!editMode && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Tìm theo tên hoặc mã bệnh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', minWidth: 240 }}
              />
              <button type="submit" className="btn">
                Tìm kiếm
              </button>
              {searchTerm && (
                <button type="button" className="btn" onClick={handleClearSearch}>
                  Xóa
                </button>
              )}
            </form>
            <button className="btn btn-primary" onClick={handleAdd}>
              Thêm bệnh lý mới
            </button>
          </div>
        )}
      </header>

      {error && (
        <div style={{ background: '#fed7d7', color: '#c53030', padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!editMode && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ background: '#f7fafc', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <button
              onClick={() => setImportExportExpanded(!importExportExpanded)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600,
                color: '#4a5568',
                fontSize: '0.95rem'
              }}
            >
              <span>Import / Export</span>
              <span style={{ fontSize: '0.8rem', transition: 'transform 0.2s', transform: importExportExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            </button>
            {importExportExpanded && (
              <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#4a5568', minWidth: 80 }}>Export:</span>
                  <button className="btn" onClick={handleExportAll} style={{ fontSize: '0.9rem' }}>
                    Export CSV
                  </button>
                  <span style={{ margin: '0 8px', color: '#cbd5e0' }}>|</span>
                  <button className="btn" onClick={handleExportSample} style={{ fontSize: '0.9rem' }}>
                    Template CSV
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#4a5568', minWidth: 80 }}>Import:</span>
                  <input
                    id="import-file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleImportFileChange}
                    style={{ fontSize: '0.9rem' }}
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={handleImport}
                    disabled={!importFile || importing}
                    style={{ fontSize: '0.9rem' }}
                  >
                    {importing ? 'Đang import...' : 'Import'}
                  </button>
                </div>
                {importResult && (
                  <div style={{ 
                    padding: '12px', 
                    borderRadius: 6, 
                    background: importResult.type === 'duplicates' ? '#fff3cd' : '#d1e7dd',
                    border: `1px solid ${importResult.type === 'duplicates' ? '#ffc107' : '#28a745'}`
                  }}>
                    {importResult.type === 'duplicates' ? (
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 8, color: '#856404' }}>
                          {importResult.imported > 0 ? (
                            <>✓ Đã import {importResult.imported} bệnh lý. Phát hiện {importResult.duplicates_count} bệnh trùng lặp:</>
                          ) : (
                            <>Phát hiện {importResult.duplicates_count} bệnh trùng lặp:</>
                          )}
                        </div>
                        <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 8 }}>
                          <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8f9fa' }}>
                                <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #dee2e6', border: '1px solid #dee2e6' }}>Mã bệnh</th>
                                <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #dee2e6', border: '1px solid #dee2e6' }}>Tên bệnh (Import)</th>
                                <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #dee2e6', border: '1px solid #dee2e6' }}>Tên bệnh (Hiện có)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importResult.duplicates.map((dup, idx) => (
                                <tr key={idx}>
                                  <td style={{ padding: '6px', border: '1px solid #f0f0f0' }}>{dup.disease_code}</td>
                                  <td style={{ padding: '6px', border: '1px solid #f0f0f0' }}>{dup.disease_name_vi}</td>
                                  <td style={{ padding: '6px', border: '1px solid #f0f0f0' }}>{dup.existing_name || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#856404' }}>
                          Tổng: {importResult.total} | Trùng: {importResult.duplicates_count} | Đã import: {importResult.imported}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#155724', fontWeight: 500 }}>
                        ✓ Import thành công {importResult.imported} bệnh lý (tổng {importResult.total} dòng)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {editMode ? (
        <div style={{ background: 'white', padding: 24, borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <h2 style={{ marginTop: 0 }}>{editingDisease ? 'Chỉnh sửa bệnh lý' : 'Thêm bệnh lý mới'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Mã bệnh *</label>
              <input
                type="text"
                value={formData.disease_code}
                onChange={(e) => setFormData({ ...formData, disease_code: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4 }}
                placeholder="VD: E11.9"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Tên bệnh (Tiếng Việt) *</label>
              <input
                type="text"
                value={formData.disease_name_vi}
                onChange={(e) => setFormData({ ...formData, disease_name_vi: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4 }}
                placeholder="VD: Bệnh vẩy nến"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Ảnh minh họa</label>
              {imagePreview ? (
                <div style={{ marginBottom: 8, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                  <ImageViewer 
                    src={imagePreview} 
                    alt="Xem trước ảnh bệnh"
                    className="disease-image-preview"
                  />
                  <div className="image-error" style={{ display: 'none', padding: '12px', background: '#fee', color: '#c33', borderRadius: 6, fontSize: 14 }}>
                    Không thể tải ảnh từ URL này. Vui lòng kiểm tra lại URL hoặc upload file.
                  </div>
                </div>
              ) : (
                <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: 14 }}>Chưa có ảnh được chọn</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#4a5568' }}>Hoặc nhập URL ảnh:</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={handleImageUrlChange}
                    placeholder="https://example.com/image.jpg"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4 }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: '#4a5568', marginRight: 8 }}>Hoặc</span>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <label style={{ fontSize: 14, color: '#4a5568', marginRight: 8 }}>Upload từ máy:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  {imagePreview && (
                    <button type="button" className="btn" onClick={handleRemoveImage}>
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4, minHeight: 100 }}
                placeholder="Mô tả về bệnh..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Triệu chứng</label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4, minHeight: 100 }}
                placeholder="Các triệu chứng của bệnh..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Dấu hiệu nhận biết</label>
              <textarea
                value={formData.identification_signs}
                onChange={(e) => setFormData({ ...formData, identification_signs: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4, minHeight: 100 }}
                placeholder="Các dấu hiệu nhận biết..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Biện pháp phòng ngừa</label>
              <textarea
                value={formData.prevention_measures}
                onChange={(e) => setFormData({ ...formData, prevention_measures: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4, minHeight: 100 }}
                placeholder="Các biện pháp phòng ngừa..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Điều trị và thuốc</label>
              <textarea
                value={formData.treatments_medications}
                onChange={(e) => setFormData({ ...formData, treatments_medications: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4, minHeight: 100 }}
                placeholder="Phương pháp điều trị và thuốc..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Lời khuyên về chế độ ăn</label>
              <textarea
                value={formData.dietary_advice}
                onChange={(e) => setFormData({ ...formData, dietary_advice: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4, minHeight: 100 }}
                placeholder="Lời khuyên về chế độ ăn uống..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Nguồn tham khảo</label>
              <textarea
                value={formData.source_references}
                onChange={(e) => setFormData({ ...formData, source_references: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4, minHeight: 80 }}
                placeholder="Các nguồn tham khảo..."
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {editingDisease ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button className="btn" onClick={handleCancelEdit}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid rgba(102, 126, 234, 0.2)', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              <p style={{ marginTop: 12, color: '#718096' }}>Đang tải...</p>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : diseases.length === 0 ? (
            <p>Chưa có bệnh lý nào. Thêm bệnh lý mới để bắt đầu.</p>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {paginatedDiseases.map((d) => (
                  <div key={d.info_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 6, gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      {d.image_url && (
                        <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={d.image_url}
                            alt={d.disease_name_vi}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{d.disease_name_vi}</div>
                        <div style={{ color: '#6b7280', fontSize: 14 }}>Mã: {d.disease_code || 'N/A'}</div>
                        {d.description && (
                          <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 4, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {d.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" onClick={() => handleEdit(d)}>Sửa</button>
                      <button className="btn" onClick={() => openConfirm(d.info_id, d.disease_name_vi)}>Xóa</button>
                    </div>
                  </div>
                ))}
              </div>

              {diseases.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.max(1, Math.ceil(diseases.length / itemsPerPage))}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={diseases.length}
                  onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1) }}
                  customItemsPerPage={customItemsPerPage}
                  onCustomItemsPerPageChange={setCustomItemsPerPage}
                  itemLabel="bệnh lý"
                />
              )}
            </>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa bệnh lý"
        message="Bạn có chắc muốn xóa bệnh lý này?"
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </section>
  )
}

export default AdminDiseases

