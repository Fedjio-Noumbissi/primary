import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { academicAPI } from '../../services/api'
import { AnneeAcademique, Trimestre, Session } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import {
  Plus, CheckCircle, Clock, Ban, Lock, Unlock,
  Star, ChevronDown, ChevronRight, Calendar, Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'

type PeriodStatus = 'en_cours' | 'cloture' | 'planifie'

function getStatus(t: Trimestre, allTrimestres: Trimestre[]): PeriodStatus {
  if (t.clos) return 'cloture'
  const idx = allTrimestres.findIndex((tr) => tr.idTrimes === t.idTrimes)
  const firstOpen = allTrimestres.findIndex((tr) => !tr.clos)
  if (idx === firstOpen) return 'en_cours'
  return 'planifie'
}

const statusConfig: Record<PeriodStatus, { label: string; class: string; icon: React.ReactNode }> = {
  en_cours: { label: 'En cours', class: 'bg-green-50 text-green-700 ring-green-600/20', icon: <Clock size={12} /> },
  cloture: { label: 'Clôturé', class: 'bg-gray-50 text-gray-600 ring-gray-500/20', icon: <Ban size={12} /> },
  planifie: { label: 'Planifié', class: 'bg-blue-50 text-blue-700 ring-blue-600/20', icon: <Calendar size={12} /> },
}

export default function AcademicPage() {
  const { t } = useTranslation()
  const [annees, setAnnees] = useState<AnneeAcademique[]>([])
  const [allTrimestres, setAllTrimestres] = useState<Trimestre[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
  const [selectedTrimestre, setSelectedTrimestre] = useState<number | null>(null)
  const [expandedTrimestres, setExpandedTrimestres] = useState<Set<number>>(new Set())

  const [anneeModal, setAnneeModal] = useState(false)
  const [trimModal, setTrimModal] = useState(false)
  const [sessModal, setSessModal] = useState(false)
  const [anneeForm, setAnneeForm] = useState({ libelle: '', periode: '' })
  const [trimForm, setTrimForm] = useState({ libelle: '', periode: '', idAca: 0 })
  const [sessForm, setSessForm] = useState({ libelle: '', idTrimestre: 0 })

  const activeAnnee = useMemo(() => annees.find((a) => a.actif), [annees])

  const filteredTrimestres = useMemo(
    () => allTrimestres.filter((t) => t.idAca === selectedAnnee),
    [allTrimestres, selectedAnnee]
  )

  const filteredSessions = useMemo(
    () => sessions.filter((s) => s.idTrimestre === selectedTrimestre),
    [sessions, selectedTrimestre]
  )

  const load = () => {
    setLoading(true)
    Promise.all([academicAPI.getAnnees(), academicAPI.getTrimestres(), academicAPI.getSessions()])
      .then(([a, t, s]) => {
        setAnnees(a.data)
        setAllTrimestres(t.data)
        setSessions(s.data)
        const first = selectedAnnee ?? a.data.find((an) => an.actif)?.idAnnee ?? a.data[0]?.idAnnee
        setSelectedAnnee(first ?? null)
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  async function setActive(id: number) {
    await academicAPI.setActiveAnnee(id)
    toast.success('Année active mise à jour')
    load()
  }

  async function closeTrimestre(id: number) {
    await academicAPI.closeTrimestre(id)
    toast.success('Trimestre clôturé')
    load()
  }

  async function deleteAnnee(id: number, libelle: string) {
    if (!confirm(`Supprimer l'année "${libelle}" ? Cette action est irréversible.`)) return
    await academicAPI.deleteAnnee(id)
    toast.success('Année supprimée')
    load()
  }

  async function createAnnee(e: React.FormEvent) {
    e.preventDefault()
    await academicAPI.createAnnee(anneeForm)
    toast.success(t('toast.saved'))
    setAnneeModal(false)
    setAnneeForm({ libelle: '', periode: '' })
    load()
  }

  async function createTrimestre(e: React.FormEvent) {
    e.preventDefault()
    await academicAPI.createTrimestre(trimForm)
    toast.success(t('toast.saved'))
    setTrimModal(false)
    setTrimForm({ libelle: '', periode: '', idAca: 0 })
    load()
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    await academicAPI.createSession({ ...sessForm })
    toast.success(t('toast.saved'))
    setSessModal(false)
    setSessForm({ libelle: '', idTrimestre: 0 })
    load()
  }

  const toggleTrim = (id: number) => {
    setExpandedTrimestres((prev) => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id) } else { n.add(id) }
      return n
    })
    setSelectedTrimestre(id)
  }

  if (loading) return <LoadingSkeleton rows={8} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('academic.title')}</h1>
        <div className="flex gap-2">
          <button onClick={() => setAnneeModal(true)} className="flex items-center gap-1.5 px-4 py-2 border border-cameroon-green text-cameroon-green rounded-lg text-sm hover:bg-cameroon-green hover:text-white transition">
            <Plus size={16} /> {t('academic.add')}
          </button>
          <button onClick={() => setTrimModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition">
            <Plus size={16} /> {t('academic.addTrimestre')}
          </button>
          <button onClick={() => { const firstTrim = allTrimestres.find((t) => t.idAca === selectedAnnee); setSessForm({ libelle: '', idTrimestre: firstTrim?.idTrimes || 0 }); setSessModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition">
            <Plus size={16} /> {t('academic.addSession')}
          </button>
        </div>
      </div>

      {/* Annee Academique selector + active badge */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-500">Année :</span>
        {annees.map((a) => {
          const isActive = !!a.actif
          const isSelected = a.idAnnee === selectedAnnee
          return (
            <div
              key={a.idAnnee}
              onClick={() => setSelectedAnnee(a.idAnnee)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition group cursor-pointer ${
                isSelected
                  ? 'border-cameroon-green bg-cameroon-green/5 text-cameroon-green'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {a.libelle}
              {isActive && (
                <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                  <Star size={10} className="fill-amber-500 text-amber-500" /> Active
                </span>
              )}
              {!isActive && isSelected && (
                <button
                  onClick={(e) => { e.stopPropagation(); setActive(a.idAnnee) }}
                  className="ml-1 p-0.5 hover:bg-cameroon-green/10 rounded text-cameroon-green"
                  title="Définir comme active"
                >
                  <Star size={14} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); deleteAnnee(a.idAnnee, a.libelle) }}
                className="ml-1 p-0.5 hover:bg-red-100 rounded text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                title="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* vertical line */}
        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gray-200" />

        {filteredTrimestres.length === 0 ? (
          <p className="text-sm text-gray-400 pl-8">{t('common.noData')}</p>
        ) : (
          <div className="space-y-4">
            {filteredTrimestres.map((t, idx) => {
              const status = getStatus(t, filteredTrimestres)
              const cfg = statusConfig[status]
              const expanded = expandedTrimestres.has(t.idTrimes)
              const trimSessions = sessions.filter((s) => s.idTrimestre === t.idTrimes)

              return (
                <div key={t.idTrimes} className="relative pl-8">
                  {/* dot */}
                  <div
                    className={`absolute left-[5px] top-2 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                      status === 'en_cours' ? 'bg-green-500 ring-green-200'
                      : status === 'cloture' ? 'bg-gray-400 ring-gray-200'
                      : 'bg-blue-500 ring-blue-200'
                    }`}
                  />

                  {/* card */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition" onClick={() => toggleTrim(t.idTrimes)}>
                      {trimSessions.length > 0 ? (
                        expanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />
                      ) : <span className="w-4 shrink-0" />}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{t.libelle}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cfg.class}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{t.periode}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">{trimSessions.length} session(s)</span>

                        {status !== 'cloture' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); closeTrimestre(t.idTrimes) }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          >
                            <Lock size={12} /> Clôturer
                          </button>
                        )}
                        {status === 'cloture' && (
                          <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-400">
                            <Lock size={12} /> Verrouillé
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sessions accordion */}
                    {expanded && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {trimSessions.length === 0 && (
                          <p className="px-4 py-3 text-xs text-gray-400 pl-12">Aucune session</p>
                        )}
                        {trimSessions.map((s) => (
                          <div key={s.idSession} className="flex items-center gap-3 px-4 py-2.5 pl-12 text-sm">
                            <div className="w-2 h-2 rounded-full bg-cameroon-green/60 shrink-0" />
                            <span className="font-medium text-gray-700">{s.libelle}</span>
                            <span className="text-xs text-gray-400">{s.sessTrim}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={anneeModal} onClose={() => setAnneeModal(false)} title={t('academic.add')}>
        <form onSubmit={createAnnee} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('academic.libelle')}</label><input type="text" value={anneeForm.libelle} onChange={(e) => setAnneeForm({ ...anneeForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('academic.periode')}</label><input type="text" value={anneeForm.periode} onChange={(e) => setAnneeForm({ ...anneeForm, periode: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={trimModal} onClose={() => setTrimModal(false)} title={t('academic.addTrimestre')}>
        <form onSubmit={createTrimestre} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('academic.libelle')}</label><input type="text" value={trimForm.libelle} onChange={(e) => setTrimForm({ ...trimForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('academic.periode')}</label><input type="text" value={trimForm.periode} onChange={(e) => setTrimForm({ ...trimForm, periode: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('academic.title')}</label><select value={trimForm.idAca} onChange={(e) => setTrimForm({ ...trimForm, idAca: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{annees.map((a) => <option key={a.idAnnee} value={a.idAnnee}>{a.libelle}</option>)}</select></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={sessModal} onClose={() => setSessModal(false)} title={t('academic.addSession')}>
        <form onSubmit={createSession} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('academic.libelle')}</label><input type="text" value={sessForm.libelle} onChange={(e) => setSessForm({ ...sessForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('academic.trimestre')}</label><select value={sessForm.idTrimestre} onChange={(e) => setSessForm({ ...sessForm, idTrimestre: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{allTrimestres.filter((t) => t.idAca === selectedAnnee).map((t) => <option key={t.idTrimes} value={t.idTrimes}>{t.libelle}</option>)}</select></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}
