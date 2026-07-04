import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { studentAPI } from '../../services/api'
import { Student, Evaluation, Paiement } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, BookOpen, CreditCard, ShieldAlert } from 'lucide-react'
import { formatDate, formatCurrency } from '../../utils/formatters'
import { getGradeColor } from '../../utils/grading'

export default function StudentProfile() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [student, setStudent] = useState<Student | null>(null)
  const [grades, setGrades] = useState<Evaluation[]>([])
  const [payments, setPayments] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const mat = parseInt(id)
    Promise.all([
      studentAPI.getById(mat),
      studentAPI.getGrades(mat),
      studentAPI.getPayments(mat),
    ]).then(([s, g, p]) => {
      setStudent(s.data)
      setGrades(g.data)
      setPayments(p.data)
      setLoading(false)
    })
  }, [id])

  if (loading || !student) return <LoadingSkeleton rows={8} />

  return (
    <div className="space-y-6">
      <Link to="/admin/students" className="flex items-center gap-2 text-sm text-gray-500 hover:text-cameroon-green">
        <ArrowLeft size={16} /> {t('common.back')}
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-cameroon-green text-white flex items-center justify-center text-2xl font-bold">
            {student.nom[0]}{student.prenom[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{student.nom} {student.prenom}</h1>
            <p className="text-gray-500">#{student.matricule} • {student.classe} • {student.langue}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(student.dateNaissance)}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {student.lieuNaissance}</span>
              <span className="flex items-center gap-1">{student.sexe === 1 ? '♂' : '♀'}</span>
            </div>
          </div>
          <Link
            to={`/admin/students/${id}/edit`}
            className="px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition"
          >
            {t('common.edit')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-cameroon-green" />
            {t('student.grades')}
          </h3>
          {grades.length === 0 ? (
            <p className="text-sm text-gray-400">{t('common.noData')}</p>
          ) : (
            <div className="space-y-2">
              {grades.map((g) => (
                <div key={g.idEval} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                  <span>{g.matiere}</span>
                  <span className={`font-semibold ${getGradeColor(g.note)}`}>{g.note}/20</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-cameroon-green" />
            {t('student.payments')}
          </h3>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-400">{t('common.noData')}</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.idPaie} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="font-medium">{formatCurrency(p.montant)}</span>
                    <span className="text-gray-400 ml-2">{p.mode}</span>
                  </div>
                  <span className="text-gray-400">{formatDate(p.datePaie)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
