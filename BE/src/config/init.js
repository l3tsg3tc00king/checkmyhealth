const { pool } = require('./db');

/**
 * Tạo bảng news_sources nếu chưa tồn tại
 * Được gọi tự động khi backend start
 */
const initializeDatabase = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Tạo bảng news_sources
    await connection.query(`
      CREATE TABLE IF NOT EXISTS news_sources (
        source_id INT AUTO_INCREMENT PRIMARY KEY,
        url VARCHAR(512) NOT NULL UNIQUE,
        label VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ news_sources table checked/created');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = { initializeDatabase };
