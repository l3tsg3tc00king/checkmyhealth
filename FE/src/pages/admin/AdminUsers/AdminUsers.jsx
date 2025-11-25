import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, createUser, updateUserRole } from '../../../services/features/adminService.js'
import { formatDateAndTime } from '../../../utils/format.js'
import SortableTableHeader from '../../../components/ui/SortableTableHeader/SortableTableHeader.jsx'
import Pagination from '../../../components/ui/Pagination/Pagination.jsx'
import AddUserModal from '../../../components/features/admin/AddUserModal/AddUserModal.jsx'
import { usePageTitle } from '../../../hooks/usePageTitle.js'
import { useAuth } from '../../../contexts/AuthContext.jsx'
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog.jsx'
import { decodeToken } from '../../../utils/jwt.js'
import { getToken } from '../../../services/auth/authService.js'
import './AdminUsers.css'

const AdminUsers = () => {
  usePageTitle('Quản lý người dùng')
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  // Lấy current user ID từ token
  const currentUserId = useMemo(() => {
    const token = getToken()
    if (!token) return null
    const decoded = decodeToken(token)
    return decoded?.userId || decoded?.user_id || null
  }, [])
  const [state, setState] = useState({ loading: true, data: [], error: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ column: 'user_id', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [customItemsPerPage, setCustomItemsPerPage] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [roleChanging, setRoleChanging] = useState(false)

  // Fetch data
  useEffect(() => {
    let isMounted = true
    setState(prev => ({ ...prev, loading: true }))
    
    getUsers(searchTerm)
      .then((data) => {
        if (isMounted) {
          setState({ loading: false, data, error: null })
          setCurrentPage(1) // Reset to first page when search changes
        }
      })
      .catch((error) => {
        if (isMounted) setState({ loading: false, data: [], error: error.message })
      })
    return () => {
      isMounted = false
    }
  }, [searchTerm])

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...state.data]
    
    sorted.sort((a, b) => {
      let aValue = a[sortConfig.column]
      let bValue = b[sortConfig.column]

      // Handle different data types
      if (sortConfig.column === 'user_id') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else if (sortConfig.column === 'created_at') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      } else {
        aValue = String(aValue || '').toLowerCase()
        bValue = String(bValue || '').toLowerCase()
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [state.data, sortConfig])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  const handleSort = (column, direction) => {
    setSortConfig({ column, direction })
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handleAddUser = async (userData) => {
    setAddUserLoading(true)
    try {
      await createUser(userData)
      // Refresh data
      const data = await getUsers(searchTerm)
      setState({ loading: false, data, error: null })
      setShowAddModal(false)
      setCurrentPage(1)
    } catch (error) {
      alert(error.message || 'Không thể tạo người dùng')
    } finally {
      setAddUserLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleViewHistory = (userId, userName) => {
    navigate(`/admin/users/${userId}/history`)
  }

  const handleRoleChange = async (userId, newRole, userName) => {
    // Confirm trước khi thay đổi
    if (!window.confirm(`Bạn có chắc muốn thay đổi quyền của ${userName} thành ${newRole === 'admin' ? 'Admin' : 'User'}?`)) {
      return
    }

    try {
      setRoleChanging(true)
      await updateUserRole(userId, newRole)
      // Refresh data
      const data = await getUsers(searchTerm)
      setState({ loading: false, data, error: null })
      alert(`Đã ${newRole === 'admin' ? 'thăng cấp' : 'giáng cấp'} quyền thành công`)
    } catch (error) {
      alert(error.message || 'Không thể thay đổi quyền')
      // Reload để reset combobox về giá trị cũ
      const data = await getUsers(searchTerm)
      setState({ loading: false, data, error: null })
    } finally {
      setRoleChanging(false)
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Người dùng</h1>
          <p>Danh sách khách hàng và nhân viên đang hoạt động.</p>
        </div>
        <button 
          className="btn btn-primary" 
          type="button"
          onClick={() => setShowAddModal(true)}
        >
          Thêm người dùng
        </button>
      </header>

      {/* Search */}
      <div className="admin-users__search">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchTerm}
          onChange={handleSearch}
          className="admin-users__search-input"
        />
      </div>

      {state.loading && <p>Đang tải danh sách người dùng...</p>}
      {state.error && <p className="error-text">Không thể tải: {state.error}</p>}

      {!state.loading && !state.error && (
        <>
          <div className="data-table__wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <SortableTableHeader
                    column="user_id"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    ID
                  </SortableTableHeader>
                  <SortableTableHeader
                    column="email"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Email
                  </SortableTableHeader>
                  <SortableTableHeader
                    column="full_name"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Họ tên
                  </SortableTableHeader>
                  <SortableTableHeader
                    column="role"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Vai trò
                  </SortableTableHeader>
                  <SortableTableHeader
                    column="account_status"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Trạng thái
                  </SortableTableHeader>
                  <SortableTableHeader
                    column="created_at"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Ngày tạo
                  </SortableTableHeader>
                  <th style={{ width: '100px', textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="data-table__empty">
                      {searchTerm ? 'Không tìm thấy người dùng nào.' : 'Chưa có người dùng nào.'}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((user) => (
                    <tr key={user.user_id ?? user.email}>
                      <td>{user.user_id ?? '--'}</td>
                      <td>{user.email ?? '--'}</td>
                      <td>{user.full_name ?? '--'}</td>
                      <td>
                        {currentUserId && currentUserId === user.user_id ? (
                          <span className={`badge badge--${user.role === 'admin' ? 'primary' : 'default'}`}>
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </span>
                        ) : (
                          <select
                            value={user.role || 'user'}
                            onChange={(e) => handleRoleChange(user.user_id, e.target.value, user.full_name || user.email)}
                            disabled={roleChanging}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #e5e7eb',
                              fontSize: '0.9rem',
                              cursor: roleChanging ? 'not-allowed' : 'pointer',
                              background: 'white'
                            }}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge--${user.account_status ?? 'active'}`}>
                          {user.account_status ?? 'active'}
                        </span>
                      </td>
                      <td>{formatDateAndTime(user.created_at)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn-action"
                          onClick={() => handleViewHistory(user.user_id, user.full_name || user.email)}
                          title="Xem lịch sử chuẩn đoán"
                        >
                          📋 Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {sortedData.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={sortedData.length}
              onItemsPerPageChange={setItemsPerPage}
              customItemsPerPage={customItemsPerPage}
              onCustomItemsPerPageChange={setCustomItemsPerPage}
            />
          )}
        </>
      )}

      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddUser}
        loading={addUserLoading}
      />

    </section>
  )
}

export default AdminUsers
