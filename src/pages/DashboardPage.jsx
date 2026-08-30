import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import PriceCard from '../components/PriceCard'
import { mandiPrices, priceAlerts } from '../data/mockPrices'
import { USER_PROFILE } from '../utils/constants'
import { getGreeting, formatCurrency, getChangeColor, getChangeIcon } from '../utils/formatters'

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const greeting = getGreeting()

  const topPrices = mandiPrices
    .sort((a, b) => b.change - a.change)
    .slice(0, 6)

  const quickActions = [
    { icon: '📦', label: 'new_lot', path: '/lots' },
    { icon: '🤝', label: 'find_buyer', path: '/buyers' },
    { icon: '💰', label: 'track_payment', path: '/payments' },
    { icon: '📝', label: 'file_complaint', path: '/disputes' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <p className="text-primary-100 text-sm">{t(greeting)}</p>
        <h2 className="text-2xl font-bold mt-1">{USER_PROFILE.avatar} {USER_PROFILE.name}</h2>
        <p className="text-primary-200 text-sm mt-1">📍 {USER_PROFILE.location}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="💰" label={t('todays_best_price')} value={formatCurrency(7350)} color="primary" />
        <StatCard icon="📦" label={t('active_lots')} value="3" color="blue" />
        <StatCard icon="⏳" label={t('pending_payments')} value={formatCurrency(215000)} color="yellow" />
        <StatCard icon="🤝" label={t('nearby_buyers')} value="8" color="primary" />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold mb-3">{t('quick_actions')}</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="card flex flex-col items-center justify-center py-4 hover:bg-primary-50 min-h-[80px]"
            >
              <span className="text-2xl mb-1">{action.icon}</span>
              <span className="text-xs font-semibold text-center">{t(action.label)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Prices Today */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">{t('top_prices_today')}</h3>
          <button onClick={() => navigate('/prices')} className="text-primary-600 text-sm font-semibold">
            {t('mandi_prices')} →
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
          {topPrices.map((price, i) => (
            <div key={i} className="snap-start flex-shrink-0">
              <PriceCard price={price} />
            </div>
          ))}
        </div>
      </div>

      {/* Price Alerts */}
      <div>
        <h3 className="text-lg font-bold mb-3">{t('price_alerts')}</h3>
        <div className="space-y-2">
          {priceAlerts.map((alert, i) => (
            <div key={i} className="card flex items-center gap-3 py-3">
              <span className="text-xl">
                {alert.type === 'up' ? '📈' : alert.type === 'down' ? '📉' : '➡️'}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{alert.message}</p>
                <p className="text-xs text-gray-500">{alert.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market News */}
      <div>
        <h3 className="text-lg font-bold mb-3">{t('market_news')}</h3>
        <div className="card bg-primary-50 border-primary-200">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span>📰</span>
              <p className="text-sm">Government announces 5% increase in MSP for Kharif 2026-27 season</p>
            </div>
            <div className="flex items-start gap-2">
              <span>📰</span>
              <p className="text-sm">APMC reforms: Direct selling to processors now allowed in 12 states</p>
            </div>
            <div className="flex items-start gap-2">
              <span>📰</span>
              <p className="text-sm">Cold storage capacity increased by 20% in Maharashtra</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
