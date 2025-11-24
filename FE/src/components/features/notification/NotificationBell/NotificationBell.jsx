import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../../contexts/AuthContext.jsx'
import notificationService from '../../../../services/features/notificationService.js'
import './NotificationBell.css'

const NotificationBell = () => {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications()
      // Refresh notifications mỗi 30 giây
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await notificationService.getAll()
      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="notification-bell__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <span className="notification-bell__unread-count">{unreadCount} mới</span>
            )}
          </div>
          <div className="notification-bell__list">
            {loading ? (
              <div className="notification-bell__empty">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-bell__empty">Không có thông báo nào</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`notification-bell__item ${!notification.is_read ? 'notification-bell__item--unread' : ''}`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.notification_id)}
                >
                  <div className="notification-bell__item-content">
                    <h4 className="notification-bell__item-title">{notification.title}</h4>
                    <p className="notification-bell__item-message">{notification.message}</p>
                    <span className="notification-bell__item-time">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  {!notification.is_read && (
                    <div className="notification-bell__item-dot" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell

