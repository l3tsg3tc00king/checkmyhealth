import { apiClient } from '../api/apiClient.js'

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
 * Đặt lại mật khẩu bằng mã OTP
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

