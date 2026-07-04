import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { studentAPI, classAPI, academicAPI } from '../../services/api'
import type { Student, Salle, AnneeAcademique } from '../../types'
import toast from 'react-hot-toast'

export default function EnrollmentForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [salles, setSalles] = useState<Salle[]>([])
  const [annees, setAnnees] = useState<AnneeAcademique[]>([])
  const [form, setForm] = useState({ matricule: 0, idSalle: 0, idAcademi: 0 })

  useEffect(() => {
    Promise.all([
      studentAPI.getAll(),
      classAPI.getSalles(),
      academicAPI.getAnnees(),
    ]).then(([s, sa, a]) => {
      setStudents(s.data)
      setSalles(sa.data)
      setAnnees(a.data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await studentAPI.enroll(form)
      toast.success(t('toast.saved'))
      navigate('/admin/students')
    } catch {
      toast.error(t('toast.error'))
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('student.enrollment')}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('student.nom')}</label>
          <select
            value={form.matricule}
            onChange={(e) => setForm({ ...form, matricule: parseInt(e.target.value) })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">{t('common.select')}</option>
            {students.filter((s) => s.actif).map((s) => (
              <option key={s.matricule} value={s.matricule}>{s.nom} {s.prenom} (#{s.matricule})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('student.selectClass')}</label>
          <select
            value={form.idSalle}
            onChange={(e) => setForm({ ...form, idSalle: parseInt(e.target.value) })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">{t('common.select')}</option>
            {salles.filter((s) => s.actif).map((s) => (
              <option key={s.idSalle} value={s.idSalle}>{s.libelle} — {s.classe}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('student.selectYear')}</label>
          <select
            value={form.idAcademi}
            onChange={(e) => setForm({ ...form, idAcademi: parseInt(e.target.value) })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">{t('common.select')}</option>
            {annees.map((a) => (
              <option key={a.idAnnee} value={a.idAnnee}>{a.libelle}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="px-6 py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition">
            {t('common.save')}
          </button>
          <button type="button" onClick={() => navigate('/admin/students')} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
