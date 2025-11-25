import { apiClient } from '../api/apiClient.js';
import { API_BASE_URL } from '../../config/api.js';

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
      // Public API - không cần token
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || data || [];
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
      // Public API - không cần token
      const response = await fetch(`${API_BASE_URL}/api/diseases/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || data;
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
  },

  /**
   * Export tất cả bệnh lý (Admin only)
   * @param {string} format - 'xlsx' hoặc 'csv'
   */
  exportAll: async (format = 'xlsx') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn cần đăng nhập để sử dụng tính năng này');
      }

      const response = await fetch(`${API_BASE_URL}/api/diseases/export/all?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Lỗi export' }));
        throw new Error(errorData.message || 'Lỗi export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diseases_export_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting diseases:', error);
      throw error;
    }
  },

  /**
   * Export sample template (Admin only)
   * @param {string} format - 'xlsx' hoặc 'csv'
   */
  exportSample: async (format = 'xlsx') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn cần đăng nhập để sử dụng tính năng này');
      }

      const response = await fetch(`${API_BASE_URL}/api/diseases/export/sample?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Lỗi export template' }));
        throw new Error(errorData.message || 'Lỗi export template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diseases_template.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting sample:', error);
      throw error;
    }
  },

  /**
   * Import bệnh lý từ file (Admin only)
   * @param {File} file - File Excel hoặc CSV
   */
  import: async (file) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn cần đăng nhập để sử dụng tính năng này');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/diseases/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Lỗi import' }));
        throw new Error(errorData.message || errorData.errors?.join(', ') || 'Lỗi import');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error importing diseases:', error);
      throw error;
    }
  }
};

export default diseaseService;

