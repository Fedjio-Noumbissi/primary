import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { classAPI, teacherAPI } from '../../services/api'
import { Cycle, Classe, Salle, Teacher } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import {
  Plus, ChevronRight, ChevronDown, Circle, Users, User,
  Download, Edit3, ToggleLeft, ToggleRight, Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClassList() {
  const { t } = useTranslation()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [salles, setSalles] = useState<(Salle & { occupancy?: number })[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCycles, setExpandedCycles] = useState<Set<number>>(new Set())
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set())

  const [cycleModal, setCycleModal] = useState(false)
  const [classModal, setClassModal] = useState(false)
  const [salleModal, setSalleModal] = useState(false)
  const [cycleForm, setCycleForm] = useState({ libelle: '', description: '' })
  const [classForm, setClassForm] = useState({ libelle: '', idCycle: 0 })
  const [salleForm, setSalleForm] = useState({ libelle: '', position: '', surface: '', capacite: 0, idClasse: 0 })

  const load = () => {
    setLoading(true)
    Promise.all([classAPI.getCycles(), classAPI.getClasses(), classAPI.getSalles(), teacherAPI.getAll()])
      .then(([c, cl, s, te]) => {
        setCycles(c.data)
        setClasses(cl.data)
        setSalles(s.data)
        setTeachers(te.data)
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  const toggleCycle = (id: number) => {
    setExpandedCycles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const toggleClass = (id: number) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const cycleClasses = useMemo(() => {
    const map: Record<number, Classe[]> = {}
    for (const cl of classes) {
      if (!map[cl.idCycle]) map[cl.idCycle] = []
      map[cl.idCycle].push(cl)
    }
    return map
  }, [classes])

  const classSalles = useMemo(() => {
    const map: Record<number, Salle[]> = {}
    for (const s of salles) {
      if (!map[s.idClasse]) map[s.idClasse] = []
      map[s.idClasse].push(s)
    }
    return map
  }, [salles, classes])

  const studentCounts = useMemo(() => {
    const map: Record<number, number> = {}
    for (const s of salles) {
      const clId = s.idClasse
      map[clId] = (map[clId] || 0) + (s.occupancy || 0)
    }
    return map
  }, [salles])

  async function handleCycle(e: React.FormEvent) {
    e.preventDefault()
    await classAPI.createCycle(cycleForm)
    toast.success(t('toast.saved'))
    setCycleModal(false)
    setCycleForm({ libelle: '', description: '' })
    load()
  }

  async function handleClass(e: React.FormEvent) {
    e.preventDefault()
    await classAPI.createClass(classForm)
    toast.success(t('toast.saved'))
    setClassModal(false)
    setClassForm({ libelle: '', idCycle: 0 })
    load()
  }

  async function handleSalle(e: React.FormEvent) {
    e.preventDefault()
    await classAPI.createSalle(salleForm)
    toast.success(t('toast.saved'))
    setSalleModal(false)
    setSalleForm({ libelle: '', position: '', surface: '', capacite: 0, idClasse: 0 })
    load()
  }

  async function handleToggleActiveSalle(id: number) {
    await classAPI.toggleActiveSalle(id)
    toast.success(t('toast.saved'))
    load()
  }

  async function handleSetTeacher(classeId: number, titulaire: number | null) {
    await classAPI.setClassTeacher(classeId, titulaire)
    toast.success(t('toast.saved'))
    load()
  }

  async function handleDeleteClass(id: number) {
    if (!confirm('Supprimer définitivement cette classe et ses salles ?')) return
    try {
      await classAPI.deleteClass(id)
      toast.success('Supprimé')
      load()
    } catch { toast.error(t('toast.error')) }
  }

  async function handleDeleteSalle(id: number) {
    if (!confirm('Supprimer définitivement cette salle ?')) return
    try {
      await classAPI.deleteSalle(id)
      toast.success('Supprimé')
      load()
    } catch { toast.error(t('toast.error')) }
  }

  if (loading) return <LoadingSkeleton rows={8} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('class.title')}</h1>
        <div className="flex gap-2">
          <button onClick={() => setCycleModal(true)} className="flex items-center gap-1.5 px-4 py-2 border border-cameroon-green text-cameroon-green rounded-lg text-sm hover:bg-cameroon-green hover:text-white transition">
            <Plus size={16} /> {t('class.addCycle')}
          </button>
          <button onClick={() => setClassModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition">
            <Plus size={16} /> {t('class.addClass')}
          </button>
          <button onClick={() => setSalleModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition">
            <Plus size={16} /> {t('class.roomAdd')}
          </button>
        </div>
      </div>

      {/* Tree View */}
      {cycles.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('common.noData')}</p>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle) => {
            const cClasses = cycleClasses[cycle.idCycle] || []
            const isExpanded = expandedCycles.has(cycle.idCycle)
            const totalStudents = cClasses.reduce((sum, cl) => sum + (studentCounts[cl.idClasse] || 0), 0)

            return (
              <div key={cycle.idCycle} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Cycle header */}
                <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleCycle(cycle.idCycle)}>
                  {isExpanded ? <ChevronDown size={18} className="text-cameroon-green shrink-0" /> : <ChevronRight size={18} className="text-gray-400 shrink-0" />}
                  <Circle size={10} className="fill-cameroon-green text-cameroon-green shrink-0" />
                  <span className="font-semibold text-gray-900">{cycle.libelle}</span>
                  <span className="text-xs text-gray-400">{cClasses.length} classe(s)</span>
                  <span className="text-xs text-cameroon-green ml-auto flex items-center gap-1">
                    <Users size={14} /> {totalStudents} élève(s)
                  </span>
                </div>

                {/* Classes accordion */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {cClasses.length === 0 && (
                      <p className="px-5 py-3 text-sm text-gray-400">Aucune classe</p>
                    )}
                    {cClasses.map((cl) => {
                      const clSalles = classSalles[cl.idClasse] || []
                      const clExpanded = expandedClasses.has(cl.idClasse)
                      const clStudents = studentCounts[cl.idClasse] || 0

                      return (
                        <div key={cl.idClasse}>
                          <div className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition" onClick={() => toggleClass(cl.idClasse)}>
                            {clSalles.length > 0 ? (
                              clExpanded ? <ChevronDown size={16} className="text-cameroon-green shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />
                            ) : <span className="w-4 shrink-0" />}
                            <span className="font-medium text-gray-800">{cl.libelle}</span>
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{clSalles.length} salle(s)</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={13} />{clStudents}</span>

                            {/* Teacher selector */}
                            <div className="ml-auto flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                              <User size={13} className="text-gray-400" />
                              <select
                                value={cl.titulaire || ''}
                                onChange={(e) => handleSetTeacher(cl.idClasse, e.target.value ? Number(e.target.value) : null)}
                                className="text-xs border-none bg-transparent font-medium text-gray-600 cursor-pointer focus:outline-none"
                              >
                                <option value="">Titulaire</option>
                                {teachers.filter((t) => t.actif).map((t) => (
                                  <option key={t.idEnseignant} value={t.idEnseignant}>{t.nom} {t.prenom}</option>
                                ))}
                              </select>
                            </div>

                            {/* PDF export */}
                            <button onClick={(e) => { e.stopPropagation(); window.open(classAPI.getClassPDF(cl.idClasse), '_blank') }} className="p-1 hover:bg-gray-100 rounded text-gray-400" title="Exporter PDF">
                              <Download size={15} />
                            </button>

                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(cl.idClasse) }} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600" title="Supprimer">
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Salles */}
                          {clExpanded && (
                            <div className="px-5 pb-3 space-y-2">
                              {clSalles.length === 0 && (
                                <p className="text-xs text-gray-400 pl-6">Aucune salle</p>
                              )}
                              {clSalles.map((s) => {
                                const pct = s.capacite ? Math.round(((s.occupancy || 0) / s.capacite) * 100) : 0
                                const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'
                                return (
                                  <div key={s.idSalle} className="flex items-center gap-3 pl-6 pr-3 py-2 bg-gray-50 rounded-lg text-sm">
                                    <span className="font-medium text-gray-700">{s.libelle}</span>
                                    <span className="text-xs text-gray-400">{s.position} · {s.surface}</span>
                                    {/* Occupancy bar */}
                                    {s.capacite ? (
                                      <div className="flex items-center gap-2 ml-auto">
                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">{s.occupancy || 0}/{s.capacite}</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400 ml-auto">{s.occupancy || 0} élève(s)</span>
                                    )}
                                    <button onClick={() => handleToggleActiveSalle(s.idSalle)} className={`p-1 rounded ${s.actif ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`} title={s.actif ? 'Désactiver' : 'Activer'}>
                                        {s.actif ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                      </button>
                                    <button onClick={() => handleDeleteSalle(s.idSalle)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600" title="Supprimer">
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <Modal open={cycleModal} onClose={() => setCycleModal(false)} title={t('class.addCycle')}>
        <form onSubmit={handleCycle} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('class.libelle')}</label><input type="text" value={cycleForm.libelle} onChange={(e) => setCycleForm({ ...cycleForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={cycleForm.description} onChange={(e) => setCycleForm({ ...cycleForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} /></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={classModal} onClose={() => setClassModal(false)} title={t('class.addClass')}>
        <form onSubmit={handleClass} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('class.libelle')}</label><input type="text" value={classForm.libelle} onChange={(e) => setClassForm({ ...classForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('class.cycle')}</label><select value={classForm.idCycle} onChange={(e) => setClassForm({ ...classForm, idCycle: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">{t('common.select')}</option>{cycles.map((c) => <option key={c.idCycle} value={c.idCycle}>{c.libelle}</option>)}</select></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={salleModal} onClose={() => setSalleModal(false)} title={t('class.roomAdd')}>
        <form onSubmit={handleSalle} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('class.libelle')}</label><input type="text" value={salleForm.libelle} onChange={(e) => setSalleForm({ ...salleForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('class.position')}</label><input type="text" value={salleForm.position} onChange={(e) => setSalleForm({ ...salleForm, position: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('class.surface')}</label><input type="text" value={salleForm.surface} onChange={(e) => setSalleForm({ ...salleForm, surface: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Capacité (places)</label><input type="number" min={0} value={salleForm.capacite || ''} onChange={(e) => setSalleForm({ ...salleForm, capacite: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Classe</label><select value={salleForm.idClasse} onChange={(e) => setSalleForm({ ...salleForm, idClasse: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">{t('common.select')}</option>{classes.map((c) => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}</select></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}
