import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import diseaseService from '../../../services/features/diseaseService.js'
import Pagination from '../../../components/ui/Pagination/Pagination.jsx'
import { usePageTitle } from '../../../hooks/usePageTitle.js'
import '../../user/HistoryPage/History.css'

const DiseasesPage = () => {
  usePageTitle('Bệnh lý')
  const navigate = useNavigate()
  const [diseases, setDiseases] = useState([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customItemsPerPage, setCustomItemsPerPage] = useState(false)

  useEffect(() => {
    loadDiseases()
  }, [search])

  const loadDiseases = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await diseaseService.getAll(search)
      setDiseases(data || [])
      setCurrentPage(1)
    } catch (err) {
      console.error('Error loading diseases:', err)
      setError('Lỗi khi tải danh sách bệnh lý')
    } finally {
      setLoading(false)
    }
  }

  const paginatedDiseases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return diseases.slice(startIndex, endIndex)
  }, [diseases, currentPage, itemsPerPage])

  const handleNavigateDetail = (id) => {
    navigate(`/diseases/${id}`)
  }

  return (
    <div className="history-container">
      <div className="history-card">
        <div className="history-header">
          <div>
            <h1 className="history-title">Bệnh lý</h1>
            <p className="history-subtitle">Tra cứu thông tin về các bệnh lý da liễu</p>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fed7d7', color: '#c53030', padding: 12, borderRadius: 6, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Tìm kiếm bệnh lý..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
        </div>

        {loading ? (
          <div className="history-loading">
            <div className="history-spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : diseases.length === 0 ? (
          <div className="history-empty">
            <p>Không tìm thấy bệnh lý nào.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
              {paginatedDiseases.map((disease) => (
                <div
                  key={disease.info_id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 16,
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                  onClick={() => handleNavigateDetail(disease.info_id)}
                >
                  {disease.image_url && (
                    <div style={{ width: '100%', paddingBottom: '56.25%', position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                      <img
                        src={disease.image_url}
                        alt={disease.disease_name_vi}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600, color: '#1a202c' }}>
                    {disease.disease_name_vi}
                  </h3>
                  {disease.disease_code && (
                    <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#6b7280' }}>
                      Mã: {disease.disease_code}
                    </p>
                  )}
                  <span style={{ marginTop: 'auto', fontSize: 14, color: '#6366f1', fontWeight: 600 }}>
                    Xem chi tiết →
                  </span>
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
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value)
                  setCurrentPage(1)
                }}
                customItemsPerPage={customItemsPerPage}
                onCustomItemsPerPageChange={setCustomItemsPerPage}
                itemLabel="bệnh lý"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DiseasesPage

