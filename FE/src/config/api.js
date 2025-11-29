// File: FE/src/config/api.js

// Lấy biến từ Vercel (khi deploy)
// Hỗ trợ cả VITE_API_URL và VITE_API_BASE_URL để tương thích
const API_BASE_URL = import.meta.env.VITE_API_URL 
    || import.meta.env.VITE_API_BASE_URL
    // Nếu không có, dùng localhost (khi chạy ở máy bạn)
    || 'http://localhost:8000'; // (Dùng port 8000 hoặc 3000 tùy vào .env của BE)

// Debug: Log API URL để kiểm tra (chỉ trong development)
if (import.meta.env.DEV) {
  console.log('API_BASE_URL:', API_BASE_URL)
}

const API_TIMEOUT = 10000; 

export { API_BASE_URL, API_TIMEOUT };