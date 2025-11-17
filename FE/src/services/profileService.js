import { apiClient } from './apiClient.js'

/**
 * Lấy thông tin hồ sơ người dùng
 * @returns {Promise<Object>} Thông tin hồ sơ
 */
export const getProfile = async () => {
  try {
    const response = await apiClient('/api/profile', {
      method: 'GET',
    })
    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('hết hạn')) {
      throw error
    }
    throw new Error(error.message || 'Không thể lấy thông tin hồ sơ')
  }
}

/**
 * Cập nhật thông tin hồ sơ người dùng
 * @param {Object} profileData - Dữ liệu cập nhật
 * @param {string} profileData.fullName - Họ và tên mới
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('hết hạn')) {
      throw error
    }
    throw new Error(error.message || 'Không thể cập nhật hồ sơ')
  }
}

/**
 * Cập nhật avatar người dùng (upload ảnh)
 * @param {File} file - ảnh đại diện mới
 * @returns {Promise<Object>} Kết quả cập nhật (chứa avatar_url)
 */
export const updateAvatar = async (file) => {
  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await apiClient('/api/profile/avatar', {
      method: 'PUT',
      body: formData,
      // Để apiClient tự bỏ qua Content-Type JSON khi body là FormData
    })

    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('hết hạn')) {
      throw error
    }
    throw new Error(error.message || 'Không thể cập nhật ảnh đại diện')
  }
}

