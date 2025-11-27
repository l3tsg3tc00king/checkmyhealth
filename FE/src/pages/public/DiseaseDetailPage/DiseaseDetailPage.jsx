import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import diseaseService from '../../../services/features/diseaseService.js'
import ImageViewer from '../../../components/ui/ImageViewer/ImageViewer.jsx'
import { usePageTitle } from '../../../hooks/usePageTitle.js'
import './DiseaseDetailPage.css'

const SECTION_CONFIG = [
  { key: 'description', label: 'Mô tả' },
  { key: 'symptoms', label: 'Triệu chứng' },
  { key: 'identification_signs', label: 'Dấu hiệu nhận biết' },
  { key: 'prevention_measures', label: 'Biện pháp phòng ngừa' },
  { key: 'treatments_medications', label: 'Điều trị & thuốc' },
  { key: 'dietary_advice', label: 'Lời khuyên về chế độ ăn' },
  { key: 'source_references', label: 'Nguồn tham khảo' }
]

const DiseaseDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [disease, setDisease] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  usePageTitle(disease?.disease_name_vi ? `Bệnh lý - ${disease.disease_name_vi}` : 'Chi tiết bệnh lý')

  useEffect(() => {
    const loadDisease = async () => {
      if (!id) return
      try {
        setLoading(true)
        setError('')
        const result = await diseaseService.getById(id)
        setDisease(result)
      } catch (err) {
        console.error('Failed to load disease detail:', err)
        setError('Không tìm thấy thông tin bệnh lý này hoặc xảy ra lỗi bất ngờ.')
      } finally {
        setLoading(false)
      }
    }

    loadDisease()
  }, [id])

  const detailSections = useMemo(() => {
    if (!disease) return []
    return SECTION_CONFIG.filter(({ key }) => disease[key])
  }, [disease])

  if (loading) {
    return (
      <div className="disease-detail">
        <div className="disease-detail__card">
          <div className="disease-detail__loading">
            <span className="disease-detail__spinner" />
            <p>Đang tải chi tiết bệnh lý...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !disease) {
    return (
      <div className="disease-detail">
        <div className="disease-detail__card">
          <p className="disease-detail__error">{error || 'Không tìm thấy bệnh lý.'}</p>
          <button className="disease-detail__back" onClick={() => navigate('/diseases')}>
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="disease-detail">
      <div className="disease-detail__card">
        <div className="disease-detail__header">
          <button className="disease-detail__back" onClick={() => navigate('/diseases')}>
            ← Quay lại danh sách
          </button>
          <div>
            <p className="disease-detail__label">Mã</p>
            <p className="disease-detail__code">{disease.disease_code || 'Chưa cập nhật'}</p>
          </div>
        </div>

        <h1 className="disease-detail__title">{disease.disease_name_vi}</h1>

        {disease.image_url && (
          <div className="disease-detail__image">
            <ImageViewer src={disease.image_url} alt={disease.disease_name_vi} />
          </div>
        )}

        <div className="disease-detail__sections">
          {detailSections.length === 0 ? (
            <p>Chưa có thêm thông tin chi tiết cho bệnh lý này.</p>
          ) : (
            detailSections.map(({ key, label }) => (
              <section key={key} className="disease-detail__section">
                <h2>{label}</h2>
                <p>{disease[key]}</p>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DiseaseDetailPage


