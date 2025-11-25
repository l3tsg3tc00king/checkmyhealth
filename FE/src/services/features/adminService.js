import { apiClient } from '../api/apiClient.js'
import { API_BASE_URL } from '../../config/api.js'

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

/**
 * Lấy thống kê tổng hợp cho Admin Dashboard với charts
 * @returns {Promise<Object>} Dashboard stats với overview, diseaseDistribution, trend, confidenceAnalysis
 */
export const getDashboardStats = async () => {
  try {
    const response = await apiClient('/api/admin/dashboard/stats', {
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
    throw new Error(error.message || 'Không thể lấy thống kê dashboard')
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
  const token = localStorage.getItem('token')
  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/statistics/export?${query}`, { 
    method: 'GET', 
    headers,
    credentials: 'include' 
  })
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
 * Cập nhật role của người dùng (Admin only)
 * @param {number} userId - ID người dùng
 * @param {string} role - Role mới ('user' hoặc 'admin')
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
 * Lấy lịch sử chuẩn đoán của một người dùng (Admin only)
 * @param {number} userId - ID người dùng
 * @returns {Promise<Array>} Danh sách lịch sử chuẩn đoán
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
    throw new Error(error.message || 'Không thể lấy lịch sử chuẩn đoán')
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

/**
 * Báo cáo Chi tiết Chẩn đoán
 * @param {Object} filters - { startDate, endDate, diseaseName, minConfidence, maxConfidence, page, pageSize }
 */
export const getDiagnosisReport = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.startDate) queryParams.append('startDate', filters.startDate)
    if (filters.endDate) queryParams.append('endDate', filters.endDate)
    if (filters.diseaseName) queryParams.append('diseaseName', filters.diseaseName)
    if (filters.minConfidence !== undefined) queryParams.append('minConfidence', filters.minConfidence)
    if (filters.maxConfidence !== undefined) queryParams.append('maxConfidence', filters.maxConfidence)
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.pageSize) queryParams.append('pageSize', filters.pageSize)

    const response = await apiClient(`/api/admin/reports/diagnosis?${queryParams.toString()}`, {
      method: 'GET',
    })
    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể lấy báo cáo chẩn đoán')
  }
}

/**
 * Export Báo cáo Chi tiết Chẩn đoán
 * @param {Object} filters - { startDate, endDate, diseaseName, minConfidence, maxConfidence }
 * @param {string} format - 'xlsx' hoặc 'csv'
 */
export const exportDiagnosisReport = async (filters = {}, format = 'xlsx') => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.startDate) queryParams.append('startDate', filters.startDate)
    if (filters.endDate) queryParams.append('endDate', filters.endDate)
    if (filters.diseaseName) queryParams.append('diseaseName', filters.diseaseName)
    if (filters.minConfidence !== undefined) queryParams.append('minConfidence', filters.minConfidence)
    if (filters.maxConfidence !== undefined) queryParams.append('maxConfidence', filters.maxConfidence)
    queryParams.append('format', format)

    const token = localStorage.getItem('token')
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const res = await fetch(`${API_BASE_URL}/api/admin/reports/diagnosis/export?${queryParams.toString()}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Export failed: ${res.status}`)
    }
    const blob = await res.blob()
    return blob
  } catch (error) {
    throw new Error(error.message || 'Không thể export báo cáo')
  }
}

/**
 * Báo cáo Tăng trưởng Người dùng
 * @param {string} period - 'day', 'week', hoặc 'month' (mặc định 'month')
 */
export const getUserGrowthReport = async (period = 'month') => {
  try {
    const response = await apiClient(`/api/admin/reports/user-growth?period=${period}`, {
      method: 'GET',
    })
    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể lấy báo cáo tăng trưởng')
  }
}

/**
 * Báo cáo AI Performance - Ca khó
 * @param {number} threshold - Ngưỡng confidence (mặc định 0.6)
 * @param {number} limit - Số lượng tối đa
 */
export const getAIDifficultCases = async (threshold = 0.6, limit = 100) => {
  try {
    const response = await apiClient(`/api/admin/reports/ai-difficult-cases?threshold=${threshold}&limit=${limit}`, {
      method: 'GET',
    })
    return response
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error
    }
    throw new Error(error.message || 'Không thể lấy ca khó')
  }
}

/**
 * Export AI Difficult Cases
 * @param {number} threshold - Ngưỡng confidence
 * @param {string} format - 'xlsx' hoặc 'csv'
 */
export const exportAIDifficultCases = async (threshold = 0.6, format = 'xlsx') => {
  try {
    const token = localStorage.getItem('token')
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const res = await fetch(`${API_BASE_URL}/api/admin/reports/ai-difficult-cases/export?threshold=${threshold}&format=${format}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Export failed: ${res.status}`)
    }
    const blob = await res.blob()
    return blob
  } catch (error) {
    throw new Error(error.message || 'Không thể export ca khó')
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


