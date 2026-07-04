import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { studentAPI } from '../../services/api'
import { Student } from '../../types'
import DataTable from '../../components/DataTable'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { Plus, Eye, Edit, UserCheck, ToggleLeft, ToggleRight, Trash2, MoreVertical } from 'lucide-react'
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

export default function StudentList() {
  const { t } = useTranslation()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classeFilter, setClasseFilter] = useState('')

  const classes = Array.from(new Set(students.map(s => s.classe).filter(Boolean))) as string[]

  useEffect(() => {
    studentAPI.getAll().then((res) => {
      setStudents(res.data)
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
          <DataTable
            columns={columns}
            data={filtered}
            search={search}
            onSearch={setSearch}
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
    </div>
  )
}
