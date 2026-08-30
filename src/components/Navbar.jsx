import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ onLogout }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-2xl">🌾</span>
          <h1 className="text-xl font-bold text-primary-700">{t('app_name')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-full hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <span className="text-xl">🔔</span>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <span className="text-xl">👨🌾</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
