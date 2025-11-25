import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext.jsx'
import scheduleService from '../../../services/features/scheduleService.js'
import { usePageTitle } from '../../../hooks/usePageTitle.js'
import '../HistoryPage/History.css'

const SchedulePage = () => {
  usePageTitle('Lịch trình')
  const { isAuthenticated } = useAuth()
  const [tasks, setTasks] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null) // ID của lịch trình đang edit
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    title: '',
    type: 'medication',
    reminder_time: '08:00',
    repeat_days: [],
    schedule_type: 'repeat', // 'repeat' hoặc 'once'
    specific_date: ''
  })

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks()
    }
  }, [isAuthenticated, selectedDate])

  const getDayOfWeek = (dateStr) => {
    const date = new Date(dateStr)
    const day = date.getDay() // 0 = Sunday, 1 = Monday, ...
    return day === 0 ? 8 : day + 1 // Convert to DB format: 8 = Sunday, 2 = Monday, ...
  }

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError('')
      const dayOfWeek = getDayOfWeek(selectedDate)
      const data = await scheduleService.getDailyTasks(selectedDate, dayOfWeek)
      setTasks(data || [])
    } catch (err) {
      console.error('Error loading tasks:', err)
      setError('Lỗi khi tải lịch trình')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTask = async (scheduleId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
      await scheduleService.toggleTask(scheduleId, selectedDate, newStatus)
      await loadTasks()
    } catch (err) {
      console.error('Error toggling task:', err)
      setError('Lỗi khi cập nhật trạng thái')
    }
  }

  const handleAddSchedule = async () => {
    if (!formData.title || !formData.reminder_time) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }

    // Validation: Nếu là lặp lại thì phải chọn ít nhất 1 ngày, nếu là 1 lần thì phải chọn ngày
    if (formData.schedule_type === 'repeat' && formData.repeat_days.length === 0) {
      setError('Vui lòng chọn ít nhất một ngày lặp lại')
      return
    }

    if (formData.schedule_type === 'once' && !formData.specific_date) {
      setError('Vui lòng chọn ngày cho lịch trình một lần')
      return
    }

    try {
      setError('')
      const payload = {
        title: formData.title,
        type: formData.type,
        reminder_time: formData.reminder_time,
        repeat_days: formData.schedule_type === 'repeat' ? formData.repeat_days.join(',') : null,
        specific_date: formData.schedule_type === 'once' ? formData.specific_date : null
      }
      
      // Lưu lại specific_date trước khi reset form để dùng cho việc reload
      const savedSpecificDate = formData.specific_date
      const savedScheduleType = formData.schedule_type
      
      if (editingId) {
        // Update existing schedule
        await scheduleService.update(editingId, payload)
        
        // Fix: Nếu là lịch trình 1 lần, LUÔN chuyển selectedDate sang ngày mới để hiển thị đúng
        if (savedScheduleType === 'once' && savedSpecificDate) {
          // Cập nhật selectedDate
          setSelectedDate(savedSpecificDate)
          // Đợi state update rồi load tasks với ngày mới
          // Dùng setTimeout để đảm bảo state đã update
          setTimeout(async () => {
            const dayOfWeek = getDayOfWeek(savedSpecificDate)
            const data = await scheduleService.getDailyTasks(savedSpecificDate, dayOfWeek)
            setTasks(data || [])
          }, 50)
        } else {
          // Nếu không phải lịch trình 1 lần hoặc không có ngày, reload ngay với ngày hiện tại
          await loadTasks()
        }
      } else {
        // Create new schedule
        await scheduleService.create(payload)
        
        // Nếu là lịch trình 1 lần mới, chuyển sang ngày đó để xem
        if (savedScheduleType === 'once' && savedSpecificDate) {
          // Cập nhật selectedDate
          setSelectedDate(savedSpecificDate)
          // Đợi state update rồi load tasks với ngày mới
          setTimeout(async () => {
            const dayOfWeek = getDayOfWeek(savedSpecificDate)
            const data = await scheduleService.getDailyTasks(savedSpecificDate, dayOfWeek)
            setTasks(data || [])
          }, 50)
        } else {
          // Nếu không phải lịch trình 1 lần, reload ngay với ngày hiện tại
          await loadTasks()
        }
      }
      
      setShowAddForm(false)
      setEditingId(null)
      setFormData({
        title: '',
        type: 'medication',
        reminder_time: '08:00',
        repeat_days: [],
        schedule_type: 'repeat',
        specific_date: ''
      })
    } catch (err) {
      console.error('Error saving schedule:', err)
      setError(err.response?.data?.message || (editingId ? 'Lỗi khi cập nhật lịch trình' : 'Lỗi khi tạo lịch trình'))
    }
  }

  const handleEditSchedule = (task) => {
    // Parse repeat_days từ string về array (nếu có)
    const repeatDays = task.repeat_days ? task.repeat_days.split(',').map(d => d.trim()).filter(Boolean) : []
    const scheduleType = repeatDays.length > 0 ? 'repeat' : 'once'
    
    // Fix: Format specific_date từ Date object hoặc string về YYYY-MM-DD
    // MySQL DATE type có thể trả về Date object hoặc string, cần xử lý cẩn thận
    let formattedDate = ''
    if (task.specific_date) {
      // Convert về string trước để xử lý đồng nhất
      let dateStr = ''
      if (task.specific_date instanceof Date) {
        // Nếu là Date object, convert sang ISO string
        dateStr = task.specific_date.toISOString()
      } else {
        dateStr = String(task.specific_date)
      }
      
      // Lấy phần YYYY-MM-DD đầu tiên (bỏ qua time và timezone)
      // Xử lý các format: "2023-11-25", "2023-11-25T00:00:00.000Z", "2023-11-25 00:00:00"
      const dateMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/)
      if (dateMatch && dateMatch[1]) {
        formattedDate = dateMatch[1]
      } else if (dateStr.length >= 10) {
        // Fallback: lấy 10 ký tự đầu nếu không match được
        formattedDate = dateStr.substring(0, 10)
      }
    }
    
    setFormData({
      title: task.title || '',
      type: task.type || 'medication',
      reminder_time: task.reminder_time || '08:00',
      repeat_days: repeatDays,
      schedule_type: scheduleType,
      specific_date: formattedDate
    })
    setEditingId(task.schedule_id)
    setShowAddForm(true)
    setError('')
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setShowAddForm(false)
    setEditingId(null)
    setFormData({
      title: '',
      type: 'medication',
      reminder_time: '08:00',
      repeat_days: [],
      schedule_type: 'repeat',
      specific_date: ''
    })
    setError('')
  }

  const handleScheduleTypeChange = (newType) => {
    if (newType === 'once') {
      // Khi chọn "Một lần", mặc định set ngày hôm nay
      const today = getTodayDate()
      setFormData({ ...formData, schedule_type: newType, repeat_days: [], specific_date: formData.specific_date || today })
    } else {
      // Khi chọn "Lặp lại", xóa specific_date
      setFormData({ ...formData, schedule_type: newType, specific_date: '' })
    }
  }

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa lịch trình này?')) {
      return
    }

    try {
      setError('')
      await scheduleService.delete(id)
      await loadTasks()
    } catch (err) {
      console.error('Error deleting schedule:', err)
      setError('Lỗi khi xóa lịch trình')
    }
  }

  const toggleRepeatDay = (day) => {
    setFormData({
      ...formData,
      repeat_days: formData.repeat_days.includes(day)
        ? formData.repeat_days.filter(d => d !== day)
        : [...formData.repeat_days, day]
    })
  }

  const dayLabels = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
    8: 'Chủ nhật'
  }

  if (!isAuthenticated) {
    return (
      <div className="history-container">
        <div className="history-card">
          <h2>Yêu cầu đăng nhập</h2>
          <p>Bạn cần đăng nhập để quản lý lịch trình.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="history-container">
      <div className="history-card">
        <div className="history-header">
          <div>
            <h1 className="history-title">Lịch trình</h1>
            <p className="history-subtitle">Quản lý lịch trình nhắc nhở của bạn</p>
          </div>
          <button
            className="history-new-btn"
            onClick={() => {
              if (showAddForm) {
                handleCancelEdit()
              } else {
                setShowAddForm(true)
                setEditingId(null)
              }
            }}
          >
            {showAddForm ? 'Hủy' : 'Thêm lịch trình'}
          </button>
        </div>

        {error && (
          <div style={{ background: '#fed7d7', color: '#c53030', padding: 12, borderRadius: 6, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {showAddForm && (
          <div style={{ background: '#f9fafb', padding: 20, borderRadius: 8, marginBottom: 20, border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Chỉnh sửa lịch trình' : 'Thêm lịch trình mới'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Uống thuốc, Tập thể dục..."
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Loại</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4 }}
                >
                  <option value="medication">Uống thuốc</option>
                  <option value="exercise">Tập thể dục</option>
                  <option value="appointment">Cuộc hẹn</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Giờ nhắc nhở *</label>
                <input
                  type="time"
                  value={formData.reminder_time}
                  onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Loại lịch trình *</label>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="schedule_type"
                      value="repeat"
                      checked={formData.schedule_type === 'repeat'}
                      onChange={(e) => handleScheduleTypeChange(e.target.value)}
                    />
                    <span>Lặp lại hàng tuần</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="schedule_type"
                      value="once"
                      checked={formData.schedule_type === 'once'}
                      onChange={(e) => handleScheduleTypeChange(e.target.value)}
                    />
                    <span>Một lần</span>
                  </label>
                </div>

                {formData.schedule_type === 'repeat' ? (
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Lặp lại vào các ngày *</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {Object.entries(dayLabels).map(([day, label]) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleRepeatDay(day)}
                          style={{
                            padding: '8px 16px',
                            border: `2px solid ${formData.repeat_days.includes(day) ? '#667eea' : '#e5e7eb'}`,
                            borderRadius: 4,
                            background: formData.repeat_days.includes(day) ? '#667eea' : 'white',
                            color: formData.repeat_days.includes(day) ? 'white' : '#1a202c',
                            cursor: 'pointer',
                            fontWeight: formData.repeat_days.includes(day) ? 600 : 400
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Chọn ngày *</label>
                    <input
                      type="date"
                      value={formData.specific_date}
                      onChange={(e) => setFormData({ ...formData, specific_date: e.target.value })}
                      min={getTodayDate()}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4 }}
                    />
                    <p style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>
                      Lịch trình này chỉ xuất hiện một lần vào ngày đã chọn
                    </p>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleAddSchedule}
                  disabled={loading}
                >
                  {editingId ? 'Cập nhật' : 'Thêm lịch trình'}
                </button>
                <button
                  className="btn"
                  onClick={handleCancelEdit}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Chọn ngày xem lịch trình:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 4 }}
          />
        </div>

        {loading ? (
          <div className="history-loading">
            <div className="history-spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="history-empty">
            <p>Không có lịch trình nào cho ngày này.</p>
            <p>Hãy thêm lịch trình mới để bắt đầu!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tasks.map((task) => (
              <div
                key={task.schedule_id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}
              >
                <input
                  type="checkbox"
                  checked={task.log_status === 'completed'}
                  onChange={() => handleToggleTask(task.schedule_id, task.log_status)}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600 }}>
                    {task.title}
                  </h3>
                  <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#6b7280' }}>
                    <span>Loại: {task.type === 'medication' ? 'Uống thuốc' : task.type === 'exercise' ? 'Tập thể dục' : task.type === 'appointment' ? 'Cuộc hẹn' : 'Khác'}</span>
                    <span>Giờ: {task.reminder_time}</span>
                    {task.log_status === 'completed' && task.completed_at && (
                      <span>Hoàn thành: {new Date(task.completed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleEditSchedule(task)}
                    style={{
                      padding: '6px 12px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(task.schedule_id)}
                    style={{
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SchedulePage

