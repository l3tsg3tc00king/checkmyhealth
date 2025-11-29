import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { usePageTitle } from '../../../hooks/usePageTitle.js'
import { publicResetPassword } from '../../../services/auth/authService.js'
import '../Auth.css'

const ResetPasswordPage = () => {
  usePageTitle('Đặt lại mật khẩu')
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!email) {
      // Nếu không có email từ state, redirect về forgot password
      navigate('/forgot-password', { replace: true })
    }
  }, [email, navigate])

  // Kiểm tra độ mạnh mật khẩu (match với backend)
  const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return regex.test(password)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate
    if (!code || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (code.length !== 6) {
      setError('Mã xác nhận phải có 6 số')
      return
    }

    // Kiểm tra độ mạnh mật khẩu (match với backend)
    if (!isStrongPassword(newPassword)) {
      setError('Mật khẩu quá yếu. Yêu cầu: Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)

    try {
      const response = await publicResetPassword({
        email,
        code,
        newPassword
      })
      setSuccess(response.message || 'Đặt lại mật khẩu thành công!')
      // Redirect đến trang login sau 2 giây
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } catch (err) {
      setError(err.message || 'Đặt lại mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Đặt lại mật khẩu</h1>
        <p className="auth-subtitle">
          Nhập mã xác nhận đã được gửi đến email và mật khẩu mới
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success" style={{ 
            background: '#d1fae5', 
            color: '#065f46', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '16px' 
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading || !!success}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="code">Mã xác nhận (6 số)</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              disabled={loading || !!success}
              style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '18px' }}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading || !!success}
              minLength={8}
            />
            <small style={{ color: '#666666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Yêu cầu: Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)
            </small>
          </div>

          <div className="auth-form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading || !!success}
              minLength={8}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading || !!success}
          >
            {loading ? 'Đang xử lý...' : success ? 'Thành công!' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Chưa nhận được mã?{' '}
            <Link to="/forgot-password" className="auth-link">
              Gửi lại mã
            </Link>
          </p>
          <p style={{ marginTop: '8px' }}>
            Nhớ mật khẩu?{' '}
            <Link to="/login" className="auth-link">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage

