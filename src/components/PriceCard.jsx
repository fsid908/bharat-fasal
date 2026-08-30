import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, getChangeColor, getChangeIcon } from '../utils/formatters'
import { commodities } from '../data/mockCommodities'

export default function PriceCard({ price }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const commodity = commodities.find(c => c.id === price.commodityId)

  return (
    <div
      className="card cursor-pointer hover:border-primary-300 min-w-[180px]"
      onClick={() => navigate(`/prices/${price.commodityId}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{commodity?.icon}</span>
          <div>
            <h3 className="font-semibold text-sm">{t(price.commodityId)}</h3>
            <p className="text-xs text-gray-500">{price.mandi}</p>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between mt-3">
        <div>
          <p className="text-lg font-bold text-primary-700">{formatCurrency(price.price)}</p>
          <p className="text-xs text-gray-500">{t('per_quintal')}</p>
        </div>
        <div className={`flex items-center gap-1 ${getChangeColor(price.change)}`}>
          <span>{getChangeIcon(price.change)}</span>
          <span className="text-sm font-semibold">{Math.abs(price.change)}%</span>
        </div>
      </div>
    </div>
  )
}
