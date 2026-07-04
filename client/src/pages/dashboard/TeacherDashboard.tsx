import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { BookOpen, Clock, ClipboardList } from 'lucide-react'
import StatCard from '../../components/StatCard'
import { mockClasses, mockEmplois, mockEvaluations } from '../../services/mockData'
import { formatDate } from '../../utils/formatters'

export default function TeacherDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const myClasses = mockClasses.slice(0, 2)
  const myTimetable = mockEmplois
  const recentGrades = mockEvaluations.slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {t('dashboard.title')} — {user?.nom} {user?.prenom}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={t('dashboard.myClasses')} value={myClasses.length} icon={<BookOpen size={22} />} />
        <StatCard title={t('dashboard.mySchedule')} value={myTimetable.length} icon={<Clock size={22} />} />
        <StatCard title={t('dashboard.recentGrades')} value={recentGrades.length} icon={<ClipboardList size={22} />} color="text-cameroon-red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.myClasses')}</h3>
          <ul className="space-y-2">
            {myClasses.map((c) => (
              <li key={c.idClasse} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                <BookOpen size={16} className="text-cameroon-green" />
                <span>{c.libelle}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.mySchedule')}</h3>
          <div className="space-y-2 text-sm">
            {myTimetable.map((t) => (
              <div key={t.idTemps} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <span className="font-medium">{t.jour}</span>
                <span className="text-gray-500">{t.heure}</span>
                <span>{t.cours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.recentGrades')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-3 py-2 text-gray-500 font-medium">{t('grade.student')}</th>
                <th className="px-3 py-2 text-gray-500 font-medium">{t('course.libelle')}</th>
                <th className="px-3 py-2 text-gray-500 font-medium">{t('grade.note')}</th>
              </tr>
            </thead>
            <tbody>
              {recentGrades.map((g) => (
                <tr key={g.idEval} className="border-b last:border-0">
                  <td className="px-3 py-2">{g.matricule}</td>
                  <td className="px-3 py-2">{g.matiere}</td>
                  <td className="px-3 py-2 font-medium">{g.note}/20</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
