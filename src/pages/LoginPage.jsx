import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function LoginPage({ onLogin }) {
  const { t } = useTranslation()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [userType, setUserType] = useState('farmer')

  const handleSendOtp = () => {
    if (phone.length >= 10) setOtpSent(true)
  }

  const handleVerify = () => {
    if (otp.length === 4) onLogin(userType)
  }

  const roles = [
    { id: 'farmer', icon: '👨‍🌾', label: t('farmer') },
    { id: 'fpo', icon: '🏢', label: t('fpo') },
    { id: 'buyer', icon: '🤝', label: t('buyer_marketplace').split(' ')[0] || 'Buyer' },
    { id: 'admin', icon: '🛡️', label: 'Admin' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <span className="text-5xl mb-3 block">🌾</span>
          <h1 className="text-2xl font-bold text-primary-800">{t('app_name')}</h1>
          <p className="text-gray-500 mt-1">{t('tagline')}</p>
        </div>

        <div className="card p-6">
          {/* Role Selection */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setUserType(role.id)}
                className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all ${
                  userType === role.id
                    ? 'bg-primary-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-2xl">{role.icon}</span>
                <span className="text-xs font-semibold mt-1">{role.label}</span>
              </button>
            ))}
          </div>

          {!otpSent ? (
            <>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('phone_number')}</label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-gray-100 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold">
                  +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={t('enter_phone')}
                  className="input-field flex-1"
                  maxLength={10}
                />
              </div>
              <button onClick={handleSendOtp} className="btn-primary w-full mt-4">
                📱 {t('send_otp')}
              </button>
            </>
          ) : (
            <>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('enter_otp')}</label>
              <div className="flex gap-2 justify-center mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={otp[i] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      const newOtp = otp.split('')
                      newOtp[i] = val
                      setOtp(newOtp.join(''))
                      if (val && e.target.nextSibling) e.target.nextSibling.focus()
                    }}
                    className="w-14 h-14 text-center text-2xl font-bold input-field"
                  />
                ))}
              </div>
              <button onClick={handleVerify} className="btn-primary w-full">
                ✅ {t('verify')}
              </button>
              <button onClick={() => setOtpSent(false)} className="text-primary-600 text-sm mt-3 w-full text-center">
                ← {t('back')}
              </button>
            </>
          )}
        </div>

        <button onClick={() => onLogin('farmer')} className="text-primary-600 font-semibold mt-4 w-full text-center py-2">
          {t('skip')} →
        </button>
      </div>
    </div>
  )
}
