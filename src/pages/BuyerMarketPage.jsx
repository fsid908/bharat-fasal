import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import BuyerCard from '../components/BuyerCard'
import { buyers, demandBoard } from '../data/mockBuyers'
import { commodities } from '../data/mockCommodities'
import { formatCurrency } from '../utils/formatters'
import { getStatusColor } from '../utils/formatters'

export default function BuyerMarketPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('buyers')
  const [typeFilter, setTypeFilter] = useState('all')

  const filteredBuyers = useMemo(() => {
    return buyers.filter(b => {
      const matchesSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.location.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || b.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [search, typeFilter])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">🤝 {t('buyer_marketplace')}</h2>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
        <button
          onClick={() => setTab('buyers')}
          className={`flex-1 py-3 font-semibold transition-colors ${tab === 'buyers' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
        >
          {t('verified_buyers')}
        </button>
        <button
          onClick={() => setTab('demand')}
          className={`flex-1 py-3 font-semibold transition-colors ${tab === 'demand' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
        >
          {t('demand_board')}
        </button>
      </div>

      {tab === 'buyers' && (
        <>
          <SearchBar value={search} onChange={setSearch} />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'processor', 'trader', 'institutional'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                  typeFilter === type ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {type === 'all' ? '📋 All' : type === 'processor' ? '🏭 ' + t('processor') : type === 'trader' ? '🤝 ' + t('trader') : '🏛️ ' + t('institutional')}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredBuyers.map(buyer => (
              <BuyerCard key={buyer.id} buyer={buyer} />
            ))}
          </div>
        </>
      )}

      {tab === 'demand' && (
        <div className="space-y-3">
          {demandBoard.map((demand, i) => {
            const buyer = buyers.find(b => b.id === demand.buyerId)
            const commodity = commodities.find(c => c.id === demand.commodityId)
            return (
              <div key={i} className={`card ${demand.status === 'urgent' ? 'border-red-300 bg-red-50/50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{commodity?.icon}</span>
                      <h3 className="font-bold">{t(demand.commodityId)}</h3>
                      <span className={`badge ${getStatusColor(demand.status)}`}>{demand.status}</span>
                    </div>
                    <p className="text-sm text-gray-600">{buyer?.name}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>📦 {demand.quantity}</span>
                      <span>⭐ {demand.grade}</span>
                      <span>📅 by {new Date(demand.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-700">{formatCurrency(demand.priceOffered)}</p>
                    <p className="text-xs text-gray-500">{t('per_quintal')}</p>
                    <button className="btn-primary text-sm py-1.5 px-3 mt-2">📦 {t('submit_lot')}</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
