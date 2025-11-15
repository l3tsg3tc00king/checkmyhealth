const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');

/**
 * @swagger
 * /api/news/sources:
 *   get:
 *     summary: Get all news sources
 *     tags: [News]
 *     responses:
 *       200:
 *         description: List of news sources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       source_id:
 *                         type: number
 *                       url:
 *                         type: string
 *                       label:
 *                         type: string
 *                       created_at:
 *                         type: string
 */
router.get('/sources', newsController.getAllSources);

/**
 * @swagger
 * /api/news/sources:
 *   post:
 *     summary: Create a new news source (Admin only)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               label:
 *                 type: string
 *     responses:
 *       201:
 *         description: News source created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/sources', authMiddleware, adminMiddleware, newsController.createSource);

/**
 * @swagger
 * /api/news/sources/{sourceId}:
 *   delete:
 *     summary: Delete a news source (Admin only)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: News source deleted successfully
 *       404:
 *         description: News source not found
 */
router.delete('/sources/:sourceId', authMiddleware, adminMiddleware, newsController.deleteSource);

/**
 * @swagger
 * /api/news/scrape:
 *   get:
 *     summary: Scrape articles from a news URL
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: URL of the news section (e.g., https://vnexpress.net/suc-khoe)
 *     responses:
 *       200:
 *         description: List of articles scraped from the URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 source:
 *                   type: string
 *                 articles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       link:
 *                         type: string
 *                       image:
 *                         type: string
 *                       source:
 *                         type: string
 *       400:
 *         description: Bad request (missing or invalid URL)
 *       500:
 *         description: Scrape error
 */
router.get('/scrape', newsController.scrapeNews);

module.exports = router;
