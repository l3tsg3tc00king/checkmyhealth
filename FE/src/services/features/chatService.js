import { apiClient } from '../api/apiClient.js'
import { API_BASE_URL } from '../../config/api.js'
import { getToken } from '../auth/authService.js'

export const fetchChatHistory = async () => {
  try {
    const response = await apiClient('/api/chat/history', {
      method: 'GET',
    })
    return Array.isArray(response) ? response : []
  } catch (error) {
    throw new Error(error.message || 'Không thể tải lịch sử chat')
  }
}

export const sendChatMessage = async (message, onChunk) => {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || 'Không thể gửi tin nhắn')
  }

  const reader = response.body?.getReader()
  if (!reader) {
    return ''
  }

  const decoder = new TextDecoder('utf-8')
  let result = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    result += chunk
    onChunk?.(chunk)
  }

  return result
}

