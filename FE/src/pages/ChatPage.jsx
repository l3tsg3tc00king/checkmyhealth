import { useEffect, useRef, useState } from 'react'
import { fetchChatHistory, sendChatMessage } from '../services/chatService.js'
import './ChatPage.css'

const ChatPage = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await fetchChatHistory()
        setMessages(history)
      } catch (err) {
        setError(err.message || 'Không thể tải lịch sử chat')
      }
    }
    loadHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (event) => {
    event?.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input.trim() }
    const placeholderId = Date.now()

    setMessages((prev) => [...prev, userMessage, { role: 'model', content: '', __id: placeholderId }])
    setInput('')
    setError('')
    setLoading(true)

    try {
      let accumulated = ''
      await sendChatMessage(userMessage.content, (chunk) => {
        accumulated += chunk
        setMessages((prev) =>
          prev.map((msg) =>
            msg.__id === placeholderId ? { ...msg, content: accumulated } : msg
          )
        )
      })

      setMessages((prev) =>
        prev.map((msg) => (msg.__id === placeholderId ? { ...msg, __id: undefined } : msg))
      )
    } catch (err) {
      setError(err.message || 'Chat thất bại, vui lòng thử lại')
      setMessages((prev) => prev.filter((msg) => msg.__id !== placeholderId))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="chat-page">
      <div className="chat-card">
        <header className="chat-card__header">
          <div>
            <h1>CheckMyHealth Assistant</h1>
            <p>Chatbot tư vấn da liễu sử dụng Gemini</p>
          </div>
        </header>

        <div className="chat-card__body">
          {messages.length === 0 && !error && (
            <p className="chat-empty">Hãy gửi câu hỏi đầu tiên của bạn!</p>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-message chat-message--${msg.role === 'user' ? 'user' : 'bot'}`}
            >
              <div className="chat-message__bubble">{msg.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {error && <div className="chat-error">{error}</div>}

        <form className="chat-input-bar" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Nhập câu hỏi về da liễu..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? 'Đang trả lời...' : 'Gửi'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default ChatPage

