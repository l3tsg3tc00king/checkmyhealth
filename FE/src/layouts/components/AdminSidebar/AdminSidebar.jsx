import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  FiLayout, 
  FiFileText, 
  FiActivity, 
  FiUsers, 
  FiMessageSquare, 
  FiBarChart,
  FiMenu
} from 'react-icons/fi'

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', end: true, icon: FiLayout },
  { to: '/admin/news', label: 'Tin tức', icon: FiFileText },
  { to: '/admin/diseases', label: 'Bệnh lý', icon: FiActivity },
  { to: '/admin/users', label: 'Người dùng', icon: FiUsers },
  { to: '/admin/feedback', label: 'Phản hồi', icon: FiMessageSquare },
  { to: '/admin/reports', label: 'Báo cáo', icon: FiBarChart },
]

const STORAGE_KEY = 'admin-sidebar-collapsed'

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev)
  }

  const buildLinkClass = ({ isActive }) =>
    `admin-sidebar__link${isActive ? ' active' : ''}`

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'admin-sidebar--collapsed' : ''}`}>
      <div className="admin-sidebar__header">
        {!isCollapsed && <div className="admin-sidebar__title">Bảng điều khiển</div>}
        <button
          className="admin-sidebar__toggle"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          <FiMenu />
        </button>
      </div>
      <nav className="admin-sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={buildLinkClass}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="admin-sidebar__link-icon" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default AdminSidebar

