import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { libraryAPI } from '../../services/api'
import { Livre, Specialite } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { Plus } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function LibraryPage() {
  const { t } = useTranslation()
  const [livres, setLivres] = useState<Livre[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ titre: '', auteurs: '', prix: 0, idSpecialite: 0, edition: '', totalCopie: 1 })

  const load = () => {
    setLoading(true)
    Promise.all([libraryAPI.getLivres(), libraryAPI.getSpecialites()])
      .then(([l, s]) => { setLivres(l.data); setSpecialites(s.data); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  if (loading) return <LoadingSkeleton rows={5} />

  const columns = [
    { key: 'titre', label: t('library.titre'), render: (l: Livre) => <span className="font-medium">{l.titre}</span> },
    { key: 'auteurs', label: t('library.auteurs') },
    { key: 'prix', label: t('library.prix'), render: (l: Livre) => formatCurrency(l.prix) },
    { key: 'edition', label: t('library.edition') },
    { key: 'totalCopie', label: t('library.copies') },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('library.title')}</h1>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm">
          <Plus size={16} /> {t('library.add')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {specialites.map((s) => (
          <span key={s.idSpecialite} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">{s.libelle}</span>
        ))}
      </div>

      {loading ? <LoadingSkeleton /> : (
        <div className="bg-white rounded-xl border p-5">
          <DataTable columns={columns} data={livres} />
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={t('library.add')}>
        <form onSubmit={async (e) => { e.preventDefault(); await libraryAPI.createLivre(form); toast.success(t('toast.saved')); setModal(false); setForm({ titre: '', auteurs: '', prix: 0, idSpecialite: 0, edition: '', totalCopie: 1 }); load() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('library.titre')}</label><input type="text" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('library.auteurs')}</label><input type="text" value={form.auteurs} onChange={(e) => setForm({ ...form, auteurs: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">{t('library.prix')}</label><input type="number" min={0} value={form.prix || ''} onChange={(e) => setForm({ ...form, prix: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">{t('library.copies')}</label><input type="number" min={1} value={form.totalCopie} onChange={(e) => setForm({ ...form, totalCopie: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">{t('library.specialite')}</label><select value={form.idSpecialite} onChange={(e) => setForm({ ...form, idSpecialite: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm">{specialites.map((s) => <option key={s.idSpecialite} value={s.idSpecialite}>{s.libelle}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">{t('library.edition')}</label><input type="text" value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}
