import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import PriceCard from '../components/PriceCard'
import { mandiPrices } from '../data/mockPrices'
import { myLots } from '../data/mockLots'
import { payments } from '../data/mockLogistics'
import { formatCurrency, getStatusColor, formatDate } from '../utils/formatters'

export default function FPODashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const topPrices = mandiPrices.sort((a, b) => b.change - a.change).slice(0, 4)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)

  const fpoMembers = [
    { name: 'Farhan Nur', village: 'Gopalganj', lots: 3, contributed: '120 quintals', icon: '👨‍🌾' },
    { name: 'Farhan Siddiqui', village: 'Maharjganj', lots: 2, contributed: '80 quintals', icon: '👩‍🌾' },
    { name: 'Abuzer', village: 'Azamgarh', lots: 4, contributed: '200 quintals', icon: '👨‍🌾' },
  ]

  return (
    <div className="space-y-6">
      {/* FPO Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm">{t('fpo')}</p>
        <h2 className="text-2xl font-bold mt-1">🏢 Kisan Shakti FPO</h2>
        <p className="text-blue-200 text-sm mt-1">📍 Indore, Madhya Pradesh · 156 Members</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="👥" label="Total Members" value="156" color="blue" />
        <StatCard icon="📦" label="Aggregated Lots" value="42" color="primary" />
        <StatCard icon="💰" label="Pending Payments" value={formatCurrency(totalPending)} color="yellow" />
        <StatCard icon="📊" label="Avg Price Realization" value="+12%" color="primary" />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold mb-3">{t('quick_actions')}</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '📦', label: 'Aggregate Lots', path: '/lots' },
            { icon: '🤝', label: t('find_buyer'), path: '/buyers' },
            { icon: '💰', label: 'Distribute Pay', path: '/payments' },
            { icon: '👥', label: 'Members', path: '/settings' },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="card flex flex-col items-center justify-center py-4 hover:bg-blue-50 min-h-[80px]"
            >
              <span className="text-2xl mb-1">{action.icon}</span>
              <span className="text-xs font-semibold text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Member List */}
      <div>
        <h3 className="text-lg font-bold mb-3">👥 FPO Members</h3>
        <div className="space-y-2">
          {fpoMembers.map((member, i) => (
            <div key={i} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{member.icon}</span>
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-xs text-gray-500">🏠 {member.village} · {member.lots} lots</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary-700">{member.contributed}</p>
                <p className="text-xs text-gray-500">contributed</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aggregated Lots Summary */}
      <div>
        <h3 className="text-lg font-bold mb-3">📦 Aggregated Lots</h3>
        <div className="space-y-2">
          {[
            { commodity: '🌾 Wheat', total: '500 quintals', members: 12, status: 'listed', bestOffer: 2480 },
            { commodity: '🷭 Soybean', total: '200 quintals', members: 8, status: 'offered', bestOffer: 5150 },
            { commodity: '🧅 Onion', total: '300 quintals', members: 15, status: 'sold', bestOffer: 1950 },
          ].map((lot, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold">{lot.commodity}</h4>
                  <p className="text-sm text-gray-500">{lot.total} · {lot.members} members</p>
                </div>
                <div className="text-right">
                  <span className={`badge ${getStatusColor(lot.status)}`}>{lot.status}</span>
                  <p className="text-sm font-bold mt-1">{formatCurrency(lot.bestOffer)}/q</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Prices */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">{t('top_prices_today')}</h3>
          <button onClick={() => navigate('/prices')} className="text-primary-600 text-sm font-semibold">{t('mandi_prices')} →</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {topPrices.map((price, i) => (
            <div key={i} className="flex-shrink-0"><PriceCard price={price} /></div>
          ))}
        </div>
      </div>
    </div>
  )
}
