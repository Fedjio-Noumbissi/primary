import { useEffect, useState, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { studentAPI, classAPI } from '../../services/api'
import { Student, Salle } from '../../types'
import DataTable from '../../components/DataTable'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import { Plus, Eye, Edit, UserCheck, ToggleLeft, ToggleRight, Trash2, MoreVertical, Download, RefreshCw } from 'lucide-react'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

function ActionMenu({ s, handleToggleActive, handleDelete, t }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors" title={t('common.actions')}>
        <MoreVertical size={16} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-xl z-[100] border border-gray-100 py-1">
          <button
            onClick={() => { handleToggleActive(s.matricule); setIsOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${s.actif ? 'text-amber-600' : 'text-green-600'}`}
          >
            {s.actif ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {t('user.toggleActive')}
          </button>
          <Link
            to={`/admin/students/${s.matricule}`}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Eye size={16} />
            {t('common.view')}
          </Link>
          <Link
            to={`/admin/students/${s.matricule}/edit`}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Edit size={16} />
            {t('common.edit')}
          </Link>
          <button 
            onClick={() => { handleDelete(s.matricule); setIsOpen(false) }} 
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 transition-colors"
          >
            <Trash2 size={16} />
            {t('common.delete')}
          </button>
        </div>
      )}
    </div>
  )
}

function exportCSV(students: Student[]) {
  const headers = ['Matricule', 'Nom', 'Prénom', 'Date Naissance', 'Lieu Naissance', 'Sexe', 'Langue', 'Classe', 'Salle', 'Statut']
  const rows = students.map((s) => [
    s.matricule,
    s.nom,
    s.prenom,
    s.dateNaissance,
    s.lieuNaissance || '',
    s.sexe === 1 ? 'M' : 'F',
    s.langue || '',
    s.classe || '',
    s.salle || '',
    s.actif ? 'Actif' : 'Inactif',
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `eleves_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function StudentList() {
  const { t } = useTranslation()
  const [students, setStudents] = useState<Student[]>([])
  const [salles, setSalles] = useState<Salle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classeFilter, setClasseFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [classModal, setClassModal] = useState(false)
  const [classForm, setClassForm] = useState({ idSalle: 0 })
  const [busy, setBusy] = useState(false)

  const classes = useMemo(() => Array.from(new Set(students.map(s => s.classe).filter(Boolean))) as string[], [students])

  useEffect(() => {
    Promise.all([studentAPI.getAll(), classAPI.getSalles()])
      .then(([sRes, saRes]) => {
        setStudents(sRes.data)
        setSalles(saRes.data)
        setLoading(false)
      })
  }, [])

  const handleToggleActive = async (id: number) => {
    try {
      const res = await studentAPI.toggleActive(id)
      setStudents((prev) => prev.map((s) => s.matricule === id ? res.data : s))
      toast.success(t('toast.saved'))
    } catch { toast.error(t('toast.error')) }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await studentAPI.delete(id)
      setStudents((prev) => prev.filter((s) => s.matricule !== id))
      toast.success(t('toast.deleted'))
    } catch { toast.error(t('toast.error')) }
  }

  const filtered = students.filter((s) => {
    const matchSearch = `${s.nom} ${s.prenom} ${s.matricule}`.toLowerCase().includes(search.toLowerCase())
    const matchClasse = classeFilter ? s.classe === classeFilter : true
    return matchSearch && matchClasse
  })

  const selectedStudents = useMemo(
    () => students.filter((s) => selectedIds.has(s.matricule)),
    [students, selectedIds]
  )

  async function handleBatchToggleActive() {
    if (selectedIds.size === 0) return
    setBusy(true)
    try {
      const { data } = await studentAPI.batchToggleActive(Array.from(selectedIds))
      setStudents((prev) => prev.map((s) => selectedIds.has(s.matricule) ? { ...s, actif: !s.actif } : s))
      toast.success(`${data.updated} élève(s) mis à jour`)
    } catch { toast.error(t('toast.error')) }
    finally { setBusy(false) }
  }

  async function handleBatchChangeClass() {
    if (selectedIds.size === 0 || !classForm.idSalle) return
    setBusy(true)
    try {
      const { data } = await studentAPI.batchChangeClass(Array.from(selectedIds), classForm.idSalle)
      setStudents((prev) => prev.map((s) => selectedIds.has(s.matricule)
        ? { ...s, salle: salles.find((sa) => sa.idSalle === classForm.idSalle)?.libelle || s.salle, classe: salles.find((sa) => sa.idSalle === classForm.idSalle)?.classe || s.classe }
        : s
      ))
      setClassModal(false)
      setSelectedIds(new Set())
      toast.success(`${data.updated} élève(s) transféré(s)`)
    } catch { toast.error(t('toast.error')) }
    finally { setBusy(false) }
  }

  function handleExport() {
    const toExport = selectedIds.size > 0 ? selectedStudents : students
    exportCSV(toExport)
    toast.success(`Exporté ${toExport.length} élève(s)`)
  }

  const columns = [
    { key: 'matricule', label: t('student.matricule'), render: (s: Student) => <span className="font-mono">#{s.matricule}</span> },
    { key: 'nom', label: t('student.nom'), render: (s: Student) => <span className="font-medium">{s.nom} {s.prenom}</span> },
    { key: 'dateNaissance', label: t('student.dateNaissance'), render: (s: Student) => formatDate(s.dateNaissance) },
    { key: 'sexe', label: t('student.sexe'), render: (s: Student) => s.sexe === 1 ? 'Masculin' : 'Féminin' },
    { key: 'langue', label: t('student.langue') },
    { key: 'classe', label: t('student.classe'), render: (s: Student) => s.classe || '—' },
    { key: 'salle', label: t('class.room'), render: (s: Student) => s.salle || '—' },
    { key: 'actif', label: t('common.status'), render: (s: Student) => (
      <span className={`text-xs px-2 py-0.5 rounded ${s.actif ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        {s.actif ? t('common.active') : t('common.inactive')}
      </span>
    )},
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('student.title')}</h1>
        <div className="flex gap-2">
          <Link
            to="/admin/students/enroll"
            className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition"
          >
            <UserCheck size={16} />
            {t('student.enroll')}
          </Link>
          <Link
            to="/admin/students/new"
            className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition"
          >
            <Plus size={16} />
            {t('student.add')}
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center justify-between bg-cameroon-green/10 border border-cameroon-green/20 rounded-lg px-4 py-3">
              <span className="text-sm font-medium text-cameroon-green">
                {selectedIds.size} élève(s) sélectionné(s)
              </span>
              <div className="flex gap-2">
                <button onClick={() => setClassModal(true)} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-cameroon-green text-white rounded-lg hover:bg-cameroon-green-light transition disabled:opacity-50">
                  <RefreshCw size={14} />
                  Changer la classe
                </button>
                <button onClick={handleBatchToggleActive} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50">
                  <ToggleRight size={14} />
                  Activer/Désactiver
                </button>
                <button onClick={handleExport} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50">
                  <Download size={14} />
                  Exporter
                </button>
              </div>
            </div>
          )}
          <DataTable
            columns={columns}
            data={filtered}
            search={search}
            onSearch={setSearch}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            rowId={(s: Student) => s.matricule}
            filters={
              classes.length > 0 && (
                <select
                  value={classeFilter}
                  onChange={(e) => setClasseFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green focus:border-transparent bg-white min-w-[150px]"
                >
                  <option value="">{t('student.classe')} ({t('common.all', { defaultValue: 'Tous' })})</option>
                  {classes.map(classe => (
                    <option key={classe} value={classe}>{classe}</option>
                  ))}
                </select>
              )
            }
            actions={(s: Student) => (
              <ActionMenu s={s} handleToggleActive={handleToggleActive} handleDelete={handleDelete} t={t} />
            )}
          />
        </div>
      )}

      <Modal open={classModal} onClose={() => setClassModal(false)} title="Changer la classe">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Transférer {selectedIds.size} élève(s) vers une nouvelle classe
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Salle de classe</label>
            <select value={classForm.idSalle} onChange={(e) => setClassForm({ idSalle: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value={0}>--</option>
              {salles.filter((s) => s.actif).map((s) => (
                <option key={s.idSalle} value={s.idSalle}>{s.libelle} {s.classe ? `(${s.classe})` : ''}</option>
              ))}
            </select>
          </div>
          <button onClick={handleBatchChangeClass} disabled={busy || !classForm.idSalle} className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition disabled:opacity-50">
            {busy ? 'Transfert en cours...' : 'Transférer'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
