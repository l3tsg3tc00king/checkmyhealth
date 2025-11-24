import { apiClient } from '../api/apiClient.js';

const scheduleService = {
  /**
   * Tạo lịch trình mới
   */
  create: async (data) => {
    try {
      const response = await apiClient('/api/schedules', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },

  /**
   * Lấy lịch trình của một ngày cụ thể
   */
  getDailyTasks: async (date, dayOfWeek) => {
    try {
      const response = await apiClient(
        `/api/schedules/daily?date=${date}&dayOfWeek=${dayOfWeek}`,
        { method: 'GET' }
      );
      return response.data || response || [];
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
      throw error;
    }
  },

  /**
   * Toggle trạng thái task (completed/pending)
   */
  toggleTask: async (scheduleId, date, status) => {
    try {
      const response = await apiClient(`/api/schedules/${scheduleId}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ date, status })
      });
      return response;
    } catch (error) {
      console.error('Error toggling task:', error);
      throw error;
    }
  },

  /**
   * Xóa lịch trình
   */
  delete: async (id) => {
    try {
      const response = await apiClient(`/api/schedules/${id}`, { method: 'DELETE' });
      return response;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  },

  /**
   * Lấy thống kê
   */
  getStats: async () => {
    try {
      const response = await apiClient('/api/schedules/stats', { method: 'GET' });
      return response.data || response;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};

export default scheduleService;

