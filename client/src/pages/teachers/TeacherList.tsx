import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { teacherAPI, courseAPI, classAPI } from '../../services/api'
import { Teacher, Course, Classe } from '../../types'
import DataTable from '../../components/DataTable'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import { Plus, Edit, ToggleLeft, ToggleRight, BookOpen, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeacherList() {
  const { t } = useTranslation()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', mobile: '', email: '', password: '' })
  const [editId, setEditId] = useState<number | null>(null)

  const [courseModalOpen, setCourseModalOpen] = useState(false)
  const [classModalOpen, setClassModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [allClasses, setAllClasses] = useState<Classe[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    teacherAPI.getAll().then((res) => { setTeachers(res.data); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const handleToggleActive = async (id: number) => {
    try {
      await teacherAPI.toggleActive(id)
      load()
      toast.success(t('toast.saved'))
    } catch { toast.error(t('toast.error')) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (!editId && !payload.email) { toast.error('Email requis'); return }
      if (!editId && !payload.password) { toast.error('Mot de passe requis'); return }
      if (editId) await teacherAPI.update(editId, payload)
      else await teacherAPI.create(payload)
      toast.success(t('toast.saved'))
      setModalOpen(false)
      setForm({ nom: '', prenom: '', mobile: '', email: '', password: '' })
      setEditId(null)
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const openEdit = (tch: Teacher) => {
    setForm({ nom: tch.nom, prenom: tch.prenom, mobile: tch.mobile, email: (tch as any).email || '', password: '' })
    setEditId(tch.idEnseignant)
    setModalOpen(true)
  }

  const openCourseAssign = async (tch: Teacher) => {
    setSelectedTeacher(tch)
    setSelectedCourseIds(tch.cours.map((c) => c.idCours))
    try {
      const res = await courseAPI.getAll()
      setAllCourses(res.data)
    } catch {}
    setCourseModalOpen(true)
  }

  const handleCourseAssign = async () => {
    if (!selectedTeacher) return
    try {
      await teacherAPI.assignCourses(selectedTeacher.idEnseignant, selectedCourseIds)
      toast.success(t('toast.saved'))
      setCourseModalOpen(false)
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const toggleCourseId = (id: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const openClassAssign = async (tch: Teacher) => {
    setSelectedTeacher(tch)
    setSelectedClassId(tch.idClasse ?? null)
    try {
      const res = await classAPI.getClasses()
      setAllClasses(res.data)
    } catch {}
    setClassModalOpen(true)
  }

  const handleClassAssign = async () => {
    if (!selectedTeacher) return
    try {
      await teacherAPI.assignClass(selectedTeacher.idEnseignant, selectedClassId)
      toast.success(t('toast.saved'))
      setClassModalOpen(false)
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const columns = [
    { key: 'nom', label: t('teacher.nom'), render: (tch: Teacher) => <span className="font-medium">{tch.nom} {tch.prenom}</span> },
    { key: 'mobile', label: t('teacher.mobile') },
    {
      key: 'cours',
      label: t('teacher.cours'),
      render: (tch: Teacher) => tch.cours.length > 0 ? tch.cours.map((c) => c.libelle).join(', ') : '-',
    },
    {
      key: 'titulaire',
      label: t('teacher.titulaire'),
      render: (tch: Teacher) => tch.classeLibelle || <span className="text-gray-400">-</span>,
    },
    { key: 'actif', label: t('common.status'), render: (tch: Teacher) => (
      <span className={`text-xs px-2 py-0.5 rounded ${tch.actif ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        {tch.actif ? t('common.active') : t('common.inactive')}
      </span>
    )},
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('teacher.title')}</h1>
        <button
          onClick={() => { setForm({ nom: '', prenom: '', mobile: '', email: '', password: '' }); setEditId(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition"
        >
          <Plus size={16} /> {t('teacher.add')}
        </button>
      </div>

      {loading ? <LoadingSkeleton /> : (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <DataTable
            columns={columns}
            data={teachers}
            actions={(tch: Teacher) => (
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => openCourseAssign(tch)}
                  className="p-1.5 hover:bg-gray-100 rounded text-indigo-600"
                  title={t('teacher.assignCourses')}
                >
                  <BookOpen size={16} />
                </button>
                <button
                  onClick={() => openClassAssign(tch)}
                  className="p-1.5 hover:bg-gray-100 rounded text-purple-600"
                  title={t('teacher.assignClass')}
                >
                  <Users size={16} />
                </button>
                <button
                  onClick={() => handleToggleActive(tch.idEnseignant)}
                  className={`p-1.5 hover:bg-gray-100 rounded ${tch.actif ? 'text-amber-600' : 'text-green-600'}`}
                  title={t('user.toggleActive')}
                >
                  {tch.actif ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button onClick={() => openEdit(tch)} className="p-1.5 hover:bg-gray-100 rounded text-blue-600" title={t('common.edit')}>
                  <Edit size={16} />
                </button>
              </div>
            )}
          />
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t('teacher.edit') : t('teacher.add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('teacher.nom')}</label>
            <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('teacher.prenom')}</label>
            <input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('teacher.mobile')}</label>
            <input type="text" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required={!editId} placeholder="exemple@email.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} placeholder="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green" />
          </div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition">
            {t('common.save')}
          </button>
        </form>
      </Modal>

      <Modal open={courseModalOpen} onClose={() => setCourseModalOpen(false)} title={`${t('teacher.assignCourses')} - ${selectedTeacher?.nom ?? ''} ${selectedTeacher?.prenom ?? ''}`}>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {allCourses.map((c) => (
            <label key={c.idCours} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCourseIds.includes(c.idCours)}
                onChange={() => toggleCourseId(c.idCours)}
                className="rounded border-gray-300 text-cameroon-green focus:ring-cameroon-green"
              />
              <span className="text-sm">{c.libelle}</span>
            </label>
          ))}
          {allCourses.length === 0 && <p className="text-sm text-gray-400">{t('common.noData')}</p>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setCourseModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
            {t('common.cancel')}
          </button>
          <button onClick={handleCourseAssign} className="flex-1 py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition">
            {t('common.save')}
          </button>
        </div>
      </Modal>

      <Modal open={classModalOpen} onClose={() => setClassModalOpen(false)} title={`${t('teacher.assignClass')} - ${selectedTeacher?.nom ?? ''} ${selectedTeacher?.prenom ?? ''}`}>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="class"
              checked={selectedClassId === null}
              onChange={() => setSelectedClassId(null)}
              className="border-gray-300 text-cameroon-green focus:ring-cameroon-green"
            />
            <span className="text-sm text-gray-500">{t('teacher.noClass')}</span>
          </label>
          {allClasses.map((c) => (
            <label key={c.idClasse} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="class"
                checked={selectedClassId === c.idClasse}
                onChange={() => setSelectedClassId(c.idClasse)}
                className="border-gray-300 text-cameroon-green focus:ring-cameroon-green"
              />
              <span className="text-sm">{c.libelle}</span>
            </label>
          ))}
          {allClasses.length === 0 && <p className="text-sm text-gray-400">{t('common.noData')}</p>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setClassModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
            {t('common.cancel')}
          </button>
          <button onClick={handleClassAssign} className="flex-1 py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition">
            {t('common.save')}
          </button>
        </div>
      </Modal>
    </div>
  )
}
