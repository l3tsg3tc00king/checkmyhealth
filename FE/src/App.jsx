import { Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute.jsx'
// Auth pages
import LoginPage from './pages/auth/LoginPage/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage/RegisterPage.jsx'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/auth/ResetPasswordPage/ResetPasswordPage.jsx'

// Public pages
import HomePage from './pages/public/HomePage/HomePage.jsx'
import NewsPage from './pages/public/NewsPage/NewsPage.jsx'
import DiseasesPage from './pages/public/DiseasesPage/DiseasesPage.jsx'
import DiseaseDetailPage from './pages/public/DiseaseDetailPage/DiseaseDetailPage.jsx'

// User pages
import DiagnosisPage from './pages/user/DiagnosisPage/DiagnosisPage.jsx'
import HistoryPage from './pages/user/HistoryPage/HistoryPage.jsx'
import ProfilePage from './pages/user/ProfilePage/ProfilePage.jsx'
import ChatPage from './pages/user/ChatPage/ChatPage.jsx'
import SchedulePage from './pages/user/SchedulePage/SchedulePage.jsx'
import FeedbackPage from './pages/user/FeedbackPage/FeedbackPage.jsx'
import MapPage from './pages/user/MapPage/MapPage.jsx'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard/AdminDashboard.jsx'
import AdminUsers from './pages/admin/AdminUsers/AdminUsers.jsx'
import AdminDiseases from './pages/admin/AdminDiseases/AdminDiseases.jsx'
import AdminNews from './pages/admin/AdminNews/AdminNews.jsx'
import AdminReports from './pages/admin/AdminReports/AdminReports.jsx'
import AdminFeedback from './pages/admin/AdminFeedback/AdminFeedback.jsx'
import AdminUserHistoryPage from './pages/admin/AdminUserHistoryPage/AdminUserHistoryPage.jsx'

// Common pages
import NotFound from './pages/common/NotFound/NotFound.jsx'
import ComingSoon from './pages/common/ComingSoon/ComingSoon.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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
        <Route path="/diseases" element={<DiseasesPage />} />
        <Route path="/diseases/:id" element={<DiseaseDetailPage />} />
        <Route 
          path="/schedule" 
          element={
            <ProtectedRoute>
              <SchedulePage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/feedback" 
          element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/map" 
          element={
            <ProtectedRoute>
              <MapPage />
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
        <Route path="users/:userId/history" element={<AdminUserHistoryPage />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="diseases" element={<AdminDiseases />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
