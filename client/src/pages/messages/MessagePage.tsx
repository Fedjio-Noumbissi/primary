import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { messageAPI } from '../../services/api'
import { Message, User } from '../../types'
import { mockUsers } from '../../services/mockData'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { Plus, Send } from 'lucide-react'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function MessagePage() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [form, setForm] = useState({ idExp_Pers: 1, idParent: 1, objet: '', information: '' })

  const load = () => { setLoading(true); messageAPI.getAll().then((res) => { setMessages(res.data); setLoading(false) }) }
  useEffect(() => { load() }, [])

  if (loading) return <LoadingSkeleton rows={5} />

  const columns = [
    { key: 'objet', label: t('message.objet'), render: (m: Message) => <span className="font-medium">{m.objet}</span> },
    { key: 'idExp_Pers', label: t('message.from'), render: (m: Message) => {
      const u = mockUsers.find((u) => u.idPers === m.idExp_Pers)
      return u ? `${u.nom} ${u.prenom}` : '-'
    }},
    { key: 'created_at', label: t('message.date'), render: (m: Message) => formatDate(m.created_at) },
    { key: 'information', label: t('message.information'), render: (m: Message) => (
      <span className="text-gray-500 text-xs truncate block max-w-xs">{m.information}</span>
    )},
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('message.title')}</h1>
        <button onClick={() => setComposeOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm">
          <Plus size={16} /> {t('message.compose')}
        </button>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <DataTable columns={columns} data={messages} />
      </div>

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title={t('message.compose')}>
        <form onSubmit={async (e) => { e.preventDefault(); await messageAPI.send(form); toast.success(t('toast.saved')); setComposeOpen(false); setForm({ idExp_Pers: 1, idParent: 1, objet: '', information: '' }); load() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('message.from')}</label><select value={form.idExp_Pers} onChange={(e) => setForm({ ...form, idExp_Pers: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm">{mockUsers.filter((u) => u.typePersonne <= 2).map((u) => <option key={u.idPers} value={u.idPers}>{u.nom} {u.prenom}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">{t('message.objet')}</label><input type="text" value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('message.information')}</label><textarea value={form.information} onChange={(e) => setForm({ ...form, information: e.target.value })} required rows={4} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
            <Send size={16} /> {t('message.send')}
          </button>
        </form>
      </Modal>
    </div>
  )
}
