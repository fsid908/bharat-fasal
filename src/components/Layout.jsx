import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

export default function Layout({ children, onLogout }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLogout={onLogout} />
      <main className="pb-20 md:pb-4 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
