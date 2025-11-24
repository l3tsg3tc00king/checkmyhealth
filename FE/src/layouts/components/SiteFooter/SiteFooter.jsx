import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../../config/api.js'

const SiteFooter = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking')

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        })
        if (response.ok) {
          setConnectionStatus('connected')
        } else {
          setConnectionStatus('disconnected')
        }
      } catch (error) {
        setConnectionStatus('disconnected')
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢 Backend đang hoạt động'
      case 'disconnected':
        return '🔴 Backend không kết nối'
      default:
        return '🟡 Đang kiểm tra...'
    }
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>&copy; {new Date().getFullYear()} SkinCare Platform</p>
        <p className="site-footer__api-hint">{getStatusText()}</p>
      </div>
    </footer>
  )
}

export default SiteFooter


