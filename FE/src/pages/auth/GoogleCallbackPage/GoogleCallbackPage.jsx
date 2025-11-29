import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext.jsx'
import { handleGoogleCallback } from '../../../services/auth/authService.js'
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
          const result = handleGoogleCallback(token, userData)
          
          if (result.user) {
            // Cập nhật user trong context
            updateUser(result.user)
          }

          // Redirect về trang chủ
          navigate('/', { replace: true })
        } else {
          setError('Không nhận được token từ server.')
          setLoading(false)
          setTimeout(() => {
            navigate('/login', { replace: true })
          }, 3000)
        }
      } catch (err) {
        console.error('Google callback error:', err)
        setError('Có lỗi xảy ra khi xử lý đăng nhập Google.')
        setLoading(false)
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
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

