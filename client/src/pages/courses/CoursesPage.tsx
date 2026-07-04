import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { courseAPI } from '../../services/api'
import { Course, EmploiDuTemps, Classe } from '../../types'
import { mockClasses } from '../../services/mockData'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import { Plus } from 'lucide-react'
import { DAYS, HOURS } from '../../utils/constants'
import toast from 'react-hot-toast'

export default function CoursesPage() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState<Course[]>([])
  const [timetable, setTimetable] = useState<EmploiDuTemps[]>([])
  const [loading, setLoading] = useState(true)
  const [courseModal, setCourseModal] = useState(false)
  const [ttModal, setTtModal] = useState(false)
  const [courseForm, setCourseForm] = useState({ libelle: '', coefficient: 1, idClasse: 0 })
  const [ttForm, setTtForm] = useState({ jour: '', heure: '', idClasse: 0, idCours: 0 })
  const [selectedClass, setSelectedClass] = useState<number>(0)

  const load = () => {
    setLoading(true)
    Promise.all([courseAPI.getAll(), courseAPI.getTimetable()])
      .then(([c, t]) => { setCourses(c.data); setTimetable(t.data); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  if (loading) return <LoadingSkeleton rows={6} />

  const filteredTT = selectedClass ? timetable.filter((t) => t.idClasse === selectedClass) : timetable

  const getTT = (day: string, hour: string) => {
    const entry = filteredTT.find((t) => t.jour === day && t.heure === hour)
    return entry ? courses.find((c) => c.idCours === entry.idCours)?.libelle : null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('course.title')}</h1>
        <div className="flex gap-2">
          <button onClick={() => setTtModal(true)} className="flex items-center gap-2 px-4 py-2 border border-cameroon-green text-cameroon-green rounded-lg text-sm hover:bg-cameroon-green hover:text-white transition">
            <Plus size={16} /> {t('timetable.add')}
          </button>
          <button onClick={() => setCourseModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition">
            <Plus size={16} /> {t('course.add')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold mb-4">{t('course.title')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((c) => (
            <div key={c.idCours} className="px-4 py-3 bg-gray-50 rounded-lg text-sm flex items-center justify-between">
              <span className="font-medium">{c.libelle}</span>
              <span className="text-gray-400">Coeff {c.coefficient}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t('timetable.title')}</h3>
          <select value={selectedClass} onChange={(e) => setSelectedClass(parseInt(e.target.value))} className="px-3 py-1.5 border rounded-lg text-sm">
            <option value={0}>{t('common.all')}</option>
            {mockClasses.map((c) => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-50 text-left">Heure</th>
                {DAYS.map((d) => <th key={d} className="border p-2 bg-gray-50 text-center font-medium">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour}>
                  <td className="border p-2 font-medium text-gray-500 whitespace-nowrap">{hour}</td>
                  {DAYS.map((day) => {
                    const subject = getTT(day, hour)
                    return (
                      <td key={day} className={`border p-2 text-center ${subject ? 'bg-green-50 text-cameroon-green font-medium' : 'text-gray-300'}`}>
                        {subject || '-'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={courseModal} onClose={() => setCourseModal(false)} title={t('course.add')}>
        <form onSubmit={async (e) => { e.preventDefault(); await courseAPI.create(courseForm); toast.success(t('toast.saved')); setCourseModal(false); setCourseForm({ libelle: '', coefficient: 1, idClasse: 0 }); load() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('course.libelle')}</label><input type="text" value={courseForm.libelle} onChange={(e) => setCourseForm({ ...courseForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('course.coefficient')}</label><input type="number" min={1} max={5} value={courseForm.coefficient} onChange={(e) => setCourseForm({ ...courseForm, coefficient: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Classe</label><select value={courseForm.idClasse} onChange={(e) => setCourseForm({ ...courseForm, idClasse: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{mockClasses.map((c) => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}</select></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      <Modal open={ttModal} onClose={() => setTtModal(false)} title={t('timetable.add')}>
        <form onSubmit={async (e) => { e.preventDefault(); await courseAPI.addTimetableEntry(ttForm); toast.success(t('toast.saved')); setTtModal(false); setTtForm({ jour: '', heure: '', idClasse: 0, idCours: 0 }); load() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('timetable.day')}</label><select value={ttForm.jour} onChange={(e) => setTtForm({ ...ttForm, jour: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm">{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">{t('timetable.hour')}</label><select value={ttForm.heure} onChange={(e) => setTtForm({ ...ttForm, heure: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm">{HOURS.map((h) => <option key={h} value={h}>{h}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">{t('timetable.class')}</label><select value={ttForm.idClasse} onChange={(e) => setTtForm({ ...ttForm, idClasse: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{mockClasses.map((c) => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">{t('timetable.course')}</label><select value={ttForm.idCours} onChange={(e) => setTtForm({ ...ttForm, idCours: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">{courses.map((c) => <option key={c.idCours} value={c.idCours}>{c.libelle}</option>)}</select></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>
    </div>
  )
}
