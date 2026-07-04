import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REGIONS } from '../../utils/constants'
import { mockAnnees, mockModes } from '../../services/mockData'
import toast from 'react-hot-toast'
import { Save, UserPlus } from 'lucide-react'
import Modal from '../../components/Modal'

export default function SettingsPage() {
  const { t } = useTranslation()
  const [school, setSchool] = useState({ name: 'Groupe Scolaire Bilingue Les Anges', address: 'Yaoundé, Centre', region: 'Centre', phone: '677000000', email: 'contact@gsba.cm' })
  const [modeModal, setModeModal] = useState(false)
  const [modeForm, setModeForm] = useState({ libelle: '' })

  const handleSchoolSave = () => {
    toast.success(t('toast.saved'))
  }

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
            <UserPlus size={18} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {mockModes.map((m) => (
            <span key={m.idMode} className="px-3 py-1.5 bg-gray-50 rounded-lg text-sm">{m.libelle}</span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t('settings.academicYear')}</h3>
        </div>
        <div className="flex gap-3">
          {mockAnnees.map((a) => (
            <button key={a.idAnnee} className={`px-4 py-2 rounded-lg text-sm font-medium border ${a.idAnnee === 2 ? 'bg-cameroon-green text-white border-cameroon-green' : 'bg-white text-gray-600 border-gray-300'}`}>
              {a.libelle}
            </button>
          ))}
        </div>
      </div>

      <Modal open={modeModal} onClose={() => setModeModal(false)} title={t('settings.paymentModes')}>
        <form onSubmit={(e) => { e.preventDefault(); toast.success(t('toast.saved')); setModeModal(false); setModeForm({ libelle: '' }) }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Libellé</label><input type="text" value={modeForm.libelle} onChange={(e) => setModeForm({ ...modeForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}