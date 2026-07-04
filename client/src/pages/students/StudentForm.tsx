import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { studentAPI, classAPI } from '../../services/api'
import { LANGUAGES, SEXE_OPTIONS } from '../../utils/constants'
import { Cycle, Student } from '../../types'
import toast from 'react-hot-toast'

export default function StudentForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    sexe: 1 as number,
    langue: 'FR',
    idCycle: 0 as number,
    photoURL: '',
  })

  const [cycles, setCycles] = useState<Cycle[]>([])

  useEffect(() => {
    classAPI.getCycles().then(res => setCycles(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    studentAPI.getById(parseInt(id)).then((res) => {
      const s = res.data
      setForm({
        nom: s.nom || '',
        prenom: s.prenom || '',
        dateNaissance: s.dateNaissance ? s.dateNaissance.slice(0, 10) : '',
        lieuNaissance: s.lieuNaissance || '',
        sexe: s.sexe,
        langue: s.langue || 'FR',
        idCycle: s.idCycle || 0,
        photoURL: s.photoURL || '',
      })
    }).catch(() => toast.error(t('toast.error')))
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const newForm = { ...form, [name]: name === 'sexe' || name === 'idCycle' ? Number(value) : value }
    
    // Auto-select cycle based on language if possible
    if (name === 'langue') {
      const targetCycleName = value === 'FR' ? 'francophone' : (value === 'EN' ? 'anglophone' : '')
      if (targetCycleName) {
        const matched = cycles.find(c => c.libelle.toLowerCase().includes(targetCycleName))
        if (matched) {
          newForm.idCycle = matched.idCycle
        }
      }
    }
    setForm(newForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: Partial<Student> = {
        ...form,
        sexe: form.sexe as 1 | 2,
        langue: form.langue as 'FR' | 'EN' | 'Bilingue'
      }
      if (isEdit) {
        await studentAPI.update(parseInt(id!), payload)
      } else {
        await studentAPI.create(payload)
      }
      toast.success(t('toast.saved'))
      navigate('/admin/students')
    } catch {
      toast.error(t('toast.error'))
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? t('student.edit') : t('student.add')}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('student.nom')}</label>
            <input
              type="text"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('student.prenom')}</label>
            <input
              type="text"
              name="prenom"
              value={form.prenom}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('student.dateNaissance')}</label>
            <input
              type="date"
              name="dateNaissance"
              value={form.dateNaissance}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('student.sexe')}</label>
            <select
              name="sexe"
              value={form.sexe}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green"
            >
              {SEXE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.labelFr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('student.lieuNaissance')}</label>
          <input
            type="text"
            name="lieuNaissance"
            value={form.lieuNaissance}
            onChange={handleChange}
            required
            placeholder="Yaoundé, Douala..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('student.langue')}</label>
            <select
              name="langue"
              value={form.langue}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cycle</label>
            <select
              name="idCycle"
              value={form.idCycle || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green"
            >
              <option value="">{t('common.select')}</option>
              {cycles.map((c) => (
                <option key={c.idCycle} value={c.idCycle}>{c.libelle}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition"
          >
            {t('common.save')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
