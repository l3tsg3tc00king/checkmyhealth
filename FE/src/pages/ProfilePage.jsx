import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { updateProfile, updateAvatar } from '../services/profileService.js'
import './Profile.css'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await updateProfile({ fullName: formData.fullName })
      updateUser({ fullName: formData.fullName })
      setSuccess('Cập nhật hồ sơ thành công!')
    } catch (err) {
      setError(err.message || 'Không thể cập nhật hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')
    setAvatarUploading(true)

    try {
      const result = await updateAvatar(file)
      if (result?.avatar_url) {
        updateUser({ avatar_url: result.avatar_url })
        setSuccess('Cập nhật ảnh đại diện thành công!')
      } else {
        setSuccess('Đã cập nhật ảnh đại diện.')
      }
    } catch (err) {
      setError(err.message || 'Không thể cập nhật ảnh đại diện')
    } finally {
      setAvatarUploading(false)
      // reset input để có thể chọn lại cùng một file nếu cần
      e.target.value = ''
    }
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Đang tải thông tin...</p>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1 className="profile-title">Hồ sơ của tôi</h1>

        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            <img
              src={user.avatar_url || 'https://via.placeholder.com/120?text=Avatar'}
              alt="Avatar"
              className="profile-avatar-image"
            />
          </div>
          <label className="profile-avatar-upload">
            <span>{avatarUploading ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
          </label>
        </div>

        {error && (
          <div className="profile-error">
            {error}
          </div>
        )}

        {success && (
          <div className="profile-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              disabled
              className="profile-input-disabled"
            />
            <small className="profile-hint">Email không thể thay đổi</small>
          </div>

          <div className="profile-form-group">
            <label htmlFor="fullName">Họ và tên</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              required
              disabled={loading}
            />
          </div>

          <div className="profile-form-group">
            <label>Phương thức đăng nhập</label>
            <input
              type="text"
              value={user.provider === 'local' ? 'Email/Password' : 'Google'}
              disabled
              className="profile-input-disabled"
            />
          </div>

          <button 
            type="submit" 
            className="profile-button"
            disabled={loading}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfilePage

