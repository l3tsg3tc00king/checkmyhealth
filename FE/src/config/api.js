// File: FE/src/config/api.js

// Lấy biến từ Vercel (khi deploy)
const API_BASE_URL = import.meta.env.VITE_API_URL 
    
    // Nếu không có, dùng localhost (khi chạy ở máy bạn)
    || 'http://localhost:8000'; // (Dùng port 8000 hoặc 3000 tùy vào .env của BE)

const API_TIMEOUT = 10000; 

export { API_BASE_URL, API_TIMEOUT };