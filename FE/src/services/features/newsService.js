import { apiClient } from '../api/apiClient.js';

const newsService = {
  /**
   * Lấy tất cả các nguồn tin từ server
   */
  getAllSources: async () => {
    try {
      const response = await apiClient('/api/news/sources', { method: 'GET' });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching news sources:', error);
      throw error;
    }
  },

  /**
   * Thêm một nguồn tin mới (Admin only)
   */
  createSource: async (url, label = '') => {
    try {
      const response = await apiClient('/api/news/sources', {
        method: 'POST',
        body: JSON.stringify({ url, label })
      });
      return response;
    } catch (error) {
      console.error('Error creating news source:', error);
      throw error;
    }
  },

  /**
   * Xóa một nguồn tin (Admin only)
   */
  deleteSource: async (sourceId) => {
    try {
      const response = await apiClient(`/api/news/sources/${sourceId}`, { method: 'DELETE' });
      return response;
    } catch (error) {
      console.error('Error deleting news source:', error);
      throw error;
    }
  },

  /**
   * Scrape articles từ một URL
   */
  scrapeNews: async (url) => {
    try {
      const response = await apiClient(`/api/news/scrape?url=${encodeURIComponent(url)}`, { method: 'GET' });
      return response.articles || [];
    } catch (error) {
      console.error('Error scraping news:', error);
      throw error;
    }
  }
};

export default newsService;
