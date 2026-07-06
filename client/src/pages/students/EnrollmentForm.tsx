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
  const [createParent, setCreateParent] = useState(false)
  const [parent, setParent] = useState({ nom: '', prenom: '', email: '', password: 'password', mobile: '' })

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
      await studentAPI.enroll({
        ...form,
        parent: createParent ? parent : undefined,
      })
      toast.success(t('toast.saved'))
      navigate('/admin/students')
    } catch {
      toast.error(t('toast.error'))
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('student.enrollment')}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('student.nom')}</label>
          <select
            value={form.matricule}
            onChange={(e) => {
              const s = students.find(st => st.matricule === parseInt(e.target.value))
              setForm({ ...form, matricule: parseInt(e.target.value) })
              if (s && !parent.nom) {
                setParent(prev => ({ ...prev, nom: s.nom, prenom: s.prenom }))
              }
            }}
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

        <hr className="border-gray-200" />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="createParent"
            checked={createParent}
            onChange={(e) => setCreateParent(e.target.checked)}
            className="rounded border-gray-300 text-cameroon-green focus:ring-cameroon-green"
          />
          <label htmlFor="createParent" className="text-sm font-medium text-gray-700">
            Créer un compte parent
          </label>
        </div>

        {createParent && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 text-sm">Informations du parent</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" value={parent.nom} onChange={(e) => setParent({ ...parent, nom: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input type="text" value={parent.prenom} onChange={(e) => setParent({ ...parent, prenom: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={parent.email} onChange={(e) => setParent({ ...parent, email: e.target.value })} required placeholder="parent@email.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input type="password" value={parent.password} onChange={(e) => setParent({ ...parent, password: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="text" value={parent.mobile} onChange={(e) => setParent({ ...parent, mobile: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          </div>
        )}

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
