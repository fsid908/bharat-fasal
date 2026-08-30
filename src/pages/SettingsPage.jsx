import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'
import { USER_PROFILE } from '../utils/constants'

export default function SettingsPage({ onLogout }) {
  const { t, i18n } = useTranslation()
  const [showLang, setShowLang] = useState(false)
  const [notifications, setNotifications] = useState({ prices: true, buyers: true, payments: true })

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold">⚙️ {t('settings')}</h2>

      {/* Profile */}
      <div className="card">
        <h3 className="font-bold mb-3">👤 {t('profile')}</h3>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{USER_PROFILE.avatar}</span>
          <div>
            <h4 className="text-xl font-bold">{USER_PROFILE.name}</h4>
            <p className="text-gray-500">{USER_PROFILE.phone}</p>
            <p className="text-gray-500">📍 {USER_PROFILE.location}</p>
            <p className="text-gray-500">🌾 {USER_PROFILE.farmSize} {t('acres')} · {USER_PROFILE.fpo}</p>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowLang(!showLang)}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div>
              <h3 className="font-bold">{t('language')}</h3>
              <p className="text-sm text-gray-500">{t('change_language')}</p>
            </div>
          </div>
          <span className="text-xl">{showLang ? '▼' : '▶'}</span>
        </div>
        {showLang && (
          <div className="mt-4 pt-4 border-t">
            <LanguageSelector />
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="card">
        <h3 className="font-bold mb-3">🔔 {t('notifications')}</h3>
        <div className="space-y-3">
          {[
            { key: 'prices', label: 'price_alert_notifications', icon: '📊' },
            { key: 'buyers', label: 'buyer_messages', icon: '💬' },
            { key: 'payments', label: 'payment_updates', icon: '💰' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer py-2">
              <div className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span className="font-semibold">{t(item.label)}</span>
              </div>
              <div
                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`w-12 h-7 rounded-full transition-colors duration-200 relative cursor-pointer ${
                  notifications[item.key] ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                  notifications[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                }`}></div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Help */}
      <div className="card">
        <h3 className="font-bold mb-3">❓ {t('help')}</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>📞 Helpline: +91 9999999990</p>
          <p>📧 support@bharatfasal.in</p>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="flex items-center gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-bold">{t('about')}</h3>
            <p className="text-sm text-gray-500">{t('app_name')} {t('version')} 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full py-3 rounded-xl border-2 border-red-300 text-red-600 font-semibold hover:bg-red-50 transition-colors"
      >
        🚪 {t('logout')}
      </button>
    </div>
  )
}
