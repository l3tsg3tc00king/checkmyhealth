import { useEffect, useState } from 'react'
import { getDashboardSnapshot } from '../../../services/features/adminService.js'
import { usePageTitle } from '../../../hooks/usePageTitle.js'

const AdminDashboard = () => {
  usePageTitle('Bảng điều khiển Admin')
  const [snapshot, setSnapshot] = useState({ loading: true, data: null, error: null })

  useEffect(() => {
    let isMounted = true
    getDashboardSnapshot()
      .then((data) => {
        if (isMounted) setSnapshot({ loading: false, data, error: null })
      })
      .catch((error) => {
        if (isMounted) setSnapshot({ loading: false, data: null, error: error.message })
      })

    return () => {
      isMounted = false
    }
  }, [])

  const renderContent = () => {
    if (snapshot.loading) {
      return <p>Đang tải dữ liệu tổng quan...</p>
    }

    if (snapshot.error) {
      return <p className="error-text">Không thể tải dữ liệu: {snapshot.error}</p>
    }

    if (!snapshot.data) {
      return <p>Không có dữ liệu hiển thị.</p>
    }

    return (
      <div className="admin-cards">
        <div className="admin-card">
          <h3>Khách hàng</h3>
          <p>{snapshot.data.customers}</p>
        </div>
        <div className="admin-card">
          <h3>Đơn hàng</h3>
          <p>{snapshot.data.orders}</p>
        </div>
        <div className="admin-card">
          <h3>Dịch vụ</h3>
          <p>{snapshot.data.services}</p>
        </div>
        <div className="admin-card">
          <h3>Bác sĩ / Chuyên gia</h3>
          <p>{snapshot.data.specialists}</p>
        </div>
      </div>
    )
  }

  return (
    <section className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1>Tổng quan hệ thống</h1>
        <p>Nhanh chóng nắm bắt tình hình kinh doanh với dữ liệu từ backend @skin_be.</p>
      </header>
      {renderContent()}
    </section>
  )
}

export default AdminDashboard


