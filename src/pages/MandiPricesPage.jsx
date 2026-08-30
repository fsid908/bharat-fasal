import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import PriceCard from '../components/PriceCard'
import { mandiPrices } from '../data/mockPrices'
import { commodities, categories } from '../data/mockCommodities'
import { formatCurrency } from '../utils/formatters'

export default function MandiPricesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredPrices = useMemo(() => {
    return mandiPrices.filter(p => {
      const commodity = commodities.find(c => c.id === p.commodityId)
      const matchesSearch = !search || t(p.commodityId).toLowerCase().includes(search.toLowerCase()) || p.mandi.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === 'all' || commodity?.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [search, activeCategory, t])

  const uniqueCommodities = [...new Set(filteredPrices.map(p => p.commodityId))]

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">📊 {t('mandi_prices')}</h2>

      <SearchBar value={search} onChange={setSearch} placeholder={t('search_commodity')} />

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{t(cat.id === 'all' ? 'all_commodities' : cat.id)}</span>
          </button>
        ))}
      </div>

      {/* Commodity Groups */}
      {uniqueCommodities.map(commodityId => {
        const commodity = commodities.find(c => c.id === commodityId)
        const prices = filteredPrices.filter(p => p.commodityId === commodityId)
        return (
          <div key={commodityId}>
            <div
              className="flex items-center justify-between mb-2 cursor-pointer"
              onClick={() => navigate(`/prices/${commodityId}`)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{commodity?.icon}</span>
                <h3 className="font-bold">{t(commodityId)}</h3>
                {commodity?.msp && (
                  <span className="badge badge-yellow text-xs">MSP: {formatCurrency(commodity.msp)}</span>
                )}
              </div>
              <span className="text-primary-600 text-sm font-semibold">→</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {prices.map((price, i) => (
                <PriceCard key={i} price={price} />
              ))}
            </div>
          </div>
        )
      })}

      {filteredPrices.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <span className="text-4xl block mb-2">🔍</span>
          <p>{t('no_results')}</p>
        </div>
      )}
    </div>
  )
}
