import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { userAPI } from '../../services/api'
import { User } from '../../types'
import DataTable from '../../components/DataTable'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import { Plus, Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [filter, setFilter] = useState<number | null>(null)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '', mobile: '', typePersonne: 3 as 1 | 2 | 3 })

  const load = () => {
    setLoading(true)
    userAPI.getAll().then((res) => { setUsers(res.data); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editId) await userAPI.update(editId, form)
      else await userAPI.create(form)
      toast.success(t('toast.saved'))
      setModalOpen(false)
      setForm({ nom: '', prenom: '', email: '', password: '', mobile: '', typePersonne: 3 })
      setEditId(null)
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const handleToggleActive = async (id: number) => {
    try {
      await userAPI.toggleActive(id)
      load()
      toast.success(t('toast.saved'))
    } catch { toast.error(t('toast.error')) }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await userAPI.delete(id)
      load()
      toast.success(t('toast.deleted'))
    } catch { toast.error(t('toast.error')) }
  }

  const openEdit = (u: User) => {
    setForm({ nom: u.nom, prenom: u.prenom, email: u.email, password: '', mobile: u.mobile, typePersonne: u.typePersonne as 1 | 2 | 3 })
    setEditId(u.idPers)
    setModalOpen(true)
  }

  const typeLabel = (v: number) => {
    if (v === 1) return t('auth.admin')
    if (v === 2) return t('auth.teacher')
    return t('auth.parent')
  }

  const filtered = filter ? users.filter((u) => u.typePersonne === filter) : users

  const columns = [
    { key: 'nom', label: t('user.nom'), render: (u: User) => <span className="font-medium">{u.nom} {u.prenom}</span> },
    { key: 'email', label: t('user.email') },
    { key: 'mobile', label: t('user.mobile') },
    { key: 'typePersonne', label: t('user.type'), render: (u: User) => <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{typeLabel(u.typePersonne)}</span> },
    { key: 'actif', label: t('common.status'), render: (u: User) => (
      <span className={`text-xs px-2 py-0.5 rounded ${u.actif ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        {u.actif ? t('common.active') : t('common.inactive')}
      </span>
    )},
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('user.title')}</h1>
        <button
          onClick={() => { setForm({ nom: '', prenom: '', email: '', password: '', mobile: '', typePersonne: 3 }); setEditId(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition"
        >
          <Plus size={16} /> {t('user.add')}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { v: null, l: t('user.allUsers') },
          { v: 1, l: t('user.admins') },
          { v: 2, l: t('user.teachers') },
          { v: 3, l: t('user.parents') },
        ].map((opt) => (
          <button
            key={String(opt.v)}
            onClick={() => setFilter(opt.v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
              filter === opt.v
                ? 'bg-cameroon-green text-white border-cameroon-green'
                : 'bg-white text-gray-600 border-gray-300 hover:border-cameroon-green'
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {loading ? <LoadingSkeleton /> : (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <DataTable
            columns={columns}
            data={filtered}
            actions={(u: User) => (
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => handleToggleActive(u.idPers)}
                  className={`p-1.5 hover:bg-gray-100 rounded ${u.actif ? 'text-amber-600' : 'text-green-600'}`}
                  title={t('user.toggleActive')}
                >
                  {u.actif ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-gray-100 rounded text-blue-600" title={t('common.edit')}>
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(u.idPers)} className="p-1.5 hover:bg-gray-100 rounded text-red-500" title={t('common.delete')}>
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          />
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t('user.edit') : t('user.add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('user.nom')}</label>
              <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('user.prenom')}</label>
              <input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('user.email')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('user.password')}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('user.mobile')}</label>
            <input type="text" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('user.type')}</label>
            <select value={form.typePersonne} onChange={(e) => setForm({ ...form, typePersonne: parseInt(e.target.value) as 1 | 2 | 3 })} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value={1}>{t('auth.admin')}</option>
              <option value={2}>{t('auth.teacher')}</option>
              <option value={3}>{t('auth.parent')}</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">
            {t('common.save')}
          </button>
        </form>
      </Modal>
    </div>
  )
}