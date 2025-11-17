import { API_BASE_URL, API_TIMEOUT } from '../config/api.js'

const buildUrl = (path) => {
  if (path.startsWith('http')) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

// Lấy token từ localStorage
const getToken = () => {
  try {
    return localStorage.getItem('token')
  } catch (error) {
    return null
  }
}

export const apiClient = async (path, options = {}) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)

  // Lấy token nếu có
  const token = getToken()

  const isFormData = options.body instanceof FormData

  // Xây dựng headers
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers ?? {}),
  }

  // Thêm Authorization header nếu có token và chưa có trong options.headers
  if (token && !options.headers?.Authorization && !options.headers?.authorization) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(buildUrl(path), {
      headers,
      signal: controller.signal,
      ...options,
    })

    if (!response.ok) {
      // Nếu là lỗi 401, có thể token đã hết hạn
      if (response.status === 401) {
        localStorage.removeItem('token')
        // Có thể redirect đến trang login ở đây nếu cần
      }

      let errorMessage
      try {
        const cloned = response.clone()
        const errorData = await cloned.json()
        errorMessage = errorData.message || errorData.error || `Request failed with status ${response.status}`
      } catch {
        try {
          errorMessage = await response.text()
        } catch {
          errorMessage = ''
        }
        if (!errorMessage) {
          errorMessage = `Request failed with status ${response.status}`
        }
      }

      throw new Error(errorMessage)
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}


