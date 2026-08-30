import { useTranslation } from 'react-i18next'
import { payments } from '../data/mockLogistics'
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatters'

export default function PaymentsPage() {
  const { t } = useTranslation()

  const totalReceived = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">💰 {t('payments')}</h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card bg-green-50 text-center">
          <p className="text-xs text-green-600 font-semibold">{t('total_received')}</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="card bg-yellow-50 text-center">
          <p className="text-xs text-yellow-600 font-semibold">{t('total_pending')}</p>
          <p className="text-lg font-bold text-yellow-700">{formatCurrency(totalPending)}</p>
        </div>
        <div className="card bg-red-50 text-center">
          <p className="text-xs text-red-600 font-semibold">{t('overdue')}</p>
          <p className="text-lg font-bold text-red-700">{formatCurrency(totalOverdue)}</p>
        </div>
      </div>

      {/* Payment List */}
      <h3 className="font-bold">{t('payment_history')}</h3>
      <div className="space-y-2">
        {payments.map(payment => (
          <div key={payment.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{payment.buyerName}</h3>
                  <span className={`badge ${getStatusColor(payment.status)}`}>{t(payment.status)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{t(payment.commodityId)} · {payment.quantity} {t('quintals')}</p>
                <p className="text-xs text-gray-400 mt-1">📅 {formatDate(payment.date)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                {payment.status === 'paid' && (
                  <button className="text-primary-600 text-xs font-semibold mt-1">
                    📄 {t('download_receipt')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
