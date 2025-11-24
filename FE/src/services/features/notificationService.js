import { apiClient } from '../api/apiClient.js';

const notificationService = {
  /**
   * Lấy danh sách thông báo của user
   */
  getAll: async () => {
    try {
      const response = await apiClient('/api/notifications', {
        method: 'GET'
      });
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  /**
   * Đánh dấu thông báo đã đọc
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await apiClient(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
};

export default notificationService;

