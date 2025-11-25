import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext.jsx'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog.jsx'
import NotificationBell from '../../../components/features/notification/NotificationBell/NotificationBell.jsx'
import './SiteHeader.css'

const SiteHeader = ({ variant = 'site' }) => {
  const tagline = variant === 'admin' ? 'Admin Console' : 'Front Office'
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false)
  const [utilitiesMenuOpen, setUtilitiesMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const accountMenuRef = useRef(null)
  const servicesMenuRef = useRef(null)
  const utilitiesMenuRef = useRef(null)

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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user/account menu
      const authRef = isAuthenticated ? userMenuRef : accountMenuRef
      if (authRef.current && !authRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
      
      // Close services menu
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target)) {
        setServicesMenuOpen(false)
      }
      
      // Close utilities menu
      if (utilitiesMenuRef.current && !utilitiesMenuRef.current.contains(event.target)) {
        setUtilitiesMenuOpen(false)
      }
    }

    if (userMenuOpen || servicesMenuOpen || utilitiesMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen, servicesMenuOpen, utilitiesMenuOpen, isAuthenticated])

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
          {/* Dịch vụ y tế dropdown - Public */}
          <div className="site-nav__dropdown-wrapper" ref={servicesMenuRef}>
            <button
              className={`site-nav__dropdown-trigger ${servicesMenuOpen ? 'active' : ''}`}
              onClick={() => setServicesMenuOpen(!servicesMenuOpen)}
              onMouseEnter={() => setServicesMenuOpen(true)}
            >
              Dịch vụ y tế
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ marginLeft: '4px', transition: 'transform 0.2s', transform: servicesMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>
            {servicesMenuOpen && (
              <div
                className="site-nav__dropdown-menu"
                onMouseLeave={() => setServicesMenuOpen(false)}
              >
                {isAuthenticated && (
                  <NavLink
                    to="/diagnosis"
                    className={buildLinkClass}
                    onClick={() => setServicesMenuOpen(false)}
                  >
                    Chuẩn đoán
                  </NavLink>
                )}
                <NavLink
                  to="/diseases"
                  className={buildLinkClass}
                  onClick={() => setServicesMenuOpen(false)}
                >
                  Bệnh lý
                </NavLink>
                {isAuthenticated && (
                  <NavLink
                    to="/history"
                    className={buildLinkClass}
                    onClick={() => setServicesMenuOpen(false)}
                  >
                    Lịch sử
                  </NavLink>
                )}
              </div>
            )}
          </div>
          {isAuthenticated && (
            <>

              {/* Tiện ích dropdown */}
              <div className="site-nav__dropdown-wrapper" ref={utilitiesMenuRef}>
                <button
                  className={`site-nav__dropdown-trigger ${utilitiesMenuOpen ? 'active' : ''}`}
                  onClick={() => setUtilitiesMenuOpen(!utilitiesMenuOpen)}
                  onMouseEnter={() => setUtilitiesMenuOpen(true)}
                >
                  Tiện ích
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginLeft: '4px', transition: 'transform 0.2s', transform: utilitiesMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>
                {utilitiesMenuOpen && (
                  <div
                    className="site-nav__dropdown-menu"
                    onMouseLeave={() => setUtilitiesMenuOpen(false)}
                  >
                    <NavLink
                      to="/schedule"
                      className={buildLinkClass}
                      onClick={() => setUtilitiesMenuOpen(false)}
                    >
                      Lịch trình
                    </NavLink>
                    <NavLink
                      to="/map"
                      className={buildLinkClass}
                      onClick={() => setUtilitiesMenuOpen(false)}
                    >
                      Bản đồ
                    </NavLink>
                    <NavLink
                      to="/feedback"
                      className={buildLinkClass}
                      onClick={() => setUtilitiesMenuOpen(false)}
                    >
                      Góp ý
                    </NavLink>
                  </div>
                )}
              </div>

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
            <div className="site-header__user-section" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NotificationBell />
              <div className="site-header__user-menu-wrapper" ref={userMenuRef}>
                <button
                  className="site-header__user-menu-trigger"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onMouseEnter={() => setUserMenuOpen(true)}
                >
                  <span className="site-header__user-name">
                    {user?.fullName || user?.email || 'User'}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginLeft: '4px', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div
                    className="site-header__user-dropdown"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <Link
                      to="/profile"
                      className="site-header__dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                        <path d="M8 8a3 3 0 100-6 3 3 0 000 6z" />
                        <path d="M13.5 14.5c0-3.038-2.462-5.5-5.5-5.5S2.5 11.462 2.5 14.5" />
                      </svg>
                      Hồ sơ
                    </Link>
                    <button
                      className="site-header__dropdown-item site-header__dropdown-item--danger"
                      onClick={() => {
                        setUserMenuOpen(false)
                        handleLogoutClick()
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                        <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 12l4-4-4-4M14 8H6" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="site-header__account-menu-wrapper" ref={accountMenuRef}>
              <button
                className="site-header__account-menu-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                onMouseEnter={() => setUserMenuOpen(true)}
              >
                Tài khoản
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ marginLeft: '4px', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {userMenuOpen && (
                <div
                  className="site-header__account-dropdown"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <Link
                    to="/login"
                    className="site-header__dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                      <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 2h3a1 1 0 011 1v10a1 1 0 01-1 1h-3M6 8h8" />
                    </svg>
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="site-header__dropdown-item site-header__dropdown-item--primary"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                      <path d="M8 2v12M2 8h12" />
                    </svg>
                    Đăng ký
                  </Link>
                </div>
              )}
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

