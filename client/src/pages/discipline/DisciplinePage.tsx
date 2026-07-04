import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mockStudents } from '../../services/mockData'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DisciplinePage() {
  const { t } = useTranslation()
  const [events, setEvents] = useState<{ id: number; matricule: number; libelle: string; points: number; date: string }[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ matricule: 0, libelle: '', points: 0 })

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
        <form onSubmit={(e) => { e.preventDefault(); setEvents([...events, { ...form, id: Date.now(), date: new Date().toISOString() }]); toast.success(t('toast.saved')); setModal(false); setForm({ matricule: 0, libelle: '', points: 0 }) }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('discipline.student')}</label><select value={form.matricule} onChange={(e) => setForm({ ...form, matricule: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{mockStudents.filter((s) => s.actif).map((s) => <option key={s.matricule} value={s.matricule}>{s.nom} {s.prenom}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">{t('discipline.event')}</label><input type="text" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('discipline.points')} (positif = pénalité, négatif = bonus)</label><input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}
