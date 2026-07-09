import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { messageAPI, contactAPI } from '../../services/api'
import { Message } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { Plus, Send, Users, UserCheck } from 'lucide-react'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

type RecipientType = 'specific_parent' | 'specific_teacher' | 'all_parents' | 'all_teachers' | 'all'

const RECIPIENT_OPTIONS: { value: RecipientType; label: string }[] = [
  { value: 'specific_parent', label: 'Parent spécifique' },
  { value: 'specific_teacher', label: 'Enseignant spécifique' },
  { value: 'all_parents', label: 'Tous les parents' },
  { value: 'all_teachers', label: 'Tous les enseignants' },
  { value: 'all', label: 'Tous (parents + enseignants)' },
]

export default function MessagePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [recipientType, setRecipientType] = useState<RecipientType>('specific_parent')
  const [contacts, setContacts] = useState<{ idPers: number; nom: string; prenom: string; role: string }[]>([])
  const [form, setForm] = useState({ idExp_Pers: user?.idPers || 1, idParent: 0, objet: '', information: '' })

  const parents = contacts.filter(c => c.role === 'parent')
  const teachers = contacts.filter(c => c.role === 'teacher')

  const load = () => {
    setLoading(true)
    let msgPromise
    if (user?.typePersonne === 2) {
      msgPromise = messageAPI.getForUser('teacher', user.idPers)
    } else if (user?.typePersonne === 3) {
      msgPromise = messageAPI.getForUser('parent', user.idPers)
    } else {
      msgPromise = messageAPI.getAll()
    }
    Promise.all([
      msgPromise,
      contactAPI.getAll(),
    ]).then(([msgRes, contactRes]) => {
      setMessages(msgRes.data)
      setContacts(contactRes.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [user])

  if (loading) return <LoadingSkeleton rows={5} />

  const columns = [
    { key: 'objet', label: t('message.objet'), render: (m: Message) => <span className="font-medium">{m.objet}</span> },
    {
      key: 'idExp_Pers', label: t('message.from'), render: (m: Message) => {
        const p = contacts.find((u) => u.idPers === m.idExp_Pers)
        return p ? `${p.nom} ${p.prenom}` : '-'
      }
    },
    {
      key: 'idParent', label: 'Destinataire', render: (m: Message) => {
        if (m.receiverLabel) return m.receiverLabel
        const p = contacts.find((u) => u.idPers === m.idParent)
        return p ? `${p.nom} ${p.prenom}` : '-'
      }
    },
    { key: 'created_at', label: t('message.date'), render: (m: Message) => formatDate(m.created_at) },
    { key: 'information', label: t('message.information'), render: (m: Message) => (
      <span className="text-gray-500 text-xs truncate block max-w-xs">{m.information}</span>
    )},
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.objet || !form.information) return
    try {
      if (recipientType === 'all_parents' || recipientType === 'all_teachers' || recipientType === 'all') {
        const target = recipientType === 'all_parents' ? 'parents' : recipientType === 'all_teachers' ? 'teachers' : 'all'
        const res = await messageAPI.broadcast({ idExp_Pers: form.idExp_Pers, objet: form.objet, information: form.information, target })
        toast.success(`${res.data.count} message(s) envoyé(s)`)
      } else {
        if (!form.idParent) { toast.error('Sélectionnez un destinataire'); return }
        const recipient = recipientsList.find((r) => r.idPers === form.idParent)
        await messageAPI.send({
          ...form,
          receiverRole: recipientType === 'specific_parent' ? 'parent' : 'teacher',
          receiverId: form.idParent,
          receiverLabel: recipient ? `${recipient.nom} ${recipient.prenom}` : undefined,
        })
        toast.success(t('toast.saved'))
      }
      setComposeOpen(false)
      setForm({ idExp_Pers: user?.idPers || 1, idParent: 0, objet: '', information: '' })
      load()
    } catch {
      toast.error(t('toast.error'))
    }
  }

  const recipientsList = recipientType === 'specific_parent'
    ? parents
    : recipientType === 'specific_teacher'
      ? teachers
      : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('message.title')}</h1>
        {user?.typePersonne === 1 && (
          <button onClick={() => setComposeOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm">
            <Plus size={16} /> {t('message.compose')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border p-5">
        <DataTable columns={columns} data={messages} rowId={(r) => r.idMessages} />
      </div>

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title={t('message.compose')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Destinataire</label>
            <select value={recipientType} onChange={(e) => { setRecipientType(e.target.value as RecipientType); setForm({ ...form, idParent: 0 }) }} className="w-full px-3 py-2 border rounded-lg text-sm">
              {RECIPIENT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {(recipientType === 'specific_parent' || recipientType === 'specific_teacher') && (
            <div>
              <label className="block text-sm font-medium mb-1">{recipientType === 'specific_parent' ? 'Parent' : 'Enseignant'}</label>
              <select value={form.idParent} onChange={(e) => setForm({ ...form, idParent: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value={0}>--</option>
                {recipientsList.map((r) => (
                  <option key={r.idPers} value={r.idPers}>{r.nom} {r.prenom}</option>
                ))}
              </select>
            </div>
          )}

          {(recipientType === 'all_parents' || recipientType === 'all_teachers' || recipientType === 'all') && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm">
              <Users size={16} />
              <span>Ce message sera envoyé à {recipientType === 'all_parents' ? 'tous les parents' : recipientType === 'all_teachers' ? 'tous les enseignants' : 'tous les parents et enseignants'}</span>
            </div>
          )}

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
