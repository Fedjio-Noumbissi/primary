import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { disciplineAPI } from '../../services/api'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DisciplinePage() {
  const { t } = useTranslation()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ matricule: 0, libelle: '', points: 0 })

  useEffect(() => {
    disciplineAPI.getAll().then((res) => { setEvents(res.data); setLoading(false) })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await disciplineAPI.create(form)
      setEvents((prev) => [res.data, ...prev])
      toast.success(t('toast.saved'))
      setModal(false)
      setForm({ matricule: 0, libelle: '', points: 0 })
    } catch {
      toast.error(t('toast.error'))
    }
  }

  if (loading) return <LoadingSkeleton rows={4} />

  const columns = [
    { key: 'matricule', label: t('discipline.student'), render: (e: any) => {
      const s = mockStudents.find((st) => st.matricule === e.matricule)
      return s ? `${s.nom} ${s.prenom}` : `#${e.matricule}`
    }},
    { key: 'libelle', label: t('discipline.event') },
    { key: 'points', label: t('discipline.points'), render: (e: any) => (
      <span className={`font-semibold ${e.points > 0 ? 'text-red-500' : 'text-green-500'}`}>{e.points > 0 ? `-${e.points}` : `+${Math.abs(e.points)}`}</span>
    )},
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
        <DataTable columns={columns} data={events} />
        {events.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">{t('common.noData')}</p>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={t('discipline.add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('discipline.student')}</label><select value={form.matricule} onChange={(e) => setForm({ ...form, matricule: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{events.map((e: any) => <option key={e.matricule} value={e.matricule}>{e.nom} {e.prenom}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">{t('discipline.event')}</label><input type="text" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('discipline.points')} (positif = pénalité, négatif = bonus)</label><input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}
