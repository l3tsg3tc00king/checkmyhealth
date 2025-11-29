import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext.jsx'
import { handleGoogleCallback, getToken } from '../../../services/auth/authService.js'
import { getProfile } from '../../../services/features/profileService.js'
import { decodeToken } from '../../../utils/jwt.js'
import '../Auth.css'

const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get('token')
        const userData = searchParams.get('user')
        const errorParam = searchParams.get('error')

        // Kiểm tra lỗi từ backend
        if (errorParam) {
          let errorMessage = 'Đăng nhập Google thất bại'
          switch (errorParam) {
            case 'auth_failed':
              errorMessage = 'Xác thực Google thất bại. Vui lòng thử lại.'
              break
            case 'no_user':
              errorMessage = 'Không tìm thấy thông tin người dùng.'
              break
            case 'account_suspended':
              errorMessage = 'Tài khoản của bạn đã bị tạm khóa.'
              break
            case 'token_failed':
              errorMessage = 'Lỗi tạo token. Vui lòng thử lại.'
              break
            default:
              errorMessage = 'Đăng nhập Google thất bại.'
          }
          setError(errorMessage)
          setLoading(false)
          return
        }

        // Xử lý callback thành công
        if (token) {
          // Lưu token trước
          localStorage.setItem('token', token)
          
          try {
            // Thử parse user data từ URL nếu có
            let user = null
            if (userData) {
              try {
                const parsedUser = JSON.parse(decodeURIComponent(userData))
                user = parsedUser
              } catch (parseError) {
                console.warn('Could not parse user data from URL:', parseError)
                // Tiếp tục, sẽ load từ API
              }
            }

            // Nếu không có user data từ URL, load từ API
            if (!user) {
              try {
                const profile = await getProfile()
                const decoded = decodeToken(token)
                user = {
                  ...profile,
                  role: decoded?.role || 'user'
                }
              } catch (profileError) {
                console.error('Error loading profile:', profileError)
                // Vẫn tiếp tục với token đã lưu
                const decoded = decodeToken(token)
                if (decoded) {
                  user = {
                    userId: decoded.userId,
                    email: decoded.email,
                    role: decoded.role || 'user'
                  }
                }
              }
            }

            // Cập nhật user trong context
            if (user) {
              updateUser(user)
            }

            // Đánh dấu thành công
            setSuccess(true)
            setLoading(false)
          } catch (err) {
            console.error('Error processing callback:', err)
            // Token đã được lưu, vẫn đánh dấu thành công
            setSuccess(true)
            setLoading(false)
          }
        } else {
          // Kiểm tra xem có token trong localStorage không (có thể đã được lưu trước đó)
          const existingToken = getToken()
          if (existingToken) {
            // Có token, có thể đã đăng nhập thành công
            setSuccess(true)
            setLoading(false)
          } else {
            setError('Không nhận được token từ server.')
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Google callback error:', err)
        // Kiểm tra xem có token không
        const existingToken = getToken()
        if (existingToken) {
          // Có token, vẫn đánh dấu thành công
          setSuccess(true)
          setLoading(false)
        } else {
          setError('Có lỗi xảy ra khi xử lý đăng nhập Google.')
          setLoading(false)
        }
      }
    }

    processCallback()
  }, [searchParams, navigate, updateUser])

  // Timer đếm ngược và redirect
  useEffect(() => {
    if (!loading && (success || error)) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            // Redirect về trang chủ nếu thành công, về login nếu lỗi
            if (success) {
              navigate('/', { replace: true })
            } else {
              navigate('/login', { replace: true })
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [loading, success, error, navigate])

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '1.5rem',
            padding: '2rem 0'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(0, 102, 204, 0.1)',
              borderTopColor: '#0066CC',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}></div>
            <div style={{ textAlign: 'center' }}>
              <h1 className="auth-title" style={{ marginBottom: '0.5rem' }}>Đang xử lý...</h1>
              <p className="auth-subtitle">Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Đăng nhập Google</h1>
        
        {success && (
          <div className="auth-success">
            <div className="auth-success-icon">✓</div>
            <div className="auth-success-content">
              <p className="auth-success-title">Đăng nhập thành công!</p>
              <p className="auth-success-subtitle">
                Đang chuyển hướng về trang chủ trong {countdown} giây...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="auth-error">
            <div className="auth-error-icon">✕</div>
            <div className="auth-error-content">
              <p className="auth-error-title">Đăng nhập thất bại</p>
              <p className="auth-error-message">{error}</p>
              <p className="auth-error-subtitle">
                Đang chuyển hướng về trang đăng nhập trong {countdown} giây...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GoogleCallbackPage

