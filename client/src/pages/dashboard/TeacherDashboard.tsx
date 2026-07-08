import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { dashboardAPI, courseAPI, examAPI } from '../../services/api'
import { BookOpen, Clock, ClipboardList } from 'lucide-react'
import StatCard from '../../components/StatCard'
import LoadingSkeleton from '../../components/LoadingSkeleton'


interface TeacherData {
  teacher: any
  cours: any[]
}

export default function TeacherDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [data, setData] = useState<TeacherData | null>(null)
  const [timetable, setTimetable] = useState<any[]>([])
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user?.idPers) { setLoading(false); setError(true); return }
    Promise.all([
      dashboardAPI.getTeacherData(user.idPers),
      courseAPI.getTimetable(),
      examAPI.getEvaluations(),
    ]).then(([teacherRes, timetableRes, evalRes]) => {
      setData(teacherRes.data)
      setTimetable(timetableRes.data)
      setEvaluations(evalRes.data)
    }).catch(() => setError(true))
    .finally(() => setLoading(false))
  }, [user])

  if (loading) return <LoadingSkeleton rows={4} />
  if (error) return <div className="text-center py-10"><p className="text-red-500 font-medium">Erreur de chargement du tableau de bord</p><p className="text-gray-400 text-sm mt-1">Vérifie que le serveur est bien démarré</p></div>
  if (!data) return <p className="text-gray-500 italic">{t('common.noData')}</p>

  const classIds = [...new Set(data.cours.map((c: any) => c.idClasse).filter(Boolean))]
  const myTimetable = timetable.filter((t: any) => classIds.includes(t.idClasse))
  const recentGrades = evaluations.slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {t('dashboard.title')} — {user?.nom} {user?.prenom}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={t('dashboard.myClasses')} value={classIds.length} icon={<BookOpen size={22} />} />
        <StatCard title={t('dashboard.mySchedule')} value={myTimetable.length} icon={<Clock size={22} />} />
        <StatCard title={t('dashboard.recentGrades')} value={evaluations.length} icon={<ClipboardList size={22} />} color="text-cameroon-red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.myClasses')}</h3>
          <ul className="space-y-2">
            {data.cours.map((c: any) => (
              <li key={c.idCours} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                <BookOpen size={16} className="text-cameroon-green" />
                <span className="font-medium">{c.libelle}</span>
                {c.idClasse && (
                  <span className="text-xs text-gray-400 ml-auto">Classe #{c.idClasse}</span>
                )}
              </li>
            ))}
            {data.cours.length === 0 && (
              <p className="text-sm text-gray-400 italic">{t('common.noData')}</p>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.mySchedule')}</h3>
          <div className="space-y-2 text-sm">
            {myTimetable.map((t: any) => (
              <div key={t.idTemps} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <span className="font-medium">{t.jour}</span>
                <span className="text-gray-500">{t.heure}</span>
                <span>{t.cours}</span>
              </div>
            ))}
            {myTimetable.length === 0 && (
              <p className="text-sm text-gray-400 italic">{t('common.noData')}</p>
            )}
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
              {recentGrades.map((g: any) => (
                <tr key={g.idEval} className="border-b last:border-0">
                  <td className="px-3 py-2">{g.matricule}</td>
                  <td className="px-3 py-2">{g.matiere}</td>
                  <td className="px-3 py-2 font-medium">{g.note}/20</td>
                </tr>
              ))}
              {recentGrades.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-gray-400 italic">{t('common.noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
