import { Outlet } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import ChatLauncher from '../components/ChatLauncher.jsx'

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


