import { API_BASE_URL, API_TIMEOUT } from '../../config/api.js'

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
      // Nếu là lỗi 401, có thể token đã hết hạn hoặc route yêu cầu auth
      if (response.status === 401) {
        // Chỉ remove token nếu có token (có thể route public nhưng có token hết hạn)
        if (token) {
          localStorage.removeItem('token')
        }
        // Nếu không có token và route yêu cầu auth, throw error
        if (!token) {
          throw new Error('Không tìm thấy token. Yêu cầu truy cập bị từ chối.')
        }
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


