import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { disciplineAPI, studentAPI, classAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Student } from '../../types'

export default function DisciplinePage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isFr = i18n.language === 'fr'
  const [events, setEvents] = useState<any[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [cycles, setCycles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ matricule: 0, libelle: '', points: '', commentaire: '' })
  const [filterClasse, setFilterClasse] = useState('')

  useEffect(() => {
    Promise.all([
      disciplineAPI.getAll(),
      studentAPI.getAll(),
      classAPI.getClasses(),
      classAPI.getCycles(),
    ]).then(([evRes, stRes, cRes, cyRes]) => {
      setEvents(evRes.data)
      setStudents(stRes.data)
      setClasses(cRes.data)
      setCycles(cyRes.data)
      setLoading(false)
    }).catch(() => {
      disciplineAPI.getAll().then((res) => {
        setEvents(res.data)
        setLoading(false)
      })
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.matricule) {
      toast.error(t('discipline.selectStudent'))
      return
    }
    try {
      const res = await disciplineAPI.create({
        ...form,
        points: parseInt(form.points) || 0,
        idPers: user?.idPers,
        event_date: new Date().toISOString().slice(0, 10),
      })
      setEvents((prev) => [res.data, ...prev])
      toast.success(t('toast.saved'))
      setModal(false)
      setForm({ matricule: 0, libelle: '', points: '', commentaire: '' })
    } catch {
      toast.error(t('toast.error'))
    }
  }

  const activeCycleIds = new Set(cycles.map(c => c.idCycle))
  const cycleOrder = Object.fromEntries(cycles.map((c, i) => [c.idCycle, i]))
  const visibleClasses = classes.filter(c => activeCycleIds.has(c.idCycle))
    .sort((a, b) => (cycleOrder[a.idCycle] ?? 0) - (cycleOrder[b.idCycle] ?? 0) || a.idClasse - b.idClasse)

  if (loading) return <LoadingSkeleton rows={4} />

  const columns = [
    { key: 'matricule', label: t('discipline.student'), render: (e: any) => {
      const s = students.find((st) => st.matricule === e.matricule)
      return s ? `${s.nom} ${s.prenom}` : `#${e.matricule}`
    }},
    { key: 'libelle', label: t('discipline.event') },
    { key: 'points', label: t('discipline.points'), render: (e: any) => (
      <span className={`font-semibold ${e.points > 0 ? 'text-green-500' : 'text-red-500'}`}>{e.points > 0 ? `+${e.points}` : e.points}</span>
    )},
    { key: 'commentaire', label: t('discipline.comment') },
    { key: 'event_date', label: t('discipline.date') },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('discipline.title')}</h1>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm">
          <Plus size={16} /> {t('discipline.add')}
        </button>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <DataTable columns={columns} data={events} rowId={(r: any) => r.idRap} />
        {events.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">{t('common.noData')}</p>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={t('discipline.add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('student.classe')}</label>
            <select value={filterClasse} onChange={(e) => { setFilterClasse(e.target.value); setForm(f => ({ ...f, matricule: 0 })) }} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">{isFr ? 'Toutes les classes' : 'All classes'}</option>
              {visibleClasses.map(cl => (
                <option key={cl.idClasse} value={cl.libelle}>{cl.libelle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('discipline.student')}</label>
            <select
              value={form.matricule}
              onChange={(e) => setForm({ ...form, matricule: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value={0}>--</option>
              {students.filter((s: any) => !filterClasse || s.classe === filterClasse).map((s) => (
                <option key={s.matricule} value={s.matricule}>{s.nom} {s.prenom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('discipline.event')}</label>
            <input
              type="text"
              value={form.libelle}
              onChange={(e) => setForm({ ...form, libelle: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('discipline.points')}</label>
            <input
              type="number"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('discipline.comment')}</label>
            <textarea
              value={form.commentaire}
              onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={3}
            />
          </div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">
            {t('common.save')}
          </button>
        </form>
      </Modal>
    </div>
  )
}
