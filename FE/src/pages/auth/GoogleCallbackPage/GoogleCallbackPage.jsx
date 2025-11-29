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
          // Redirect về login sau 3 giây
          setTimeout(() => {
            navigate('/login', { replace: true })
          }, 3000)
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

            // Redirect về trang chủ
            navigate('/', { replace: true })
          } catch (err) {
            console.error('Error processing callback:', err)
            // Token đã được lưu, vẫn redirect về home
            // AuthContext sẽ tự động load user khi check auth
            navigate('/', { replace: true })
          }
        } else {
          // Kiểm tra xem có token trong localStorage không (có thể đã được lưu trước đó)
          const existingToken = getToken()
          if (existingToken) {
            // Có token, có thể đã đăng nhập thành công, redirect về home
            navigate('/', { replace: true })
          } else {
            setError('Không nhận được token từ server.')
            setLoading(false)
            setTimeout(() => {
              navigate('/login', { replace: true })
            }, 3000)
          }
        }
      } catch (err) {
        console.error('Google callback error:', err)
        // Kiểm tra xem có token không
        const existingToken = getToken()
        if (existingToken) {
          // Có token, vẫn redirect về home
          navigate('/', { replace: true })
        } else {
          setError('Có lỗi xảy ra khi xử lý đăng nhập Google.')
          setLoading(false)
          setTimeout(() => {
            navigate('/login', { replace: true })
          }, 3000)
        }
      } finally {
        setLoading(false)
      }
    }

    processCallback()
  }, [searchParams, navigate, updateUser])

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Đang xử lý...</h1>
          <p className="auth-subtitle">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Đăng nhập Google</h1>
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        <p className="auth-subtitle">
          {error ? 'Đang chuyển hướng về trang đăng nhập...' : 'Đăng nhập thành công!'}
        </p>
      </div>
    </div>
  )
}

export default GoogleCallbackPage

