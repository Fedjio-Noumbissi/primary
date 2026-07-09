import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { examAPI, academicAPI, studentAPI, dashboardAPI, courseAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { NatureEpreuve, Epreuve, Evaluation, Student, Course, Session } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import DataTable from '../../components/DataTable'
import { Plus } from 'lucide-react'
import { getAppreciation, getGradeColor } from '../../utils/grading'
import toast from 'react-hot-toast'

export default function ExamsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isTeacher = user?.typePersonne === 2

  const [natures, setNatures] = useState<NatureEpreuve[]>([])
  const [epreuves, setEpreuves] = useState<Epreuve[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [epreuveModal, setEpreuveModal] = useState(false)
  const [gradeModal, setGradeModal] = useState(false)
  const [bulkModal, setBulkModal] = useState(false)
  const [epreuveForm, setEpreuveForm] = useState({ libelle: '', idNature: 0, idPers: 1 })
  const [gradeForm, setGradeForm] = useState({ note: 0, matricule: 0, idCours: 0, idSession: 1, idEpreuve: 1, matiere: '' })
  const [bulkGrades, setBulkGrades] = useState<{ matricule: number; note: number }[]>([])

  const load = () => {
    setLoading(true)
    Promise.all([
      examAPI.getNatures(),
      examAPI.getEpreuves(),
      examAPI.getEvaluations(),
      academicAPI.getSessions(),
      ...(isTeacher
        ? [dashboardAPI.getTeacherData(user!.idPers).then(r => {
            const d = r.data
            setCourses(d.cours || [])
            const classIds = [...new Set((d.cours || []).map((c: any) => c.idClasse).filter(Boolean))]
            return Promise.all(classIds.map((id: number) => studentAPI.getByClass(id)))
              .then(results => {
                const all = results.flatMap(r => r.data)
                const seen = new Set()
                setStudents(all.filter((s: Student) => { const k = s.matricule; if (seen.has(k)) return false; seen.add(k); return true }))
              })
          })]
        : [courseAPI.getAll().then(r => setCourses(r.data)),
           studentAPI.getAll().then(r => setStudents(r.data))])
    ]).then(([n, e, ev, s]) => {
      setNatures(n.data)
      setEpreuves(e.data)
      setEvaluations(ev.data)
      setSessions(s.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [user])

  if (loading) return <LoadingSkeleton rows={6} />

  const gradeColumns = [
    { key: 'matricule', label: t('grade.student'), render: (g: Evaluation) => {
      const s = students.find((st) => st.matricule === g.matricule)
      return s ? `${s.nom} ${s.prenom}` : `#${g.matricule}`
    }},
    { key: 'matiere', label: t('course.libelle') },
    { key: 'note', label: t('grade.note'), render: (g: Evaluation) => <span className={`font-semibold ${getGradeColor(g.note)}`}>{g.note}/20</span> },
    { key: 'appreciation', label: t('grade.appreciation'), render: (g: Evaluation) => getAppreciation(g.note, i18n.language as 'fr' | 'en') },
  ]

  const bulkInit = () => {
    setBulkGrades(students.filter((s) => s.actif).map((s) => ({ matricule: s.matricule as number, note: 0 })))
    setBulkModal(true)
  }

  const handleBulkSave = async () => {
    const data = bulkGrades.map((bg) => ({
      ...bg, idCours: gradeForm.idCours, idSession: gradeForm.idSession, idEpreuve: gradeForm.idEpreuve,
      matiere: courses.find((c) => c.idCours === gradeForm.idCours)?.libelle || '',
      appreciation: getAppreciation(bg.note),
    }))
    await examAPI.bulkCreateEvaluations(data)
    toast.success(t('toast.saved'))
    setBulkModal(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('exam.title')} & {t('grade.title')}</h1>
        <div className="flex gap-2">
          <button onClick={bulkInit} className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition">
            <Plus size={16} /> {t('grade.bulk')}
          </button>
          <button onClick={() => setGradeModal(true)} className="flex items-center gap-2 px-4 py-2 border border-cameroon-green text-cameroon-green rounded-lg text-sm hover:bg-cameroon-green hover:text-white transition">
            <Plus size={16} /> {t('grade.title')}
          </button>
          <button onClick={() => setEpreuveModal(true)} className="flex items-center gap-2 px-4 py-2 border border-cameroon-green text-cameroon-green rounded-lg text-sm hover:bg-cameroon-green hover:text-white transition">
            <Plus size={16} /> {t('exam.add')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">{t('exam.title')}</h3>
          <div className="space-y-2">
            {epreuves.map((e) => (
              <div key={e.idEpreuve} className="px-3 py-2 bg-gray-50 rounded-lg text-sm flex items-center justify-between">
                <span className="font-medium">{e.libelle}</span>
                <span className="text-gray-400 text-xs">{e.nature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">{t('exam.nature')}</h3>
          <div className="flex flex-wrap gap-2">
            {natures.map((n) => (
              <span key={n.idNature} className="px-3 py-1.5 bg-gray-50 rounded-lg text-sm">{n.libelle}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-4">{t('grade.title')}</h3>
        <DataTable columns={gradeColumns} data={evaluations.slice(0, 30)} />
      </div>

      <Modal open={epreuveModal} onClose={() => setEpreuveModal(false)} title={t('exam.add')}>
        <form onSubmit={async (e) => { e.preventDefault(); await examAPI.createEpreuve(epreuveForm); toast.success(t('toast.saved')); setEpreuveModal(false); setEpreuveForm({ libelle: '', idNature: 0, idPers: 1 }); load() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('exam.libelle')}</label><input type="text" value={epreuveForm.libelle} onChange={(e) => setEpreuveForm({ ...epreuveForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('exam.nature')}</label><select value={epreuveForm.idNature} onChange={(e) => setEpreuveForm({ ...epreuveForm, idNature: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{natures.map((n) => <option key={n.idNature} value={n.idNature}>{n.libelle}</option>)}</select></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={gradeModal} onClose={() => setGradeModal(false)} title={t('grade.title')}>
        <form onSubmit={async (e) => { e.preventDefault(); await examAPI.createEvaluation(gradeForm); toast.success(t('toast.saved')); setGradeModal(false); setGradeForm({ note: 0, matricule: 0, idCours: 0, idSession: 1, idEpreuve: 1, matiere: '' }); load() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('grade.student')}</label><select value={gradeForm.matricule} onChange={(e) => setGradeForm({ ...gradeForm, matricule: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{students.filter((s) => s.actif).map((s) => <option key={s.matricule} value={s.matricule as number}>{s.nom} {s.prenom}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">{t('course.libelle')}</label><select value={gradeForm.idCours} onChange={(e) => setGradeForm({ ...gradeForm, idCours: parseInt(e.target.value), matiere: courses.find((c) => c.idCours === parseInt(e.target.value))?.libelle || '' })} required className="w-full px-3 py-2 border rounded-lg text-sm">{courses.map((c) => <option key={c.idCours} value={c.idCours}>{c.libelle}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">{t('grade.note')}</label><input type="number" min={0} max={20} step={0.5} value={gradeForm.note} onChange={(e) => setGradeForm({ ...gradeForm, note: parseFloat(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title={t('grade.bulk')} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">{t('course.libelle')}</label><select value={gradeForm.idCours} onChange={(e) => setGradeForm({ ...gradeForm, idCours: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm">{courses.map((c) => <option key={c.idCours} value={c.idCours}>{c.libelle}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">{t('academic.session')}</label><select value={gradeForm.idSession} onChange={(e) => setGradeForm({ ...gradeForm, idSession: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm">{sessions.map((s) => <option key={s.idSession} value={s.idSession}>{s.libelle}</option>)}</select></div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="px-3 py-2 text-left">{t('grade.student')}</th><th className="px-3 py-2 text-left">{t('grade.note')}</th></tr></thead>
              <tbody>
                {bulkGrades.map((bg, idx) => {
                  const s = students.find((st) => st.matricule === bg.matricule)
                  return (
                    <tr key={bg.matricule} className="border-b">
                      <td className="px-3 py-2">{s?.nom} {s?.prenom}</td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} max={20} step={0.5} value={bg.note}
                          onChange={(e) => { const n = [...bulkGrades]; n[idx].note = parseFloat(e.target.value) || 0; setBulkGrades(n) }}
                          className="w-24 px-2 py-1 border rounded text-sm" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button onClick={handleBulkSave} className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </div>
      </Modal>
    </div>
  )
}
