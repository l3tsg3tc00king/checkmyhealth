import { apiClient } from '../api/apiClient.js'
import { API_BASE_URL } from '../../config/api.js'

/**
 * Đăng ký tài khoản mới
 * @param {Object} userData - Dữ liệu đăng ký
 * @param {string} userData.email - Email
 * @param {string} userData.password - Mật khẩu
 * @param {string} userData.fullName - Họ và tên
 * @returns {Promise<Object>} Kết quả đăng ký
 */
export const register = async (userData) => {
  try {
    const response = await apiClient('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    return response
  } catch (error) {
    throw new Error(error.message || 'Đăng ký thất bại')
  }
}

/**
 * Đăng nhập
 * @param {Object} credentials - Thông tin đăng nhập
 * @param {string} credentials.email - Email
 * @param {string} credentials.password - Mật khẩu
 * @returns {Promise<Object>} Kết quả đăng nhập (chứa token)
 */
export const login = async (credentials) => {
  try {
    const response = await apiClient('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    
    // Lưu token vào localStorage
    if (response.token) {
      localStorage.setItem('token', response.token)
    }
    
    return response
  } catch (error) {
    throw new Error(error.message || 'Đăng nhập thất bại')
  }
}

/**
 * Đăng xuất (xóa token)
 */
export const logout = () => {
  localStorage.removeItem('token')
}

/**
 * Yêu cầu đặt lại mật khẩu (gửi mã OTP qua email)
 * @returns {Promise<Object>} Kết quả
 */
export const requestPasswordReset = async () => {
  try {
    const response = await apiClient('/api/auth/request-password-reset', {
      method: 'POST',
    })
    return response
  } catch (error) {
    throw new Error(error.message || 'Không thể gửi mã xác nhận')
  }
}

/**
 * Đặt lại mật khẩu bằng mã OTP (khi đã đăng nhập)
 * @param {Object} data - Dữ liệu đặt lại mật khẩu
 * @param {string} data.code - Mã OTP 6 số
 * @param {string} data.newPassword - Mật khẩu mới
 * @returns {Promise<Object>} Kết quả
 */
export const resetPasswordWithCode = async (data) => {
  try {
    const response = await apiClient('/api/auth/reset-password-with-code', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response
  } catch (error) {
    throw new Error(error.message || 'Đặt lại mật khẩu thất bại')
  }
}

/**
 * Yêu cầu đặt lại mật khẩu khi quên (public, chưa đăng nhập)
 * @param {string} email - Email của tài khoản
 * @returns {Promise<Object>} Kết quả
 */
export const publicForgotPassword = async (email) => {
  try {
    const response = await apiClient('/api/auth/public-forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    return response
  } catch (error) {
    throw new Error(error.message || 'Không thể gửi mã xác nhận')
  }
}

/**
 * Đặt lại mật khẩu bằng mã OTP khi quên (public, chưa đăng nhập)
 * @param {Object} data - Dữ liệu đặt lại mật khẩu
 * @param {string} data.email - Email của tài khoản
 * @param {string} data.code - Mã OTP 6 số
 * @param {string} data.newPassword - Mật khẩu mới
 * @returns {Promise<Object>} Kết quả
 */
export const publicResetPassword = async (data) => {
  try {
    const response = await apiClient('/api/auth/public-reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response
  } catch (error) {
    throw new Error(error.message || 'Đặt lại mật khẩu thất bại')
  }
}

/**
 * Kiểm tra xem người dùng đã đăng nhập chưa
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

/**
 * Lấy token hiện tại
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('token')
}

/**
 * Đăng nhập bằng Google (redirect đến Google OAuth)
 */
export const loginWithGoogle = () => {
  // Lấy URL động từ config (đã được set từ biến môi trường khi build)
  // Hỗ trợ cả VITE_API_URL và VITE_API_BASE_URL
  const apiUrl = import.meta.env.VITE_API_URL 
    || import.meta.env.VITE_API_BASE_URL
    || API_BASE_URL // Fallback về config nếu không có trong env
  
  const googleAuthUrl = `${apiUrl}/api/auth/google`
  
  // Debug log (chỉ trong development)
  if (import.meta.env.DEV) {
    console.log('Redirecting to Google OAuth:', googleAuthUrl)
    console.log('API_BASE_URL from config:', API_BASE_URL)
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
    console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
  }
  
  window.location.href = googleAuthUrl
}

/**
 * Xử lý callback từ Google OAuth
 * @param {string} token - JWT token từ backend
 * @param {string} userData - User data dạng JSON string
 */
export const handleGoogleCallback = (token, userData) => {
  if (token) {
    localStorage.setItem('token', token)
  }
  
  if (userData) {
    try {
      const user = JSON.parse(decodeURIComponent(userData))
      return { token, user }
    } catch (error) {
      console.error('Error parsing user data:', error)
      return { token, user: null }
    }
  }
  
  return { token, user: null }
}

