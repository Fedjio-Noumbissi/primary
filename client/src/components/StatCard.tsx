interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: string
}

export default function StatCard({ title, value, icon, color = 'text-cameroon-green' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 flex items-center gap-4 shadow-sm hover:shadow-md dark:hover:shadow-slate-900/50 transition backdrop-blur-sm">
      <div className={`w-12 h-12 rounded-lg bg-gray-50 dark:bg-slate-700/50 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}
