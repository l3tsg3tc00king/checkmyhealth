import { apiClient } from '../api/apiClient.js';

const feedbackService = {
  /**
   * Gửi phản hồi
   */
  create: async (feedbackType, content) => {
    try {
      const response = await apiClient('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ feedback_type: feedbackType, content })
      });
      return response;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách phản hồi của user (nếu có API)
   */
  getMyFeedback: async () => {
    try {
      const response = await apiClient('/api/feedback/my', {
        method: 'GET'
      });
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error getting my feedback:', error);
      throw error;
    }
  }
};

export default feedbackService;

