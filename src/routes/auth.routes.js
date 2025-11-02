const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');

// Định nghĩa API endpoint cho xác thực

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;