import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { studentAPI, classAPI, academicAPI, parentAPI } from '../../services/api'
import type { Student, Salle, AnneeAcademique } from '../../types'
import toast from 'react-hot-toast'
import Combobox from '../../components/Combobox'
import { Link as LinkIcon, UserPlus } from 'lucide-react'

export default function EnrollmentForm() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isFr = i18n.language !== 'en'

  const [students, setStudents] = useState<Student[]>([])
  const [salles, setSalles] = useState<Salle[]>([])
  const [annees, setAnnees] = useState<AnneeAcademique[]>([])
  const [form, setForm] = useState({ matricule: 0, idSalle: 0, idAcademi: 0 })

  const [parentMode, setParentMode] = useState<'create' | 'link'>('create')
  const [parent, setParent] = useState({ nom: '', prenom: '', email: '', password: 'password', mobile: '' })
  const [selectedParent, setSelectedParent] = useState<{ idParent?: number; idPers?: number; nom: string; prenom: string; email?: string; mobile?: string } | null>(null)

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
      const parentPayload = parentMode === 'link' && selectedParent
        ? { nom: selectedParent.nom, prenom: selectedParent.prenom, email: selectedParent.email || '', password: '', mobile: selectedParent.mobile || '' }
        : parentMode === 'create' && parent.email
        ? parent
        : undefined

      await studentAPI.enroll({
        ...form,
        parent: parentPayload,
      })
      toast.success(t('toast.saved'))
      navigate('/admin/students')
    } catch {
      toast.error(t('toast.error'))
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('student.enrollment')}</h1>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.nom')}</label>
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="">{t('common.select')}</option>
            {students.filter((s) => s.actif).map((s) => (
              <option key={s.matricule} value={s.matricule}>{s.nom} {s.prenom} (#{s.matricule})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.selectClass')}</label>
          <select
            value={form.idSalle}
            onChange={(e) => setForm({ ...form, idSalle: parseInt(e.target.value) })}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="">{t('common.select')}</option>
            {salles.filter((s) => s.actif).map((s) => (
              <option key={s.idSalle} value={s.idSalle}>{s.libelle} — {s.classe}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('student.selectYear')}</label>
          <select
            value={form.idAcademi}
            onChange={(e) => setForm({ ...form, idAcademi: parseInt(e.target.value) })}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="">{t('common.select')}</option>
            {annees.map((a) => (
              <option key={a.idAnnee} value={a.idAnnee}>{a.libelle}</option>
            ))}
          </select>
        </div>

        <hr className="border-gray-200 dark:border-slate-700" />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {isFr ? 'Lier un parent' : 'Link a parent'}
          </label>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setParentMode('link')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border transition ${
                parentMode === 'link'
                  ? 'bg-cameroon-green text-white border-cameroon-green'
                  : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:border-cameroon-green'
              }`}
            >
              <LinkIcon size={16} />
              {isFr ? 'Lier existant' : 'Link existing'}
            </button>
            <button
              type="button"
              onClick={() => setParentMode('create')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border transition ${
                parentMode === 'create'
                  ? 'bg-cameroon-green text-white border-cameroon-green'
                  : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:border-cameroon-green'
              }`}
            >
              <UserPlus size={16} />
              {isFr ? 'Nouveau parent' : 'New parent'}
            </button>
          </div>

          {parentMode === 'link' && (
            <Combobox
              label={isFr ? 'Rechercher un parent' : 'Search parent'}
              placeholder={isFr ? 'Nom, prénom ou téléphone...' : 'Name or phone...'}
              fetchFn={parentAPI.search}
              onSelect={setSelectedParent}
              selectedLabel={selectedParent ? `${selectedParent.nom} ${selectedParent.prenom}${selectedParent.email ? ` (${selectedParent.email})` : ''}` : null}
            />
          )}

          {parentMode === 'create' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nom *</label>
                  <input type="text" value={parent.nom} onChange={(e) => setParent({ ...parent, nom: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Prénom *</label>
                  <input type="text" value={parent.prenom} onChange={(e) => setParent({ ...parent, prenom: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email *</label>
                <input type="email" value={parent.email} onChange={(e) => setParent({ ...parent, email: e.target.value })} required placeholder="parent@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{isFr ? 'Mot de passe' : 'Password'} *</label>
                  <input type="password" value={parent.password} onChange={(e) => setParent({ ...parent, password: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{isFr ? 'Téléphone' : 'Phone'}</label>
                  <input type="text" value={parent.mobile} onChange={(e) => setParent({ ...parent, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" className="px-6 py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition">
            {t('common.save')}
          </button>
          <button type="button" onClick={() => navigate('/admin/students')} className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
