import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

const SiteHeader = ({ variant = 'site' }) => {
  const tagline = variant === 'admin' ? 'Admin Console' : 'Front Office'
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)

  const buildLinkClass = ({ isActive }) =>
    `site-nav__link${isActive ? ' active' : ''}`

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false)
    logout()
    // Luôn reset về trang home khi logout
    navigate('/', { replace: true })
  }

  const handleToggleMenu = () => {
    setIsNavOpen((prev) => !prev)
  }

  return (
    <header className={`site-header ${variant === 'admin' ? 'site-header--admin' : ''} ${isNavOpen ? 'site-header--mobile-open' : ''}`}>
      <div className="site-header__inner">
        <Link to="/" className="site-header__brand">
          <span className="site-header__logo">CheckMyHealth</span>
          <span className="site-header__tagline">{tagline}</span>
        </Link>

        <button
          type="button"
          className="site-header__menu-toggle"
          onClick={handleToggleMenu}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className="site-nav">
          <NavLink to="/" className={buildLinkClass}>
            Trang chủ
          </NavLink>
          <NavLink to="/news" className={buildLinkClass}>
            Tin tức
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/diagnosis" className={buildLinkClass}>
                Chẩn đoán
              </NavLink>
              <NavLink to="/history" className={buildLinkClass}>
                Lịch sử
              </NavLink>
              <NavLink to="/profile" className={buildLinkClass}>
                Hồ sơ
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={buildLinkClass}>
                  Quản trị
                </NavLink>
              )}
            </>
          )}
        </nav>
        <div className="site-header__auth">
          {isAuthenticated ? (
            <div className="site-header__user-menu">
              <span className="site-header__user-name">
                {user?.fullName || user?.email || 'User'}
              </span>
              <button 
                onClick={handleLogoutClick}
                className="site-header__logout-btn"
                title="Đăng xuất"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="site-header__auth-links">
              <Link to="/login" className="site-header__auth-link">
                Đăng nhập
              </Link>
              <Link to="/register" className="site-header__auth-link site-header__auth-link--primary">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        type="danger"
      />
    </header>
  )
}

export default SiteHeader

