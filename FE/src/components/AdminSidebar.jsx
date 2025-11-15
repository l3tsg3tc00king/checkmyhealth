import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/news', label: 'Tin tức' },
  { to: '/admin/users', label: 'Người dùng' },
  { to: '/admin/reports', label: 'Báo cáo' },
]

const AdminSidebar = () => {
  const buildLinkClass = ({ isActive }) =>
    `admin-sidebar__link${isActive ? ' active' : ''}`

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__title">Bảng điều khiển</div>
      <nav className="admin-sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={buildLinkClass}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default AdminSidebar

