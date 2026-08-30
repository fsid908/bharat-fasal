import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { myLots } from '../data/mockLots'
import { commodities } from '../data/mockCommodities'
import { formatCurrency, getStatusColor, formatDate } from '../utils/formatters'

export default function MyLotsPage() {
  const { t } = useTranslation()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedLot, setSelectedLot] = useState(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📦 {t('my_lots')}</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm py-2">
          ➕ {t('create_lot')}
        </button>
      </div>

      {/* Create Lot Form */}
      {showCreate && (
        <div className="card border-primary-300 bg-primary-50/30">
          <h3 className="font-bold mb-4">📦 {t('create_lot')}</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">{t('commodity')}</label>
              <select className="input-field">
                <option value="">{t('commodity')}...</option>
                {commodities.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {t(c.id)}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">{t('quantity')} ({t('quintals')})</label>
                <input type="number" className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">{t('quality_grade')}</label>
                <select className="input-field">
                  <option>{t('grade_a')}</option>
                  <option>{t('grade_b')}</option>
                  <option>{t('grade_c')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">{t('expected_price')} (₹/{t('quintals')})</label>
              <input type="number" className="input-field" placeholder="0" />
            </div>
            <button className="btn-primary w-full mt-2">📷 {t('add_photos')}</button>
            <div className="flex gap-2">
              <button className="btn-primary flex-1">{t('submit_lot')}</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Lots List */}
      <div className="space-y-3">
        {myLots.map(lot => {
          const commodity = commodities.find(c => c.id === lot.commodityId)
          return (
            <div key={lot.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{commodity?.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{t(lot.commodityId)}</h3>
                      <span className={`badge ${getStatusColor(lot.status)}`}>{t(lot.status)}</span>
                    </div>
                    <p className="text-sm text-gray-500">{lot.id} · {formatDate(lot.createdAt)}</p>
                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                      <span>📦 {lot.quantity} {t('quintals')}</span>
                      <span>⭐ {lot.grade}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(lot.expectedPrice)}</p>
                  <p className="text-xs text-gray-500">{t('per_quintal')}</p>
                </div>
              </div>

              {/* Offers */}
              {lot.offers.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">📥 {t('offers_received')} ({lot.offers.length})</p>
                  {lot.offers.map((offer, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold">{offer.buyerName}</p>
                        <p className="text-xs text-gray-500">{formatDate(offer.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary-700">{formatCurrency(offer.price)}</span>
                        <button className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-semibold">✅ {t('accept')}</button>
                        <button className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-semibold">❌ {t('reject')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {lot.soldTo && (
                <div className="mt-4 bg-green-50 rounded-xl p-3">
                  <p className="text-sm text-green-800">✅ {t('sold')} to <b>{lot.soldTo}</b> at {formatCurrency(lot.soldPrice)} on {formatDate(lot.soldDate)}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
