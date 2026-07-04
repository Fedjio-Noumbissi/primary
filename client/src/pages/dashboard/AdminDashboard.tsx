import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { dashboardAPI } from '../../services/api'
import { DashboardStats, Paiement, Student } from '../../types'
import StatCard from '../../components/StatCard'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import {
  Users, GraduationCap, CreditCard, AlertTriangle, School,
  ArrowUpRight, UserCheck, User
} from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/formatters'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const GENDER_COLORS = ['#3b82f6', '#f472b6']

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [studentsPerClass, setStudentsPerClass] = useState<{ libelle: string; effectif: number }[]>([])
  const [paymentTrend, setPaymentTrend] = useState<{ month: string; total: number }[]>([])
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardAPI.getStats(),
      dashboardAPI.getStudentsPerClass(),
      dashboardAPI.getPaymentTrend(),
      dashboardAPI.getRecentPayments(),
      dashboardAPI.getRecentStudents(),
    ]).then(([s, spc, pt, rp, rs]) => {
      setStats(s.data)
      setStudentsPerClass(spc.data)
      setPaymentTrend(pt.data)
      setRecentPayments(rp.data)
      setRecentStudents(rs.data)
      setLoading(false)
    })
  }, [])

  if (loading || !stats) return <LoadingSkeleton rows={6} />

  const genderData = [
    { name: t('dashboard.boys'), value: stats.boysCount },
    { name: t('dashboard.girls'), value: stats.girlsCount },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.totalStudents')} value={stats.totalStudents} icon={<Users size={22} />} />
        <StatCard title={t('dashboard.totalTeachers')} value={stats.totalTeachers} icon={<GraduationCap size={22} />} />
        <StatCard title={t('dashboard.totalPayments')} value={formatCurrency(stats.totalPayments)} icon={<CreditCard size={22} />} color="text-cameroon-red" />
        <StatCard title={t('dashboard.pendingFees')} value={formatCurrency(stats.pendingFees)} icon={<AlertTriangle size={22} />} color="text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={t('dashboard.classesCount')} value={stats.classesCount} icon={<School size={22} />} />
        <StatCard title={t('dashboard.boys')} value={stats.boysCount} icon={<UserCheck size={22} />} color="text-blue-500" />
        <StatCard title={t('dashboard.girls')} value={stats.girlsCount} icon={<User size={22} />} color="text-pink-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.boys')} / {t('dashboard.girls')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {genderData.map((_, i) => (
                  <Cell key={i} fill={GENDER_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('student.classe')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={studentsPerClass}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="libelle" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="effectif" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard size={18} className="text-cameroon-green" />
          {t('payment.title')}
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={paymentTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v: any) => formatCurrency(v)} />
            <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-cameroon-green" />
            {t('dashboard.recentPayments')}
          </h3>
          <div className="space-y-3">
            {recentPayments.map((p) => (
              <div key={p.idPaie} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{p.nom ? `${p.nom} ${p.prenom || ''}` : `#${p.matricule}`}</p>
                  <p className="text-gray-400 text-xs">{p.mode} &bull; {formatDate(p.datePaie)}</p>
                </div>
                <span className="font-semibold text-cameroon-green">{formatCurrency(p.montant)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowUpRight size={18} className="text-cameroon-green" />
            {t('dashboard.recentStudents')}
          </h3>
          <div className="space-y-3">
            {recentStudents.map((s) => (
              <div key={s.matricule} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{s.nom} {s.prenom}</p>
                  <p className="text-gray-400 text-xs">{s.langue}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  s.sexe === 1 ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                }`}>
                  {s.sexe === 1 ? 'Masculin' : 'Féminin'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
