import { Outlet } from 'react-router-dom'
import SiteHeader from './components/SiteHeader/SiteHeader.jsx'
import SiteFooter from './components/SiteFooter/SiteFooter.jsx'
import ChatLauncher from '../components/features/chat/ChatLauncher/ChatLauncher.jsx'

const MainLayout = () => {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="app-main">
        <Outlet />
      </main>
      <SiteFooter />
      <ChatLauncher />
    </div>
  )
}

export default MainLayout


