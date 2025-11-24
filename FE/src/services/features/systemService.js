import { apiClient } from '../api/apiClient.js'

export const getApiHealth = async () => {
  try {
    const result = await apiClient('/health')
    return result?.status ?? 'online'
  } catch (error) {
    if (error.name === 'AbortError') {
      return 'timeout'
    }
    throw error
  }
}


