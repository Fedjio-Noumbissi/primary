import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { academicAPI } from '../../services/api'
import { AnneeAcademique, Trimestre, Session } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AcademicPage() {
  const { t } = useTranslation()
  const [annees, setAnnees] = useState<AnneeAcademique[]>([])
  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [anneeModal, setAnneeModal] = useState(false); const [trimModal, setTrimModal] = useState(false); const [sessModal, setSessModal] = useState(false)
  const [anneeForm, setAnneeForm] = useState({ libelle: '', periode: '' })
  const [trimForm, setTrimForm] = useState({ libelle: '', periode: '', idAca: 0 })
  const [sessForm, setSessForm] = useState({ libelle: '', idTrimestre: 0 })

  const load = () => {
    setLoading(true)
    Promise.all([academicAPI.getAnnees(), academicAPI.getTrimestres(), academicAPI.getSessions()])
      .then(([a, t, s]) => { setAnnees(a.data); setTrimestres(t.data); setSessions(s.data); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  if (loading) return <LoadingSkeleton rows={6} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{t('academic.title')}</h1></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t('academic.title')}</h3>
            <button onClick={() => setAnneeModal(true)} className="p-1.5 hover:bg-gray-100 rounded text-cameroon-green"><Plus size={18} /></button>
          </div>
          <div className="space-y-2">
            {annees.map((a) => (
              <div key={a.idAnnee} className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{a.libelle}</p>
                <p className="text-xs text-gray-400">{a.periode}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t('academic.trimestre')}</h3>
            <button onClick={() => setTrimModal(true)} className="p-1.5 hover:bg-gray-100 rounded text-cameroon-green"><Plus size={18} /></button>
          </div>
          <div className="space-y-2">
            {trimestres.map((t) => (
              <div key={t.idTrimes} className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{t.libelle}</p>
                <p className="text-xs text-gray-400">{t.periode} • {t.idAca}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t('academic.session')}</h3>
            <button onClick={() => setSessModal(true)} className="p-1.5 hover:bg-gray-100 rounded text-cameroon-green"><Plus size={18} /></button>
          </div>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.idSession} className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{s.libelle}</p>
                <p className="text-xs text-gray-400">{s.sessTrim}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={anneeModal} onClose={() => setAnneeModal(false)} title={t('academic.add')}>
        <form onSubmit={async (e) => { e.preventDefault(); await academicAPI.createAnnee(anneeForm); toast.success(t('toast.saved')); setAnneeModal(false); setAnneeForm({ libelle: '', periode: '' }); load() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('academic.libelle')}</label><input type="text" value={anneeForm.libelle} onChange={(e) => setAnneeForm({ ...anneeForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('academic.periode')}</label><input type="text" value={anneeForm.periode} onChange={(e) => setAnneeForm({ ...anneeForm, periode: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={trimModal} onClose={() => setTrimModal(false)} title={t('academic.addTrimestre')}>
        <form onSubmit={async (e) => { e.preventDefault(); await academicAPI.createTrimestre(trimForm); toast.success(t('toast.saved')); setTrimModal(false); setTrimForm({ libelle: '', periode: '', idAca: 0 }); load() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('academic.libelle')}</label><input type="text" value={trimForm.libelle} onChange={(e) => setTrimForm({ ...trimForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('academic.periode')}</label><input type="text" value={trimForm.periode} onChange={(e) => setTrimForm({ ...trimForm, periode: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('academic.title')}</label><select value={trimForm.idAca} onChange={(e) => setTrimForm({ ...trimForm, idAca: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{annees.map((a) => <option key={a.idAnnee} value={a.idAnnee}>{a.libelle}</option>)}</select></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={sessModal} onClose={() => setSessModal(false)} title={t('academic.addSession')}>
        <form onSubmit={async (e) => { e.preventDefault(); await academicAPI.createSession(sessForm); toast.success(t('toast.saved')); setSessModal(false); setSessForm({ libelle: '', idTrimestre: 0 }); load() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('academic.libelle')}</label><input type="text" value={sessForm.libelle} onChange={(e) => setSessForm({ ...sessForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('academic.trimestre')}</label><select value={sessForm.idTrimestre} onChange={(e) => setSessForm({ ...sessForm, idTrimestre: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{trimestres.map((t) => <option key={t.idTrimes} value={t.idTrimes}>{t.libelle}</option>)}</select></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}
