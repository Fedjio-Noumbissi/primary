interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: string
}

export default function StatCard({ title, value, icon, color = 'text-cameroon-green' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition">
      <div className={`w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
