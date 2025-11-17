import { Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import DiagnosisPage from './pages/DiagnosisPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminNews from './pages/AdminNews.jsx'
import NewsPage from './pages/NewsPage.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import ComingSoon from './pages/ComingSoon.jsx'
import AdminReports from './pages/AdminReports.jsx'
import NotFound from './pages/NotFound.jsx'
import ChatPage from './pages/ChatPage.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route 
          path="/diagnosis" 
          element={
            <ProtectedRoute>
              <DiagnosisPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/news" element={<NewsPage />} />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="news" element={<AdminNews />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
