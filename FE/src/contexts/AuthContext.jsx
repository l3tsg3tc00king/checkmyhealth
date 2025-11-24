import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginService, logout as logoutService, register as registerService, isAuthenticated, getToken } from '../services/auth/authService.js'
import { getProfile } from '../services/features/profileService.js'
import { decodeToken } from '../utils/jwt.js'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Lấy role từ token
  const getRoleFromToken = () => {
    const token = getToken()
    if (!token) return null
    const decoded = decodeToken(token)
    return decoded?.role || null
  }

  // Kiểm tra xem user đã đăng nhập chưa khi component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated()) {
          // Có token, lấy thông tin user
          const profile = await getProfile()
          // Lấy role từ token vì profile API không trả về role
          const role = getRoleFromToken()
          setUser({ ...profile, role })
        }
      } catch (err) {
        // Token không hợp lệ hoặc đã hết hạn
        logoutService()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    try {
      setError(null)
      const response = await loginService(credentials)
      // Lấy thông tin user sau khi đăng nhập thành công
      // Sử dụng user từ response nếu có, nếu không thì gọi getProfile
      if (response.user) {
        setUser(response.user)
      } else {
        const profile = await getProfile()
        const role = getRoleFromToken()
        setUser({ ...profile, role })
      }
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await registerService(userData)
      // Sau khi đăng ký thành công, tự động đăng nhập
      if (response.userId) {
        await login({ email: userData.email, password: userData.password })
      }
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const logout = () => {
    logoutService()
    setUser(null)
    setError(null)
  }

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    setError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

