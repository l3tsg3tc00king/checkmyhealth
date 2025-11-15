const { pool } = require('../config/db');

const newsModel = {
  /**
   * Lấy tất cả các nguồn tin
   */
  getAllSources: async () => {
    try {
      const [rows] = await pool.query(
        'SELECT source_id, url, label, created_at FROM news_sources ORDER BY created_at DESC'
      );
      return rows;
    } catch (error) {
      console.error('Error getting all news sources:', error);
      throw error;
    }
  },

  /**
   * Tạo một nguồn tin mới
   */
  createSource: async (url, label = '') => {
    try {
      const [result] = await pool.query(
        'INSERT INTO news_sources (url, label) VALUES (?, ?)',
        [url, label || null]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating news source:', error);
      throw error;
    }
  },

  /**
   * Lấy nguồn tin theo ID
   */
  getSourceById: async (sourceId) => {
    try {
      const [rows] = await pool.query(
        'SELECT source_id, url, label, created_at FROM news_sources WHERE source_id = ?',
        [sourceId]
      );
      return rows[0];
    } catch (error) {
      console.error('Error getting news source by id:', error);
      throw error;
    }
  },

  /**
   * Cập nhật nguồn tin
   */
  updateSource: async (sourceId, url, label) => {
    try {
      await pool.query(
        'UPDATE news_sources SET url = ?, label = ? WHERE source_id = ?',
        [url, label || null, sourceId]
      );
      return true;
    } catch (error) {
      console.error('Error updating news source:', error);
      throw error;
    }
  },

  /**
   * Xóa nguồn tin
   */
  deleteSource: async (sourceId) => {
    try {
      await pool.query(
        'DELETE FROM news_sources WHERE source_id = ?',
        [sourceId]
      );
      return true;
    } catch (error) {
      console.error('Error deleting news source:', error);
      throw error;
    }
  }
};

module.exports = newsModel;
