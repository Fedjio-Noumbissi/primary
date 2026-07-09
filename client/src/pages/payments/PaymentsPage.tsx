import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { paymentAPI, classAPI, studentAPI, academicAPI } from '../../services/api'
import { Scolarite, Tranche, Mode, Paiement, Classe, Student, AnneeAcademique } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { Plus, Printer, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function PaymentsPage() {
  const { t, i18n } = useTranslation()
  const isFr = i18n.language === 'fr'
  const [scolarites, setScolarites] = useState<Scolarite[]>([])
  const [tranches, setTranches] = useState<Tranche[]>([])
  const [modes, setModes] = useState<Mode[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [activeAnnee, setActiveAnnee] = useState<AnneeAcademique | null>(null)
  const [paieModal, setPaieModal] = useState(false)
  const [paieForm, setPaieForm] = useState({ matricule: 0, idAca: 0, montant: 0, idMode: 1, datePaie: '', idPers: 0 })
  const [studentSearch, setStudentSearch] = useState('')
  const [filterClasse, setFilterClasse] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [checkedTrancheIds, setCheckedTrancheIds] = useState<Set<number>>(new Set())
  const [paidTrancheIds, setPaidTrancheIds] = useState<Set<number>>(new Set())

  const [searchHistory, setSearchHistory] = useState('')
  const [tarifModal, setTarifModal] = useState(false)
  const [editingClasse, setEditingClasse] = useState<Classe | null>(null)
  const [editingScolariteId, setEditingScolariteId] = useState<number | null>(null)
  const [tarifForm, setTarifForm] = useState({ inscription: 0, pension: 0, nbreTranche: 3 })
  const [tarifTrancheDates, setTarifTrancheDates] = useState<string[]>([])
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set())

  const [modeModal, setModeModal] = useState(false)
  const [editingMode, setEditingMode] = useState<Mode | null>(null)
  const [modeLibelle, setModeLibelle] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      paymentAPI.getScolarites(),
      paymentAPI.getTranches(),
      paymentAPI.getModes(),
      paymentAPI.getPaiements(),
      classAPI.getClasses(),
      academicAPI.getAnnees(),
    ]).then(([sc, tr, mo, pa, cl, an]) => {
      setScolarites(sc.data)
      setTranches(tr.data)
      setModes(mo.data)
      setPaiements(pa.data)
      setClasses(cl.data)
      const active = an.data.find((a: AnneeAcademique) => a.actif)
      setActiveAnnee(active || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

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
        await paymentAPI.updateMode(editingMode.idMode, { libelle: modeLibelle, actif: true })
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
    } catch (err: any) { toast.error(err?.response?.data?.message || t('toast.error')) }
  }

  const columns = [
    { key: 'nom', label: t('student.nom'), render: (p: Paiement) => <span className="font-medium">{p.nom} {p.prenom}</span> },
    { key: 'montant', label: t('payment.montant'), render: (p: Paiement) => <span className="font-semibold text-cameroon-green">{formatCurrency(p.montant)}</span> },
    { key: 'mode', label: t('payment.mode') },
    { key: 'datePaie', label: t('payment.date'), render: (p: Paiement) => formatDate(p.datePaie) },
  ]

  const openPaieModal = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const defaultMode = modes.find(m => m.actif)?.idMode || 1
    setPaieForm({ matricule: 0, idAca: activeAnnee?.idAnnee || 1, montant: 0, idMode: defaultMode, datePaie: '', idPers: user.idPers || 1 })
    setStudentSearch('')
    setFilterClasse('')
    setSelectedStudent(null)
    setCheckedTrancheIds(new Set())
    setPaidTrancheIds(new Set())
    studentAPI.getAll().then(res => setStudents(res.data))
    setPaieModal(true)
  }

  const openReceipt = (id: number) => {
    window.open(`/api/paiements/${id}/receipt`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('payment.title')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={openPaieModal} className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition">
            <Plus size={16} /> {t('payment.receive')}
          </button>
        </div>
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
              <button onClick={() => deleteMode(m.idMode)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition" title="Supprimer"><Trash2 size={12} /></button>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-4">{isFr ? 'Tarifs par classe' : 'Class tuition'}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium w-8" />
                <th className="pb-2 font-medium">{t('student.classe')}</th>
                <th className="pb-2 font-medium">Cycle</th>
                <th className="pb-2 font-medium text-right">{t('payment.inscription')}</th>
                <th className="pb-2 font-medium text-right">{t('payment.pension')}</th>
                <th className="pb-2 font-medium text-right">{isFr ? 'Tranches' : 'Installments'}</th>
                <th className="pb-2 font-medium text-right">{isFr ? 'Total' : 'Total'}</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {classes.filter(c => !c.isDelete).map(cl => {
                const sc = scolarites.find(s => s.idClasse === cl.idClasse)
                const total = sc ? sc.inscription + sc.pension : 0
                const clsTranches = tranches.filter(t => t.idScolarite === sc?.idScolarite)
                const expanded = expandedClasses.has(cl.idClasse)
                const toggle = () => {
                  const next = new Set(expandedClasses)
                  expanded ? next.delete(cl.idClasse) : next.add(cl.idClasse)
                  setExpandedClasses(next)
                }
                return (
                  <React.Fragment key={cl.idClasse}>
                    <tr className="border-b hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="py-2.5">
                        {clsTranches.length > 0 && (
                          <button onClick={toggle} className="p-1 text-gray-400 hover:text-gray-600 transition">
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 font-medium cursor-pointer" onClick={toggle}>{cl.libelle}</td>
                      <td className="py-2.5 text-gray-500">{cl.cycle || cl.specialite || '—'}</td>
                      <td className="py-2.5 text-right">{sc ? formatCurrency(sc.inscription) : '—'}</td>
                      <td className="py-2.5 text-right">{sc ? formatCurrency(sc.pension) : '—'}</td>
                      <td className="py-2.5 text-right">{sc ? sc.nbreTranche : '—'}</td>
                      <td className="py-2.5 text-right font-semibold">{sc ? formatCurrency(total) : '—'}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => {
                            setEditingClasse(cl)
                            setEditingScolariteId(sc?.idScolarite || null)
                            setTarifForm({ inscription: sc?.inscription || 0, pension: sc?.pension || 0, nbreTranche: sc?.nbreTranche || 3 })
                            const existing = tranches.filter(t => t.idScolarite === sc?.idScolarite)
                            setTarifTrancheDates(existing.map(t => t.date_limite || ''))
                            setTarifModal(true)
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-cameroon-green/10 text-cameroon-green rounded-lg hover:bg-cameroon-green/20 transition"
                        >
                          <Pencil size={14} />
                          {t('common.edit')}
                        </button>
                      </td>
                    </tr>
                    {expanded && clsTranches.map((tr, i) => (
                      <tr key={tr.idTranche} className="bg-gray-50/50 text-xs text-gray-500">
                        <td />
                        <td className="py-1.5 pl-8" colSpan={2}>
                          {isFr ? `Tranche ${i + 1}` : `Installment ${i + 1}`}
                        </td>
                        <td className="py-1.5 text-right font-medium text-gray-700" colSpan={2}>
                          {formatCurrency(tr.montant)}
                        </td>
                        <td className="py-1.5 text-right" colSpan={2}>
                          {tr.date_limite ? `${isFr ? 'limite' : 'due'}: ${formatDate(tr.date_limite)}` : '—'}
                        </td>
                        <td />
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={tarifModal} onClose={() => setTarifModal(false)} title={`${isFr ? 'Modifier les frais' : 'Edit tuition'} — ${editingClasse?.libelle || ''}`}>
        <form onSubmit={async (e) => {
          e.preventDefault()
          const total = tarifForm.inscription + tarifForm.pension
          const montantParTranche = Math.round(total / (tarifForm.nbreTranche || 1))
          try {
            if (editingScolariteId) {
              const existing = tranches.filter(t => t.idScolarite === editingScolariteId)
              await paymentAPI.updateScolarite(editingScolariteId, { ...tarifForm, idClasse: editingClasse?.idClasse })
              for (let i = 0; i < Math.max(tarifForm.nbreTranche, existing.length); i++) {
                if (i < tarifForm.nbreTranche && existing[i]) {
                  await paymentAPI.updateTranche(existing[i].idTranche, { libelle: `Tranche ${i + 1}`, montant: montantParTranche, date_limite: tarifTrancheDates[i] || '' })
                } else if (i < tarifForm.nbreTranche && !existing[i]) {
                  await paymentAPI.createTranche({ libelle: `Tranche ${i + 1}`, montant: montantParTranche, date_limite: tarifTrancheDates[i] || '', idScolarite: editingScolariteId })
                } else if (i >= tarifForm.nbreTranche && existing[i]) {
                  await paymentAPI.deleteTranche(existing[i].idTranche)
                }
              }
            } else if (editingClasse) {
              await paymentAPI.createScolariteWithTranches({
                inscription: tarifForm.inscription,
                pension: tarifForm.pension,
                nbreTranche: tarifForm.nbreTranche,
                idClasse: editingClasse.idClasse,
                idCycle: editingClasse.idCycle,
                tranches: Array.from({ length: tarifForm.nbreTranche }, (_, i) => ({
                  libelle: `Tranche ${i + 1}`,
                  montant: montantParTranche,
                  date_limite: tarifTrancheDates[i] || '',
                })),
              })
            }
            toast.success(t('toast.saved'))
            setTarifModal(false)
            load()
          } catch { toast.error(t('toast.error')) }
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('payment.inscription')}</label>
              <input type="number" min={0} value={isNaN(tarifForm.inscription) ? '' : tarifForm.inscription} onChange={e => { const v = parseFloat(e.target.value); setTarifForm(f => ({ ...f, inscription: isNaN(v) ? 0 : v })) }} required
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('payment.pension')}</label>
              <input type="number" min={0} value={isNaN(tarifForm.pension) ? '' : tarifForm.pension} onChange={e => { const v = parseFloat(e.target.value); setTarifForm(f => ({ ...f, pension: isNaN(v) ? 0 : v })) }} required
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isFr ? 'Nombre de tranches' : 'Number of installments'}</label>
            <input type="number" min={1} max={12} value={isNaN(tarifForm.nbreTranche) ? '' : tarifForm.nbreTranche} onChange={e => {
              const n = parseInt(e.target.value) || 1
              setTarifForm(f => ({ ...f, nbreTranche: n }))
              setTarifTrancheDates(prev => Array.from({ length: n }, (_, i) => prev[i] || ''))
            }} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">
              {isFr ? 'Total' : 'Total'}: <span className="text-cameroon-green font-semibold">{formatCurrency(tarifForm.inscription + tarifForm.pension)}</span>
              {' — '}{tarifForm.nbreTranche} {'×'} {formatCurrency(Math.round((tarifForm.inscription + tarifForm.pension) / (tarifForm.nbreTranche || 1)))}
            </p>
            <div className="space-y-3">
              {Array.from({ length: tarifForm.nbreTranche }).map((_, i) => {
                const montant = Math.round((tarifForm.inscription + tarifForm.pension) / tarifForm.nbreTranche)
                return (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium w-24">{isFr ? `Tranche ${i + 1}` : `Installment ${i + 1}`}</span>
                    <span className="text-sm font-semibold text-cameroon-green w-24">{formatCurrency(montant)}</span>
                    <input
                      type="date"
                      value={tarifTrancheDates[i] || ''}
                      onChange={(e) => {
                        const next = [...tarifTrancheDates]
                        next[i] = e.target.value
                        setTarifTrancheDates(next)
                      }}
                      className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-4">{t('payment.history')}</h3>
        <DataTable
          columns={columns}
          data={paiements.filter(p =>
            !searchHistory ||
            `${p.nom} ${p.prenom} ${p.matricule} ${p.mode} ${p.montant}`.toLowerCase().includes(searchHistory.toLowerCase())
          )}
          search={searchHistory}
          onSearch={setSearchHistory}
          rowId={(p: Paiement) => p.idPaie}
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
            await paymentAPI.createPaiement({ ...paieForm, tranches: [...checkedTrancheIds] })
            toast.success(t('toast.saved'))
            setPaieModal(false)
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const defaultMode = modes.find(m => m.actif)?.idMode || 1
            setPaieForm({ matricule: 0, idAca: activeAnnee?.idAnnee || 1, montant: 0, idMode: defaultMode, datePaie: '', idPers: user.idPers || 1 })
            setSelectedStudent(null)
            setCheckedTrancheIds(new Set())
            setPaidTrancheIds(new Set())
            setStudentSearch('')
            load()
          } catch { toast.error(t('toast.error')) }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Élève</label>
            <div className="flex gap-2 mb-2">
              <select value={filterClasse} onChange={(e) => { setFilterClasse(e.target.value); setSelectedStudent(null); setPaieForm({ ...paieForm, matricule: 0 }) }}
                className="w-48 px-3 py-2 border rounded-lg text-sm">
                <option value="">{isFr ? 'Toutes les classes' : 'All classes'}</option>
                {classes.filter(c => !c.isDelete).map(c => (
                  <option key={c.idClasse} value={c.libelle}>{c.libelle}</option>
                ))}
              </select>
              <input type="text" placeholder="Rechercher un élève..." value={studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null); setPaieForm({ ...paieForm, matricule: 0 }) }}
                className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            {!selectedStudent && (
              <div className="max-h-48 overflow-y-auto border rounded-lg text-sm">
                {students
                  .filter(s => !filterClasse || s.classe === filterClasse)
                  .filter(s => !studentSearch || `${s.nom} ${s.prenom} ${s.matricule}`.toLowerCase().includes(studentSearch.toLowerCase()))
                  .slice(0, 30)
                  .map(s => (
                    <button key={s.matricule} type="button"
                      onClick={() => {
                        setSelectedStudent(s); setStudentSearch(''); setFilterClasse(''); setPaieForm({ ...paieForm, matricule: s.matricule }); setCheckedTrancheIds(new Set())
                        paymentAPI.getPaidTranches(s.matricule).then(r => setPaidTrancheIds(new Set(r.data)))
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-0">
                      <span className="font-medium">{s.nom} {s.prenom}</span>
                      {s.classe && <span className="text-gray-400 ml-2">({s.classe})</span>}
                      <span className="text-gray-400 ml-1">#{s.matricule}</span>
                    </button>
                  ))}
                {students.filter(s => !filterClasse || s.classe === filterClasse)
                  .filter(s => !studentSearch || `${s.nom} ${s.prenom} ${s.matricule}`.toLowerCase().includes(studentSearch.toLowerCase()))
                  .length === 0 && (
                  <p className="px-3 py-2 text-gray-400">{isFr ? 'Aucun élève trouvé' : 'No student found'}</p>
                )}
                {students.length === 0 && !studentSearch && !filterClasse && (
                  <p className="px-3 py-2 text-gray-400">{isFr ? 'Chargement...' : 'Loading...'}</p>
                )}
              </div>
            )}
            {selectedStudent && (() => {
              const matchedClasse = classes.find(c => c.libelle === selectedStudent.classe)
              const sc = scolarites.find(s => s.idClasse === matchedClasse?.idClasse)
              const clsTranches = tranches.filter(t => t.idScolarite === sc?.idScolarite)
              const availableTranches = clsTranches.filter(t => !paidTrancheIds.has(t.idTranche))
              const checkedTotal = clsTranches.filter(t => checkedTrancheIds.has(t.idTranche)).reduce((s, t) => s + t.montant, 0)
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-cameroon-green/5 rounded-lg">
                    <span className="font-medium text-sm">{selectedStudent.nom} {selectedStudent.prenom}</span>
                    <span className="text-xs text-gray-500">#{selectedStudent.matricule}</span>
                    <span className="text-xs bg-cameroon-green/10 text-cameroon-green px-2 py-0.5 rounded ml-auto">{selectedStudent.classe || '—'}</span>
                    <button type="button" onClick={() => { setSelectedStudent(null); setPaieForm({ ...paieForm, matricule: 0 }); setCheckedTrancheIds(new Set()); setPaidTrancheIds(new Set()) }}
                      className="text-xs text-red-500 hover:text-red-700">{isFr ? 'Changer' : 'Change'}</button>
                  </div>
                  {sc && availableTranches.length > 0 && (
                    <div className="border rounded-lg divide-y text-sm">
                      <p className="px-3 py-1.5 font-medium text-xs text-gray-500">{isFr ? 'Tranches disponibles' : 'Available installments'}</p>
                      {availableTranches.map(t => (
                        <label key={t.idTranche} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={checkedTrancheIds.has(t.idTranche)}
                            onChange={() => {
                              const next = new Set(checkedTrancheIds)
                              next.has(t.idTranche) ? next.delete(t.idTranche) : next.add(t.idTranche)
                              setCheckedTrancheIds(next)
                              const newTotal = clsTranches.filter(tr => next.has(tr.idTranche)).reduce((s, tr) => s + tr.montant, 0)
                              setPaieForm(f => ({ ...f, montant: newTotal }))
                            }}
                            className="text-cameroon-green focus:ring-cameroon-green" />
                          <span className="flex-1 text-sm">{t.libelle}</span>
                          <span className="text-sm font-medium">{formatCurrency(t.montant)}</span>
                          {t.date_limite && <span className="text-xs text-gray-400">{isFr ? 'limite' : 'due'}: {formatDate(t.date_limite)}</span>}
                        </label>
                      ))}
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 font-medium">
                        <span>{isFr ? 'Total cochée' : 'Checked total'}</span>
                        <span className="text-cameroon-green">{formatCurrency(checkedTotal)}</span>
                      </div>
                      {sc && (
                        <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500">
                          <span>{isFr ? 'Scolarité totale' : 'Total tuition'}: {formatCurrency(sc.inscription + sc.pension)}</span>
                          <span>{isFr ? 'Reste' : 'Remaining'}: {formatCurrency(Math.max(0, (sc.inscription + sc.pension) - checkedTotal))}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {(!sc || availableTranches.length === 0) && (
                    <p className="text-xs text-gray-400">{isFr ? 'Aucune tranche disponible pour cette classe' : 'No installments for this class'}</p>
                  )}
                </div>
              )
            })()}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('payment.montant')}</label>
            <input type="number" min={0} value={isNaN(paieForm.montant) ? '' : paieForm.montant} onChange={(e) => { const v = parseFloat(e.target.value); setPaieForm({ ...paieForm, montant: isNaN(v) ? 0 : v }) }} required className="w-full px-3 py-2 border rounded-lg text-sm" />
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
    </div>
  )
}
