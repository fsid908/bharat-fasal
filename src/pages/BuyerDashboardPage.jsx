import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { mandiPrices } from '../data/mockPrices'
import { demandBoard } from '../data/mockBuyers'
import { commodities } from '../data/mockCommodities'
import { myLots } from '../data/mockLots'
import { payments } from '../data/mockLogistics'
import { formatCurrency, getStatusColor, formatDate } from '../utils/formatters'

export default function BuyerDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Buyer Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-700 rounded-2xl p-6 text-white">
        <p className="text-amber-100 text-sm">Buyer Dashboard</p>
        <h2 className="text-2xl font-bold mt-1">🏭 Adani Agri Fresh Ltd.</h2>
        <p className="text-amber-200 text-sm mt-1">📍 Ahmedabad, Gujarat · ✅ Verified Buyer</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="📦" label="Active Demands" value="6" color="blue" />
        <StatCard icon="🌾" label="Lots Matched" value="24" color="primary" />
        <StatCard icon="💰" label="Total Purchased" value={formatCurrency(1250000)} color="yellow" />
        <StatCard icon="⭐" label="Rating" value="4.5/5" color="primary" />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold mb-3">{t('quick_actions')}</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '📝', label: 'Post Demand', path: '/buyers' },
            { icon: '🔍', label: 'Browse Lots', path: '/lots' },
            { icon: '📊', label: t('mandi_prices'), path: '/prices' },
            { icon: '💰', label: t('payments'), path: '/payments' },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="card flex flex-col items-center justify-center py-4 hover:bg-amber-50 min-h-[80px]"
            >
              <span className="text-2xl mb-1">{action.icon}</span>
              <span className="text-xs font-semibold text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* My Active Demands */}
      <div>
        <h3 className="text-lg font-bold mb-3">📋 My Active Demands</h3>
        <div className="space-y-2">
          {demandBoard.slice(0, 4).map((demand, i) => {
            const commodity = commodities.find(c => c.id === demand.commodityId)
            return (
              <div key={i} className={`card ${demand.status === 'urgent' ? 'border-red-300 bg-red-50/30' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{commodity?.icon}</span>
                      <h4 className="font-bold">{t(demand.commodityId)}</h4>
                      <span className={`badge ${getStatusColor(demand.status)}`}>{demand.status}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-sm text-gray-500">
                      <span>📦 {demand.quantity}</span>
                      <span>⭐ {demand.grade}</span>
                      <span>📅 by {new Date(demand.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-700">{formatCurrency(demand.priceOffered)}</p>
                    <p className="text-xs text-gray-500">/quintal</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Available Lots to Purchase */}
      <div>
        <h3 className="text-lg font-bold mb-3">📦 Available Lots</h3>
        <div className="space-y-2">
          {myLots.filter(l => l.status === 'listed').map(lot => {
            const commodity = commodities.find(c => c.id === lot.commodityId)
            return (
              <div key={lot.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{commodity?.icon}</span>
                    <div>
                      <h4 className="font-bold">{t(lot.commodityId)}</h4>
                      <p className="text-sm text-gray-500">{lot.quantity} {t('quintals')} · {lot.grade}</p>
                      <p className="text-xs text-gray-400">{lot.id} · Listed {formatDate(lot.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(lot.expectedPrice)}/q</p>
                    <button className="btn-primary text-sm py-1.5 px-3 mt-1">Make Offer</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Market Prices */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">📊 Market Watch</h3>
          <button onClick={() => navigate('/prices')} className="text-primary-600 text-sm font-semibold">View All →</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {mandiPrices.slice(0, 4).map((price, i) => {
            const commodity = commodities.find(c => c.id === price.commodityId)
            return (
              <div key={i} className="card">
                <div className="flex items-center gap-2 mb-1">
                  <span>{commodity?.icon}</span>
                  <span className="font-semibold text-sm">{t(price.commodityId)}</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(price.price)}</p>
                <p className="text-xs text-gray-500">{price.mandi}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="card">
        <h3 className="font-bold mb-3">💰 Payment Summary</h3>
        <div className="space-y-2">
          {payments.slice(0, 3).map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold">{t(p.commodityId)} - {p.quantity}q</p>
                <p className="text-xs text-gray-400">{formatDate(p.date)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatCurrency(p.amount)}</p>
                <span className={`badge ${getStatusColor(p.status)}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
