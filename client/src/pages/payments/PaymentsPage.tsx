import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { paymentAPI } from '../../services/api'
import { Scolarite, Tranche, Mode, Paiement } from '../../types'
import { mockStudents, mockAnnees } from '../../services/mockData'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { Plus, Printer } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { PAYMENT_METHODS } from '../../utils/constants'
import toast from 'react-hot-toast'

export default function PaymentsPage() {
  const { t } = useTranslation()
  const [scolarites, setScolarites] = useState<Scolarite[]>([])
  const [tranches, setTranches] = useState<Tranche[]>([])
  const [modes, setModes] = useState<Mode[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [paieModal, setPaieModal] = useState(false)
  const [paieForm, setPaieForm] = useState({ matricule: 0, idAca: 2, montant: 0, idMode: 1, datePaie: '' })

  const load = () => {
    setLoading(true)
    Promise.all([paymentAPI.getScolarites(), paymentAPI.getTranches(), paymentAPI.getModes(), paymentAPI.getPaiements()])
      .then(([sc, tr, mo, pa]) => { setScolarites(sc.data); setTranches(tr.data); setModes(mo.data); setPaiements(pa.data); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  if (loading) return <LoadingSkeleton rows={6} />

  const columns = [
    { key: 'nom', label: t('student.nom'), render: (p: Paiement) => <span className="font-medium">{p.nom} {p.prenom}</span> },
    { key: 'montant', label: t('payment.montant'), render: (p: Paiement) => <span className="font-semibold text-cameroon-green">{formatCurrency(p.montant)}</span> },
    { key: 'mode', label: t('payment.mode') },
    { key: 'datePaie', label: t('payment.date'), render: (p: Paiement) => formatDate(p.datePaie) },
  ]

  const openReceipt = (id: number) => {
    window.open(`/api/paiements/${id}/receipt`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('payment.title')}</h1>
        <button onClick={() => setPaieModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition">
          <Plus size={16} /> {t('payment.receive')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">{t('payment.tuition')}</h3>
          {scolarites.map((s) => (
            <div key={s.idScolante} className="px-3 py-2 bg-gray-50 rounded-lg text-sm mb-2">
              <p className="font-medium">{t('payment.inscription')}: {formatCurrency(s.inscription)}</p>
              <p>{t('payment.pension')}: {formatCurrency(s.pension)}</p>
              <p className="text-xs text-gray-400">{s.nbreTranche} tranches</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">{t('payment.mode')}</h3>
          <div className="flex flex-wrap gap-2">
            {modes.map((m) => (
              <span key={m.idMode} className="px-3 py-1.5 bg-gray-50 rounded-lg text-sm">{m.libelle}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">{t('payment.tranche')}</h3>
          {tranches.map((t) => (
            <div key={t.idTranche} className="px-3 py-2 bg-gray-50 rounded-lg text-sm mb-2 flex items-center justify-between">
              <span>{t.libelle}</span>
              <span className="font-medium">{formatCurrency(t.montant)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-4">{t('payment.history')}</h3>
        <DataTable
          columns={columns}
          data={paiements}
          actions={(p: Paiement) => (
            <button onClick={() => openReceipt(p.idPaie)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-cameroon-green/10 text-cameroon-green rounded-lg hover:bg-cameroon-green/20 transition" title={t('payment.receipt')}>
              <Printer size={14} />
              Reçu
            </button>
          )}
        />
      </div>

      <Modal open={paieModal} onClose={() => setPaieModal(false)} title={t('payment.receive')}>
        <form onSubmit={async (e) => { e.preventDefault(); await paymentAPI.createPaiement(paieForm); toast.success(t('toast.saved')); setPaieModal(false); setPaieForm({ matricule: 0, idAca: 2, montant: 0, idMode: 1, datePaie: '' }); load() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('student.nom')}</label><select value={paieForm.matricule} onChange={(e) => setPaieForm({ ...paieForm, matricule: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{mockStudents.filter((s) => s.actif).map((s) => <option key={s.matricule} value={s.matricule}>{s.nom} {s.prenom}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">{t('payment.montant')}</label><input type="number" min={0} value={paieForm.montant || ''} onChange={(e) => setPaieForm({ ...paieForm, montant: parseFloat(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('payment.mode')}</label><select value={paieForm.idMode} onChange={(e) => setPaieForm({ ...paieForm, idMode: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm">{modes.map((m) => <option key={m.idMode} value={m.idMode}>{m.libelle}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">{t('payment.date')}</label><input type="date" value={paieForm.datePaie} onChange={(e) => setPaieForm({ ...paieForm, datePaie: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('academic.title')}</label><select value={paieForm.idAca} onChange={(e) => setPaieForm({ ...paieForm, idAca: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm">{mockAnnees.map((a) => <option key={a.idAnnee} value={a.idAnnee}>{a.libelle}</option>)}</select></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}
