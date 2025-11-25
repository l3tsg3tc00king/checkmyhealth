const axios = require('axios');
const cheerio = require('cheerio');
const newsModel = require('../models/news.model');

// Cache danh sách host cho phép scrape để tránh query DB liên tục
const HOST_CACHE_TTL = 5 * 60 * 1000; // 5 phút
let cachedHosts = null;
let cachedHostsLoadedAt = 0;

const parseHost = (rawUrl) => {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return null;
  }
};

const getAllowedHosts = async () => {
  const now = Date.now();
  if (cachedHosts && now - cachedHostsLoadedAt < HOST_CACHE_TTL) {
    return cachedHosts;
  }

  const sources = await newsModel.getAllSources();
  const hostsFromDb = sources
    .map(source => parseHost(source.url))
    .filter(Boolean);

  if (hostsFromDb.length > 0) {
    cachedHosts = hostsFromDb;
  } else {
    // Fallback sang biến môi trường (hoặc giá trị mặc định) nếu chưa có nguồn tin nào
    cachedHosts = (process.env.NEWS_SCRAPE_ALLOWLIST || 'vnexpress.net,thanhnien.vn,tuoitre.vn')
      .split(',')
      .map(h => h.trim())
      .filter(Boolean);
  }

  cachedHostsLoadedAt = now;
  return cachedHosts;
};

const newsController = {
  /**
   * Lấy tất cả các nguồn tin từ database
   * GET /api/news/sources
   */
  getAllSources: async (req, res) => {
    try {
      const sources = await newsModel.getAllSources();
      res.status(200).json({
        success: true,
        data: sources
      });
    } catch (error) {
      console.error('Error fetching news sources:', error);
      res.status(500).json({
        message: 'Lỗi khi lấy danh sách nguồn tin',
        error: error.message
      });
    }
  },

  /**
   * Tạo một nguồn tin mới (Admin only)
   * POST /api/news/sources
   */
  createSource: async (req, res) => {
    try {
      const { url, label } = req.body;

      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid URL format' });
      }

      const sourceId = await newsModel.createSource(url, label);

      res.status(201).json({
        success: true,
        message: 'Thêm nguồn tin thành công',
        data: { source_id: sourceId, url, label }
      });
    } catch (error) {
      console.error('Error creating news source:', error);
      res.status(500).json({
        message: 'Lỗi khi thêm nguồn tin',
        error: error.message
      });
    }
  },

  /**
   * Xóa một nguồn tin (Admin only)
   * DELETE /api/news/sources/:sourceId
   */
  deleteSource: async (req, res) => {
    try {
      const { sourceId } = req.params;

      const source = await newsModel.getSourceById(sourceId);
      if (!source) {
        return res.status(404).json({ message: 'Nguồn tin không tồn tại' });
      }

      await newsModel.deleteSource(sourceId);

      res.status(200).json({
        success: true,
        message: 'Xóa nguồn tin thành công'
      });
    } catch (error) {
      console.error('Error deleting news source:', error);
      res.status(500).json({
        message: 'Lỗi khi xóa nguồn tin',
        error: error.message
      });
    }
  },

  /**
   * Scrape articles from a news URL
   * GET /api/news/scrape?url=https://vnexpress.net/suc-khoe
   */
  scrapeNews: async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid URL format' });
      }

      const allowedHosts = await getAllowedHosts();
      const hostAllowed = allowedHosts.some(allowed =>
        parsedUrl.hostname === allowed || parsedUrl.hostname.endsWith(`.${allowed}`)
      );

      if (!hostAllowed) {
        return res.status(400).json({ message: 'Host không được phép scrape.' });
      }

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000 // Tăng timeout một chút
      });

      const $ = cheerio.load(response.data);
      const articles = [];

      const selectors = [
        'article',
        '.article-item',
        '.news-item',
        '.post-item',
        '[data-article]',
        '.entry-item',
        '.item-news',
        '.list-news-subfolder .item-news-item' // Thêm selector đặc thù của VnExpress
      ];

      // === THAY ĐỔI 1: Lặp qua TẤT CẢ selector, không break ===
      for (const selector of selectors) {
        // === THAY ĐỔI 2: Tăng giới hạn quét mỗi selector từ 10 lên 50 ===
        $(selector).slice(0, 50).each((i, elem) => {
          try {
            const $elem = $(elem);

            // Logic lấy Title, Link, Image giữ nguyên
            let title = $elem.find('h2, h3, .title, .headline, .title-news').text().trim() ||
                       $elem.find('a').first().attr('title') || 
                       $elem.find('a').first().text().trim();

            let link = $elem.find('a').first().attr('href') ||
                      $elem.attr('href');

            if (link && link.startsWith('/')) {
              link = parsedUrl.origin + link;
            }

            let image = $elem.find('img').first().attr('src') ||
                       $elem.find('img').first().attr('data-src') ||
                       $elem.find('video').first().attr('poster'); // Hỗ trợ poster video

            if (image && image.startsWith('/')) {
              image = parsedUrl.origin + image;
            }

            // Lọc ảnh icon nhỏ hoặc ảnh rỗng (VnExpress hay dính ảnh gif 1x1)
            if (image && (image.includes('data:image') || image.length < 50)) {
                image = null; 
            }

            let description = $elem.find('.description, .summary, .excerpt, .lead, p').first().text().trim();
            if (!description) {
              description = $elem.find('p').first().text().trim();
            }
            description = description ? description.substring(0, 150) + '...' : '';

            // Chỉ lấy tin có đủ Tiêu đề, Link và Ảnh (để lên app cho đẹp)
            if (title && link && title.length > 10) {
              articles.push({
                id: `${articles.length}-${Date.now()}`, // ID unique tạm thời
                title: title,
                description: description,
                link: link,
                image: image || 'https://via.placeholder.com/300x200.png?text=No+Image', // Ảnh mặc định nếu thiếu
                source: parsedUrl.hostname,
                timestamp: Date.now()
              });
            }
          } catch (e) {
            // Bỏ qua item lỗi
          }
        });
        
        // === QUAN TRỌNG: ĐÃ XÓA LỆNH BREAK ĐỂ NÓ QUÉT HẾT CÁC SELECTOR ===
      }

      // Lọc trùng lặp (do quét nhiều selector có thể trùng bài)
      const uniqueArticles = [];
      const seenLinks = new Set();
      for (const article of articles) {
        // Bỏ qua các link quảng cáo hoặc video ngắn
        if (!seenLinks.has(article.link) && !article.link.includes('/video/')) {
          uniqueArticles.push(article);
          seenLinks.add(article.link);
        }
      }

      res.status(200).json({
        success: true,
        source: url,
        // === THAY ĐỔI 3: Trả về tối đa 30 bài thay vì 10 ===
        articles: uniqueArticles.slice(0, 30) 
      });
    } catch (error) {
      console.error('Scrape error:', error.message);
      res.status(500).json({
        message: 'Lỗi scrape trang',
        error: error.message
      });
    }
  }
};

module.exports = newsController;
