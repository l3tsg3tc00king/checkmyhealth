import { apiClient } from '../api/apiClient.js';

const buildFormData = (data = {}) => {
  if (data instanceof FormData) return data

  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }
    formData.append(key, value)
  })
  return formData
}

const diseaseService = {
  /**
   * Lấy danh sách bệnh lý (có thể tìm kiếm)
   */
  getAll: async (search = '') => {
    try {
      const url = search 
        ? `/api/diseases?search=${encodeURIComponent(search)}`
        : '/api/diseases';
      const response = await apiClient(url, { method: 'GET' });
      return response.data || response || [];
    } catch (error) {
      console.error('Error fetching diseases:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết một bệnh lý
   */
  getById: async (id) => {
    try {
      const response = await apiClient(`/api/diseases/${id}`, { method: 'GET' });
      return response.data || response;
    } catch (error) {
      console.error('Error fetching disease detail:', error);
      throw error;
    }
  },

  /**
   * Tạo bệnh lý mới (Admin only)
   */
  create: async (data) => {
    try {
      const payload = buildFormData(data)
      const response = await apiClient('/api/diseases', {
        method: 'POST',
        body: payload
      });
      return response;
    } catch (error) {
      console.error('Error creating disease:', error);
      throw error;
    }
  },

  /**
   * Cập nhật bệnh lý (Admin only)
   */
  update: async (id, data) => {
    try {
      const payload = buildFormData(data)
      const response = await apiClient(`/api/diseases/${id}`, {
        method: 'PUT',
        body: payload
      });
      return response;
    } catch (error) {
      console.error('Error updating disease:', error);
      throw error;
    }
  },

  /**
   * Xóa bệnh lý (Admin only)
   */
  delete: async (id) => {
    try {
      const response = await apiClient(`/api/diseases/${id}`, { method: 'DELETE' });
      return response;
    } catch (error) {
      console.error('Error deleting disease:', error);
      throw error;
    }
  }
};

export default diseaseService;

