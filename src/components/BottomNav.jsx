import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', icon: '🏠', label: 'nav_home' },
  { path: '/prices', icon: '📊', label: 'nav_prices' },
  { path: '/lots', icon: '📦', label: 'nav_lots' },
  { path: '/buyers', icon: '🤝', label: 'nav_buyers' },
  { path: '/settings', icon: '⚙️', label: 'nav_settings' },
]

export default function BottomNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-0.5">{t(item.label)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
