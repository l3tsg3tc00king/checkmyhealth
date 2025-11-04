const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Nhập routes (MỚI)
const authRoutes = require('./routes/auth.routes'); 
const diagnosisRoutes = require('./routes/diagnosis.routes');
const profileRoutes = require('./routes/profile.routes');

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- Routes ---
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Skin Disease Diagnosis API!' });
});

// Gắn auth routes vào app (MỚI)
// Tất cả các route trong 'authRoutes' sẽ có tiền tố là '/api/auth'
// Ví dụ: /api/auth/register, /api/auth/login
app.use('/api/auth', authRoutes);
app.use('/api/diagnose', diagnosisRoutes);
app.use('/api/profile', profileRoutes);


// --- Xuất app ra ---
module.exports = app;