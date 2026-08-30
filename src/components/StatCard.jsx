export default function StatCard({ icon, label, value, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
  }

  return (
    <div className="card flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  )
}
