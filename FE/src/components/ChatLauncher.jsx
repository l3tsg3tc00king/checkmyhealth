import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

const ChatLauncher = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    navigate('/chat')
  }

  return (
    <button className="chat-launcher" onClick={handleClick} aria-label="Mở chat AI">
      <div className="chat-launcher__icon">
        <span>AI</span>
      </div>
      <div className="chat-launcher__text">
        <span>Hỗ trợ AI</span>
        <strong>Chat ngay</strong>
      </div>
    </button>
  )
}

export default ChatLauncher

