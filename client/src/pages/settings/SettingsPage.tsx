import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REGIONS } from '../../utils/constants'
import { paymentAPI, classAPI, academicAPI } from '../../services/api'
import { Mode, AnneeAcademique } from '../../types'
import toast from 'react-hot-toast'
import { Save, Plus, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal'
import LoadingSkeleton from '../../components/LoadingSkeleton'

export default function SettingsPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [school, setSchool] = useState({ name: '', address: '', region: '', phone: '', email: '' })
  const [modes, setModes] = useState<Mode[]>([])
  const [annees, setAnnees] = useState<AnneeAcademique[]>([])
  const [modeModal, setModeModal] = useState(false)
  const [modeForm, setModeForm] = useState({ libelle: '' })

  useEffect(() => {
    Promise.all([
      fetch('/api/school-info').then(r => r.json()),
      paymentAPI.getModes(),
      academicAPI.getAnnees(),
    ]).then(([schoolData, modesRes, anneesRes]) => {
      setSchool(schoolData)
      setModes(modesRes.data)
      setAnnees(anneesRes.data)
      setLoading(false)
    })
  }, [])

  const handleSchoolSave = async () => {
    await fetch('/api/school-info', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(school) })
    toast.success(t('toast.saved'))
  }

  const handleAddMode = async (e: React.FormEvent) => {
    e.preventDefault()
    await paymentAPI.createMode(modeForm)
    const res = await paymentAPI.getModes()
    setModes(res.data)
    toast.success(t('toast.saved'))
    setModeModal(false)
    setModeForm({ libelle: '' })
  }

  const handleDeleteMode = async (id: number) => {
    if (!confirm('Supprimer ce mode de paiement ?')) return
    await paymentAPI.deleteMode(id)
    setModes((prev) => prev.filter((m) => m.idMode !== id))
    toast.success(t('toast.deleted'))
  }

  const handleSetActive = async (id: number) => {
    await academicAPI.setActiveAnnee(id)
    const res = await academicAPI.getAnnees()
    setAnnees(res.data)
    toast.success(t('toast.saved'))
  }

  if (loading) return <LoadingSkeleton rows={4} />

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">{t('settings.title')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.schoolName')}</label>
            <input type="text" value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.address')}</label>
            <input type="text" value={school.address} onChange={(e) => setSchool({ ...school, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.region')}</label>
            <select value={school.region} onChange={(e) => setSchool({ ...school, region: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
              {REGIONS.map((r) => <option key={r.fr} value={r.fr}>{r.fr}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.phone')}</label>
            <input type="text" value={school.phone} onChange={(e) => setSchool({ ...school, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.email')}</label>
            <input type="email" value={school.email} onChange={(e) => setSchool({ ...school, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
        <button onClick={handleSchoolSave} className="mt-4 flex items-center gap-2 px-6 py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition">
          <Save size={16} /> {t('settings.save')}
        </button>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t('settings.paymentModes')}</h3>
          <button onClick={() => setModeModal(true)} className="p-1.5 hover:bg-gray-100 rounded text-cameroon-green">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {modes.filter((m) => m.actif).map((m) => (
            <span key={m.idMode} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
              {m.libelle}
              <button onClick={() => handleDeleteMode(m.idMode)} className="text-gray-400 hover:text-red-500 transition">
                <Trash2 size={12} />
              </button>
            </span>
          ))}
          {modes.filter((m) => m.actif).length === 0 && (
            <p className="text-sm text-gray-400 italic">{t('common.noData')}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t('settings.academicYear')}</h3>
        </div>
        <div className="flex gap-3 flex-wrap">
          {annees.map((a) => (
            <button key={a.idAnnee} onClick={() => handleSetActive(a.idAnnee)} className={`px-4 py-2 rounded-lg text-sm font-medium border ${a.actif ? 'bg-cameroon-green text-white border-cameroon-green' : 'bg-white text-gray-600 border-gray-300 hover:border-cameroon-green'}`}>
              {a.libelle}
            </button>
          ))}
        </div>
      </div>

      <Modal open={modeModal} onClose={() => setModeModal(false)} title={t('settings.paymentModes')}>
        <form onSubmit={handleAddMode} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Libellé</label><input type="text" value={modeForm.libelle} onChange={(e) => setModeForm({ ...modeForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}