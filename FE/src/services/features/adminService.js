import { apiClient } from '../api/apiClient.js'

/**
 * Lấy thống kê tổng quan (Admin only)
 * @returns {Promise<Object>} Thống kê
 */
export const getStatistics = async () => {
  try {
    const response = await apiClient('/api/admin/statistics', {
      method: 'GET',
    })
    return response
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Hệ thống phản hồi chậm, vui lòng thử lại.')
    }
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể lấy thống kê')
  }
}

export const getTimeseries = async (metric = 'diagnoses', period = 30) => {
  try {
    const response = await apiClient(`/api/admin/statistics/timeseries?metric=${encodeURIComponent(metric)}&period=${encodeURIComponent(period)}`, {
      method: 'GET'
    })
    return response
  } catch (error) {
    throw new Error(error.message || 'Không thể lấy chuỗi thời gian')
  }
}

export const getBreakdown = async (by = 'role') => {
  try {
    const response = await apiClient(`/api/admin/statistics/breakdown?by=${encodeURIComponent(by)}`, {
      method: 'GET'
    })
    return response
  } catch (error) {
    throw new Error(error.message || 'Không thể lấy breakdown')
  }
}

export const exportStatisticsCSV = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  // use window.fetch to get blob (apiClient parses JSON)
  const res = await fetch(`/api/admin/statistics/export?${query}`, { method: 'GET', credentials: 'include' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Export failed: ${res.status}`)
  }
  const blob = await res.blob()
  return blob
}

/**
 * Lấy danh sách người dùng (Admin only)
 * @param {string} search - Tìm kiếm theo email hoặc tên
 * @returns {Promise<Array>} Danh sách người dùng
 */
export const getUsers = async (search = '') => {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    const response = await apiClient(`/api/admin/users${query}`, {
      method: 'GET',
    })
    // Backend trả về { items: [...], total, page, pageSize }
    // Nếu là array (backward compatibility), trả về trực tiếp
    if (Array.isArray(response)) {
      return response
    }
    // Nếu là object có items, trả về items
    if (response && response.items && Array.isArray(response.items)) {
      return response.items
    }
    return []
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể lấy danh sách người dùng')
  }
}

/**
 * Tạo người dùng mới (Admin only)
 * @param {Object} userData - Dữ liệu người dùng
 * @param {string} userData.email - Email
 * @param {string} userData.password - Mật khẩu
 * @param {string} userData.fullName - Họ và tên
 * @param {string} userData.role - Vai trò ('user' hoặc 'admin')
 * @returns {Promise<Object>} Kết quả
 */
export const createUser = async (userData) => {
  try {
    const response = await apiClient('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể tạo người dùng')
  }
}

/**
 * Cập nhật trạng thái người dùng (Admin only)
 * @param {number} userId - ID người dùng
 * @param {string} status - Trạng thái mới ('active' hoặc 'suspended')
 * @returns {Promise<Object>} Kết quả
 */
export const updateUserStatus = async (userId, status) => {
  try {
    const response = await apiClient(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể cập nhật trạng thái người dùng')
  }
}

/**
 * Cập nhật quyền người dùng (Admin only)
 * @param {number} userId - ID người dùng
 * @param {string} role - Quyền mới ('user' hoặc 'admin')
 * @returns {Promise<Object>} Kết quả
 */
export const updateUserRole = async (userId, role) => {
  try {
    const response = await apiClient(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    })
    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể cập nhật quyền người dùng')
  }
}

/**
 * Xóa người dùng (Admin only)
 * @param {number} userId - ID người dùng
 * @returns {Promise<Object>} Kết quả
 */
export const deleteUser = async (userId) => {
  try {
    const response = await apiClient(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    })
    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể xóa người dùng')
  }
}

/**
 * Lấy lịch sử chẩn đoán của một người dùng (Admin only)
 * @param {number} userId - ID người dùng
 * @returns {Promise<Array>} Danh sách lịch sử chẩn đoán
 */
export const getHistoryForUser = async (userId) => {
  try {
    const response = await apiClient(`/api/admin/history/${userId}`, {
      method: 'GET',
    })
    return Array.isArray(response) ? response : []
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể lấy lịch sử chẩn đoán')
  }
}

/**
 * Lấy danh sách phản hồi (Admin only)
 */
export const getFeedbackList = async () => {
  try {
    const response = await apiClient('/api/admin/feedback', {
      method: 'GET',
    })
    return Array.isArray(response) ? response : []
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể tải danh sách phản hồi')
  }
}

/**
 * Cập nhật trạng thái phản hồi (Admin only)
 * @param {number} feedbackId
 * @param {'pending'|'processing'|'resolved'} status
 */
export const updateFeedbackStatus = async (feedbackId, status) => {
  try {
    const response = await apiClient(`/api/admin/feedback/${feedbackId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể cập nhật trạng thái phản hồi')
  }
}

/**
 * Xóa phản hồi (Admin only)
 * @param {number} feedbackId
 */
export const deleteFeedback = async (feedbackId) => {
  try {
    const response = await apiClient(`/api/admin/feedback/${feedbackId}`, {
      method: 'DELETE',
    })
    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể xóa phản hồi')
  }
}

// Giữ lại các hàm cũ để tương thích (nếu có code cũ đang dùng)
export const getDashboardSnapshot = getStatistics
export const getOrders = async () => {
  // Backend không có endpoint này, trả về mảng rỗng
  return []
}
export const getProducts = async () => {
  // Backend không có endpoint này, trả về mảng rỗng
  return []
}


