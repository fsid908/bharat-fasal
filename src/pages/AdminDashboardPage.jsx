import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import StatCard from '../components/StatCard'
import { buyers } from '../data/mockBuyers'
import { mandiPrices } from '../data/mockPrices'
import { payments, disputes } from '../data/mockLogistics'
import { formatCurrency } from '../utils/formatters'

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const pendingDisputes = disputes.filter(d => d.status !== 'resolved').length

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm">Admin Panel</p>
        <h2 className="text-2xl font-bold mt-1">🛡️ Bharat Fasal Administration</h2>
        <p className="text-indigo-200 text-sm mt-1">Platform Management & Analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="👨‍🌾" label="Total Farmers" value="12,450" color="primary" />
        <StatCard icon="🤝" label="Verified Buyers" value={String(buyers.length)} color="blue" />
        <StatCard icon="💰" label="Total Transactions" value={formatCurrency(totalRevenue)} color="yellow" />
        <StatCard icon="⚠️" label="Pending Disputes" value={String(pendingDisputes)} color="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['overview', 'users', 'transactions', 'disputes', 'mandis'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Platform Metrics */}
          <div className="card">
            <h3 className="font-bold mb-4">📊 Platform Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm text-green-600">Active Listings</p>
                <p className="text-2xl font-bold text-green-700">3,245</p>
                <p className="text-xs text-green-500">📈 +12% this week</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-600">Trades Completed</p>
                <p className="text-2xl font-bold text-blue-700">1,892</p>
                <p className="text-xs text-blue-500">📈 +8% this week</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-sm text-yellow-600">FPOs Registered</p>
                <p className="text-2xl font-bold text-yellow-700">156</p>
                <p className="text-xs text-yellow-500">📈 +5 this month</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-sm text-purple-600">Avg Price Realization</p>
                <p className="text-2xl font-bold text-purple-700">+8.5%</p>
                <p className="text-xs text-purple-500">Above MSP</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="font-bold mb-4">📋 Recent Activity</h3>
            <div className="space-y-3">
              {[
                { icon: '✅', text: 'New buyer "Tata Agri Corp" verified', time: '2 hours ago', color: 'text-green-600' },
                { icon: '📦', text: 'Lot LOT-1245 matched with buyer', time: '3 hours ago', color: 'text-blue-600' },
                { icon: '⚠️', text: 'Dispute DSP-089 escalated to admin', time: '5 hours ago', color: 'text-red-600' },
                { icon: '💰', text: 'Payment of ₹4,50,000 settled', time: '6 hours ago', color: 'text-green-600' },
                { icon: '👨‍🌾', text: '45 new farmers registered today', time: '8 hours ago', color: 'text-primary-600' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.text}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <h3 className="font-bold mb-4">👥 User Management</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">Role</th>
                  <th className="text-left py-3 px-2">Location</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'UP Agro Industries', role: 'Farmer', location: 'Indore, MP', status: 'active' },
                  { name: 'Bharat Idustries', role: 'FPO', location: 'Bhopal, MP', status: 'active' },
                  { name: 'buzer Agri Busines', role: 'Buyer', location: 'Ahmedabad, GJ', status: 'active' },
                  { name: 'Siddiqui Traders', role: 'Farmer', location: 'Jaipur, RJ', status: 'pending' },
                  { name: 'Arsh pvt.ltd', role: 'FPO', location: 'Nashik, MH', status: 'active' },
                  { name: 'Fash pvt.ltd', role: 'Buyer', location: 'Nagpur, MH', status: 'unverified' },
                ].map((user, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-2 font-semibold">{user.name}</td>
                    <td className="py-3 px-2">
                      <span className={`badge ${user.role === 'Farmer' ? 'badge-green' : user.role === 'FPO' ? 'badge-blue' : 'badge-yellow'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500">{user.location}</td>
                    <td className="py-3 px-2">
                      <span className={`badge ${user.status === 'active' ? 'badge-green' : user.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <button className="text-primary-600 text-xs font-semibold hover:underline">View</button>
                      <span className="mx-1 text-gray-300">|</span>
                      <button className="text-red-600 text-xs font-semibold hover:underline">Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card">
          <h3 className="font-bold mb-4">💰 Transaction Monitor</h3>
          <div className="space-y-3">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-semibold">{p.id} - {p.buyerName}</p>
                  <p className="text-xs text-gray-500">{p.commodityId} · {p.quantity} quintals</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(p.amount)}</p>
                  <span className={`badge ${p.status === 'paid' ? 'badge-green' : p.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'disputes' && (
        <div className="card">
          <h3 className="font-bold mb-4">⚠️ Dispute Resolution Center</h3>
          <div className="space-y-3">
            {disputes.map(d => (
              <div key={d.id} className="card border-l-4 border-l-red-400">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{d.id}</h4>
                      <span className={`badge ${d.status === 'resolved' ? 'badge-green' : d.status === 'in_progress' ? 'badge-yellow' : 'badge-red'}`}>{d.status}</span>
                    </div>
                    <p className="text-sm text-gray-600">{d.buyerName} - {d.type}</p>
                    <p className="text-sm text-gray-500 mt-1">{d.description}</p>
                  </div>
                  <button className="btn-primary text-sm py-1.5 px-3">Review</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mandis' && (
        <div className="card">
          <h3 className="font-bold mb-4">🏪 Mandi Management</h3>
          <div className="space-y-3">
            {[...new Set(mandiPrices.map(p => p.mandi))].map((mandi, i) => {
              const prices = mandiPrices.filter(p => p.mandi === mandi)
              return (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-semibold">{mandi}</p>
                    <p className="text-xs text-gray-500">{prices[0]?.state} · {prices.length} commodities tracked</p>
                  </div>
                  <span className="badge badge-green">Active</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
