import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { dashboardAPI, studentAPI } from '../../services/api'
import { RefreshCw, GraduationCap } from 'lucide-react'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { getGradeColor } from '../../utils/grading'
import { formatDate } from '../../utils/formatters'

interface ChildData {
  matricule: number
  nom: string
  prenom: string
  classe?: string
  salle?: string
}

interface Grade {
  idEval: number
  note: number
  appreciation: string
  matricule: number
  idEpreuve: number
  idCours: number
  idSession: number
  matiere: string
}

export default function ParentGrades() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [children, setChildren] = useState<ChildData[]>([])
  const [selectedMatricule, setSelectedMatricule] = useState<number | null>(null)
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadChildren = () => {
    if (!user?.idPers) { setLoading(false); setError(true); return }
    setLoading(true)
    setError(false)
    dashboardAPI.getParentData(user.idPers)
      .then((res) => {
        const kids = res.data.children || []
        setChildren(kids)
        if (kids.length > 0) setSelectedMatricule(kids[0].matricule)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadChildren() }, [user])

  useEffect(() => {
    if (!selectedMatricule) return
    setGrades([])
    studentAPI.getGrades(selectedMatricule)
      .then((res) => setGrades(res.data || []))
      .catch(() => {})
  }, [selectedMatricule])

  if (loading) return <LoadingSkeleton rows={4} />
  if (error) return (
    <div className="text-center py-10">
      <p className="text-red-500 font-medium">Erreur de chargement</p>
      <p className="text-gray-400 text-sm mt-1">Impossible de charger les données.</p>
      <button onClick={loadChildren} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm">
        <RefreshCw size={16} /> Réessayer
      </button>
    </div>
  )

  const child = children.find((c) => c.matricule === selectedMatricule) || children[0]
  if (!child) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Notes et examens</h1>
      <p className="text-gray-500 italic">{t('common.noData')}</p>
    </div>
  )

  const average = grades.length > 0
    ? (grades.reduce((s, g) => s + g.note, 0) / grades.length).toFixed(2)
    : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Notes et examens — {user?.nom} {user?.prenom}
      </h1>

      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((c) => (
            <button
              key={c.matricule}
              onClick={() => setSelectedMatricule(c.matricule)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                selectedMatricule === c.matricule
                  ? 'bg-cameroon-green text-white border-cameroon-green'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-cameroon-green'
              }`}
            >
              <GraduationCap size={14} className="inline mr-1" />
              {c.nom} {c.prenom}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Informations de l'élève</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Nom</p>
            <p className="font-medium">{child.nom} {child.prenom}</p>
          </div>
          <div>
            <p className="text-gray-400">Matricule</p>
            <p className="font-medium">{child.matricule}</p>
          </div>
          <div>
            <p className="text-gray-400">Classe</p>
            <p className="font-medium">{child.classe || child.salle || '—'}</p>
          </div>
        </div>
      </div>

      {average && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-sm text-gray-400">Moyenne générale</p>
          <p className={`text-3xl font-bold ${Number(average) >= 10 ? 'text-green-600' : 'text-red-600'}`}>
            {average}/20
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Notes obtenues</h3>
        {grades.length > 0 ? (
          <div className="space-y-2">
            {grades.map((g) => (
              <div key={g.idEval} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium">{g.matiere || '—'}</span>
                  {g.appreciation && (
                    <p className="text-xs text-gray-400 mt-0.5">{g.appreciation}</p>
                  )}
                </div>
                <span className={`font-semibold text-base ${getGradeColor(g.note)}`}>{g.note}/20</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">{t('common.noData')}</p>
        )}
      </div>
    </div>
  )
}
