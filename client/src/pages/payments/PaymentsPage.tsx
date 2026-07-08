import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { paymentAPI, classAPI, studentAPI, academicAPI } from '../../services/api'
import { Scolarite, Tranche, Mode, Paiement, Cycle, Student, AnneeAcademique } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { Plus, Printer, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function PaymentsPage() {
  const { t } = useTranslation()
  const [scolarites, setScolarites] = useState<Scolarite[]>([])
  const [tranches, setTranches] = useState<Tranche[]>([])
  const [modes, setModes] = useState<Mode[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [activeAnnee, setActiveAnnee] = useState<AnneeAcademique | null>(null)
  const [paieModal, setPaieModal] = useState(false)
  const [paieForm, setPaieForm] = useState({ matricule: 0, idAca: 0, montant: 0, idMode: 1, datePaie: '', idPers: 0 })
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentLabel, setSelectedStudentLabel] = useState('')

  const [cycles, setCycles] = useState<Cycle[]>([])
  const [tuitionModal, setTuitionModal] = useState(false)
  const [tuitionForm, setTuitionForm] = useState({
    inscription: 0,
    pension: 0,
    idCycle: 0,
    nbreTranche: 1,
  })
  const [trancheDates, setTrancheDates] = useState<string[]>([''])
  const [editingTuition, setEditingTuition] = useState<Scolarite | null>(null)

  const [modeModal, setModeModal] = useState(false)
  const [editingMode, setEditingMode] = useState<Mode | null>(null)
  const [modeLibelle, setModeLibelle] = useState('')

  const [editingTranche, setEditingTranche] = useState<Tranche | null>(null)
  const [trancheForm, setTrancheForm] = useState({ libelle: '', montant: 0, date_limite: '' })

  const load = () => {
    setLoading(true)
    Promise.all([
      paymentAPI.getScolarites(),
      paymentAPI.getTranches(),
      paymentAPI.getModes(),
      paymentAPI.getPaiements(),
      classAPI.getCycles(),
      studentAPI.getAll(),
      academicAPI.getAnnees(),
    ]).then(([sc, tr, mo, pa, cy, st, an]) => {
      setScolarites(sc.data)
      setTranches(tr.data)
      setModes(mo.data)
      setPaiements(pa.data)
      setCycles(cy.data)
      setStudents(st.data)
      const active = an.data.find((a: AnneeAcademique) => a.actif)
      setActiveAnnee(active || an.data[0] || null)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      setPaieForm(prev => ({ ...prev, idAca: active?.idAnnee || an.data[0]?.idAnnee || 0, idPers: user.idPers || 1 }))
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const openTuitionModal = () => {
    setEditingTuition(null)
    setTuitionForm({ inscription: 0, pension: 0, idCycle: 0, nbreTranche: 1 })
    setTrancheDates([''])
    setTuitionModal(true)
  }

  const openEditTuitionModal = (s: Scolarite) => {
    setEditingTuition(s)
    setTuitionForm({ inscription: s.inscription, pension: s.pension, idCycle: s.idCycle, nbreTranche: s.nbreTranche })
    setTrancheDates(Array.from({ length: s.nbreTranche }, (_, i) => ''))
    setTuitionModal(true)
  }

  const handleNbreTrancheChange = (n: number) => {
    setTuitionForm({ ...tuitionForm, nbreTranche: n })
    setTrancheDates(Array.from({ length: n }, (_, i) => trancheDates[i] || ''))
  }

  const handleTuitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tuitionForm.idCycle) { toast.error('Veuillez sélectionner un cycle'); return }
    const total = tuitionForm.inscription + tuitionForm.pension
    const montantParTranche = Math.round(total / tuitionForm.nbreTranche)
    const tranchesData = trancheDates.map((date, i) => ({
      libelle: `Tranche ${i + 1}`,
      montant: montantParTranche,
      date_limite: date,
    }))
    try {
      if (editingTuition) {
        await paymentAPI.updateScolarite(editingTuition.idScolarite, tuitionForm)
        toast.success(t('toast.saved'))
      } else {
        await paymentAPI.createScolariteWithTranches({
          inscription: tuitionForm.inscription,
          pension: tuitionForm.pension,
          nbreTranche: tuitionForm.nbreTranche,
          idCycle: tuitionForm.idCycle,
          tranches: tranchesData,
        })
        toast.success(t('toast.saved'))
      }
      setTuitionModal(false)
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const deleteScolarite = async (id: number) => {
    if (!confirm('Supprimer ces frais de scolarité ?')) return
    try {
      await paymentAPI.deleteScolarite(id)
      toast.success('Supprimé')
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const openModeModal = (m?: Mode) => {
    setEditingMode(m || null)
    setModeLibelle(m?.libelle || '')
    setModeModal(true)
  }

  const handleModeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modeLibelle.trim()) return
    try {
      if (editingMode) {
        await paymentAPI.updateMode(editingMode.idMode, { libelle: modeLibelle, actif: 1 })
      } else {
        await paymentAPI.createMode({ libelle: modeLibelle })
      }
      toast.success(t('toast.saved'))
      setModeModal(false)
      setEditingMode(null)
      setModeLibelle('')
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const deleteMode = async (id: number) => {
    if (!confirm('Supprimer ce mode de paiement ?')) return
    try {
      await paymentAPI.deleteMode(id)
      toast.success('Supprimé')
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const openTrancheModal = (t?: Tranche) => {
    setEditingTranche(t || null)
    setTrancheForm(t ? { libelle: t.libelle, montant: t.montant, date_limite: t.date_limite || '' } : { libelle: '', montant: 0, date_limite: '' })
  }

  const handleTrancheSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trancheForm.libelle.trim()) return
    try {
      if (editingTranche) {
        await paymentAPI.updateTranche(editingTranche.idTranche, trancheForm)
      }
      toast.success(t('toast.saved'))
      setEditingTranche(null)
      setTrancheForm({ libelle: '', montant: 0, date_limite: '' })
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const deleteTranche = async (id: number) => {
    if (!confirm('Supprimer cette tranche ?')) return
    try {
      await paymentAPI.deleteTranche(id)
      toast.success('Supprimé')
      load()
    } catch { toast.error(t('toast.error')) }
  }

  if (loading) return <LoadingSkeleton rows={6} />

  const columns = [
    { key: 'nom', label: t('student.nom'), render: (p: Paiement) => <span className="font-medium">{p.nom} {p.prenom}</span> },
    { key: 'montant', label: t('payment.montant'), render: (p: Paiement) => <span className="font-semibold text-cameroon-green">{formatCurrency(p.montant)}</span> },
    { key: 'mode', label: t('payment.mode') },
    { key: 'datePaie', label: t('payment.date'), render: (p: Paiement) => formatDate(p.datePaie) },
  ]

  const openPaieModal = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setPaieForm({ matricule: 0, idAca: activeAnnee?.idAnnee || 0, montant: 0, idMode: 1, datePaie: '', idPers: user.idPers || 1 })
    setStudentSearch('')
    setSelectedStudentLabel('')
    setPaieModal(true)
  }

  const openReceipt = (id: number) => {
    window.open(`/api/paiements/${id}/receipt`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('payment.title')}</h1>
        <div className="flex gap-2">
          <button onClick={openTuitionModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
            <Plus size={16} /> {t('payment.addTuition')}
          </button>
          <button onClick={openPaieModal} className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition">
            <Plus size={16} /> {t('payment.receive')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">{t('payment.tuition')}</h3>
          {scolarites.length === 0 && <p className="text-sm text-gray-400">{t('common.noData')}</p>}
          {scolarites.map((s) => (
            <div key={s.idScolarite} className="px-3 py-2 bg-gray-50 rounded-lg text-sm mb-2 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-xs text-gray-500 mb-1">{s.cycle || `Cycle #${s.idCycle}`}</p>
                  <p className="font-medium">{t('payment.inscription')}: {formatCurrency(s.inscription)}</p>
                  <p>{t('payment.pension')}: {formatCurrency(s.pension)}</p>
                  <p className="text-xs text-gray-400">{s.nbreTranche} tranche(s)</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEditTuitionModal(s)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Modifier"><Pencil size={14} /></button>
                  <button onClick={() => deleteScolarite(s.idScolarite)} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Supprimer"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t('payment.mode')}</h3>
            <button onClick={() => openModeModal()} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Ajouter"><Plus size={16} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {modes.filter(m => m.actif).map((m) => (
              <span key={m.idMode} className="group inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                {m.libelle}
                <button onClick={() => openModeModal(m)} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition" title="Modifier"><Pencil size={12} /></button>
                <button onClick={() => deleteMode(m.idMode)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition" title="Supprimer"><Trash2 size={12} /></button>
              </span>
            ))}
            {modes.filter(m => !m.actif).map((m) => (
              <span key={m.idMode} className="group inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 rounded-lg text-sm line-through text-gray-400">
                {m.libelle}
                <button onClick={() => openModeModal(m)} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition" title="Réactiver"><Pencil size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">{t('payment.tranche')}</h3>
          {tranches.length === 0 && <p className="text-sm text-gray-400">{t('common.noData')}</p>}
          {tranches.map((t) => (
            <div key={t.idTranche} className="px-3 py-2 bg-gray-50 rounded-lg text-sm mb-2 flex items-center justify-between group">
              <div className="flex-1">
                <span>{t.libelle}</span>
                {t.date_limite && <span className="text-xs text-gray-400 ml-2">limite: {formatDate(t.date_limite)}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(t.montant)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openTrancheModal(t)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Modifier"><Pencil size={12} /></button>
                  <button onClick={() => deleteTranche(t.idTranche)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Supprimer"><Trash2 size={12} /></button>
                </div>
              </div>
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
        <form onSubmit={async (e) => {
          e.preventDefault()
          if (!paieForm.matricule) { toast.error('Veuillez sélectionner un élève'); return }
          try {
            await paymentAPI.createPaiement(paieForm)
            toast.success(t('toast.saved'))
            setPaieModal(false)
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            setPaieForm({ matricule: 0, idAca: activeAnnee?.idAnnee || 0, montant: 0, idMode: 1, datePaie: '', idPers: user.idPers || 1 })
            setSelectedStudentLabel('')
            setStudentSearch('')
            load()
          } catch { toast.error(t('toast.error')) }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Élève</label>
            <input type="text" placeholder="Rechercher un élève..." value={studentSearch}
              onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudentLabel(''); setPaieForm({ ...paieForm, matricule: 0 }) }}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            {studentSearch && !selectedStudentLabel && (
              <div className="mt-1 max-h-40 overflow-y-auto border rounded-lg text-sm">
                {students
                  .filter(s => `${s.nom} ${s.prenom} ${s.matricule}`.toLowerCase().includes(studentSearch.toLowerCase()))
                  .slice(0, 20)
                  .map(s => (
                    <button key={s.matricule} type="button"
                      onClick={() => { setSelectedStudentLabel(`${s.nom} ${s.prenom} (${s.matricule})`); setStudentSearch(''); setPaieForm({ ...paieForm, matricule: s.matricule }) }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-0">
                      {s.nom} {s.prenom} <span className="text-gray-400">#{s.matricule}</span>
                    </button>
                  ))}
                {students.filter(s => `${s.nom} ${s.prenom} ${s.matricule}`.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                  <p className="px-3 py-2 text-gray-400">Aucun élève trouvé</p>
                )}
              </div>
            )}
            {selectedStudentLabel && (
              <p className="mt-1 text-sm text-cameroon-green font-medium">{selectedStudentLabel}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('payment.montant')}</label>
            <input type="number" min={0} value={paieForm.montant || ''} onChange={(e) => setPaieForm({ ...paieForm, montant: parseFloat(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('payment.mode')}</label>
            <select value={paieForm.idMode} onChange={(e) => setPaieForm({ ...paieForm, idMode: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm">
              {modes.filter(m => m.actif).map((m) => <option key={m.idMode} value={m.idMode}>{m.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('payment.date')}</label>
            <input type="date" value={paieForm.datePaie} onChange={(e) => setPaieForm({ ...paieForm, datePaie: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={modeModal} onClose={() => { setModeModal(false); setEditingMode(null); setModeLibelle('') }} title={editingMode ? 'Modifier le mode de paiement' : 'Ajouter un mode de paiement'}>
        <form onSubmit={handleModeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Libellé</label>
            <input type="text" value={modeLibelle} onChange={(e) => setModeLibelle(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={editingTranche !== null} onClose={() => { setEditingTranche(null); setTrancheForm({ libelle: '', montant: 0, date_limite: '' }) }} title="Modifier la tranche">
        <form onSubmit={handleTrancheSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Libellé</label>
            <input type="text" value={trancheForm.libelle} onChange={(e) => setTrancheForm({ ...trancheForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Montant</label>
            <input type="number" min={0} value={trancheForm.montant || ''} onChange={(e) => setTrancheForm({ ...trancheForm, montant: parseFloat(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date limite</label>
            <input type="date" value={trancheForm.date_limite} onChange={(e) => setTrancheForm({ ...trancheForm, date_limite: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={tuitionModal} onClose={() => setTuitionModal(false)} title={editingTuition ? 'Modifier les frais' : t('payment.addTuition')}>
        <form onSubmit={handleTuitionSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('class.cycle')}</label>
            <select value={tuitionForm.idCycle} onChange={(e) => setTuitionForm({ ...tuitionForm, idCycle: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">{t('common.select')}</option>
              {cycles.map((c) => <option key={c.idCycle} value={c.idCycle}>{c.libelle}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('payment.inscription')}</label>
              <input type="number" min={0} value={tuitionForm.inscription || ''} onChange={(e) => setTuitionForm({ ...tuitionForm, inscription: parseFloat(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('payment.pension')}</label>
              <input type="number" min={0} value={tuitionForm.pension || ''} onChange={(e) => setTuitionForm({ ...tuitionForm, pension: parseFloat(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('payment.nbreTranches')}</label>
            <div className="flex gap-3">
              {[1, 2, 3].map((n) => (
                <label key={n} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 has-checked:bg-cameroon-green/5 has-checked:border-cameroon-green">
                  <input type="radio" name="nbreTranche" value={n} checked={tuitionForm.nbreTranche === n} onChange={() => handleNbreTrancheChange(n)} className="text-cameroon-green focus:ring-cameroon-green" />
                  <span className="text-sm font-medium">{n}</span>
                </label>
              ))}
            </div>
          </div>

          {Array.from({ length: tuitionForm.nbreTranche }).map((_, i) => (
            <div key={i}>
              <label className="block text-sm font-medium mb-1">
                {t('payment.tranche')} {i + 1} — {formatCurrency(Math.round((tuitionForm.inscription + tuitionForm.pension) / tuitionForm.nbreTranche))}
              </label>
              <input
                type="date"
                value={trancheDates[i] || ''}
                onChange={(e) => {
                  const next = [...trancheDates]
                  next[i] = e.target.value
                  setTrancheDates(next)
                }}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          ))}

          <div className="pt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">{t('payment.totalDue')}: <span className="text-cameroon-green">{formatCurrency(tuitionForm.inscription + tuitionForm.pension)}</span></p>
            <p className="text-xs text-gray-500">{t('payment.nbreTranches')}: {tuitionForm.nbreTranche} × {formatCurrency(Math.round((tuitionForm.inscription + tuitionForm.pension) / tuitionForm.nbreTranche))}</p>
          </div>

          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition">
            {t('common.save')}
          </button>
        </form>
      </Modal>
    </div>
  )
}
