import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { ClipboardList, CreditCard, MessageSquare } from 'lucide-react'
import StatCard from '../../components/StatCard'
import { mockStudents, mockEvaluations, mockPaiements, mockMessages } from '../../services/mockData'
import { formatCurrency } from '../../utils/formatters'
import { getGradeColor } from '../../utils/grading'

export default function ParentDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const child = mockStudents[0]
  const childGrades = mockEvaluations.filter((e) => e.matricule === child.matricule)
  const childPayments = mockPaiements.filter((p) => p.matricule === child.matricule)
  const messages = mockMessages.slice(0, 3)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {t('parent.title')} — {user?.nom} {user?.prenom}
      </h1>

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
            <p className="font-medium">{child.classe}</p>
          </div>
          <div>
            <p className="text-gray-400">{t('student.langue')}</p>
            <p className="font-medium">{child.langue}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={t('dashboard.childGrades')} value={childGrades.length} icon={<ClipboardList size={22} />} />
        <StatCard title={t('dashboard.childPayments')} value={formatCurrency(childPayments.reduce((s, p) => s + p.montant, 0))} icon={<CreditCard size={22} />} color="text-cameroon-green" />
        <StatCard title={t('dashboard.messages')} value={messages.length} icon={<MessageSquare size={22} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('parent.grades')}</h3>
          <div className="space-y-2">
            {childGrades.map((g) => (
              <div key={g.idEval} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <span>{g.matiere}</span>
                <span className={`font-semibold ${getGradeColor(g.note)}`}>{g.note}/20</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('parent.messages')}</h3>
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.idMessages} className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{m.objet}</p>
                <p className="text-gray-500 text-xs mt-1">{m.information}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
