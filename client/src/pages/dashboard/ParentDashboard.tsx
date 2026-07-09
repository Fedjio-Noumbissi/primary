import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { dashboardAPI, studentAPI, messageAPI } from '../../services/api'
import { ClipboardList, CreditCard, MessageSquare, RefreshCw } from 'lucide-react'
import StatCard from '../../components/StatCard'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { getGradeColor } from '../../utils/grading'

interface ChildData {
  matricule: number
  nom: string
  prenom: string
  classe?: string
  salle?: string
  langue?: string
  dateNaissance?: string
  lieuNaissance?: string
  sexe?: number
}

export default function ParentDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [children, setChildren] = useState<ChildData[]>([])
  const [selectedChild, setSelectedChild] = useState<number | null>(null)
  const [grades, setGrades] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
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
        if (kids.length > 0) {
          setSelectedChild(kids[0].matricule)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadChildren() }, [user])

  useEffect(() => {
    if (!selectedChild) return
    setGrades([])
    setPayments([])
    setMessages([])
    Promise.all([
      studentAPI.getGrades(selectedChild),
      studentAPI.getPayments(selectedChild),
      messageAPI.getForUser('parent', user?.idPers || 0),
    ]).then(([gradesRes, paymentsRes, messagesRes]) => {
      setGrades(gradesRes.data)
      setPayments(paymentsRes.data)
      setMessages(messagesRes.data.slice(0, 3))
    }).catch((e) => console.error('Parent data fetch error:', e))
  }, [selectedChild, user])

  if (loading) return <LoadingSkeleton rows={4} />
  if (error) return (
    <div className="text-center py-10">
      <p className="text-red-500 font-medium">Erreur de chargement du tableau de bord</p>
      <p className="text-gray-400 text-sm mt-1">Impossible de charger les données. Vérifie que le serveur est bien démarré.</p>
      <button onClick={loadChildren} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm">
        <RefreshCw size={16} /> Réessayer
      </button>
    </div>
  )

  const child = children.find((c) => c.matricule === selectedChild) || children[0]

  if (!child) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('parent.title')} — {user?.nom} {user?.prenom}
        </h1>
        <p className="text-gray-500 italic">{t('common.noData')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {t('parent.title')} — {user?.nom} {user?.prenom}
      </h1>

      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map((c) => (
            <button
              key={c.matricule}
              onClick={() => setSelectedChild(c.matricule)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                selectedChild === c.matricule
                  ? 'bg-cameroon-green text-white border-cameroon-green'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-cameroon-green'
              }`}
            >
              {c.nom} {c.prenom}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">{t('parent.childInfo')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">{t('student.nom')}</p>
            <p className="font-medium">{child.nom} {child.prenom}</p>
          </div>
          <div>
            <p className="text-gray-400">{t('student.matricule')}</p>
            <p className="font-medium">{child.matricule}</p>
          </div>
          <div>
            <p className="text-gray-400">{t('student.classe')}</p>
            <p className="font-medium">{child.classe || child.salle || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">{t('student.langue')}</p>
            <p className="font-medium">{child.langue || '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={t('dashboard.childGrades')} value={grades.length} icon={<ClipboardList size={22} />} />
        <StatCard title={t('dashboard.childPayments')} value={formatCurrency(payments.reduce((s, p) => s + p.montant, 0))} icon={<CreditCard size={22} />} color="text-cameroon-green" />
        <StatCard title={t('dashboard.messages')} value={messages.length} icon={<MessageSquare size={22} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('parent.grades')}</h3>
          <div className="space-y-2">
            {grades.map((g: any) => (
              <div key={g.idEval} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <span>{g.matiere || g.libelle}</span>
                <span className={`font-semibold ${getGradeColor(g.note)}`}>{g.note}/20</span>
              </div>
            ))}
            {grades.length === 0 && (
              <p className="text-sm text-gray-400 italic">{t('common.noData')}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('parent.messages')}</h3>
          <div className="space-y-3">
            {messages.map((m: any) => (
              <div key={m.idMessages || m.id} className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{m.objet}</p>
                <p className="text-gray-500 text-xs mt-1">{m.information}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-sm text-gray-400 italic">{t('common.noData')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
