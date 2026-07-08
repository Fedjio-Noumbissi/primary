import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, DateSelectArg, EventDropArg, EventResizeDoneArg } from '@fullcalendar/core'
import { courseAPI, teacherAPI, classAPI } from '../../services/api'
import { Course, EmploiDuTemps, Classe, Teacher, Salle, Cycle } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import Modal from '../../components/Modal'
import { Plus, Printer, AlertTriangle, FileDown, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const DAY_MAP: Record<string, number> = {
  Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6,
}
const DAY_NAMES: Record<number, string> = {
  1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
}

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  date.setHours(0, 0, 0, 0)
  return date
}

function toEventDate(jour: string, heure: string) {
  const [h, m] = heure.split(':').map(Number)
  const ref = getMonday(new Date())
  ref.setDate(ref.getDate() + DAY_MAP[jour] - 1)
  ref.setHours(h, m, 0, 0)
  return ref
}

function fromEventDate(date: Date) {
  const dayIndex = date.getDay() === 0 ? 7 : date.getDay()
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return { jour: DAY_NAMES[dayIndex] || '', heure: `${h}:${m}` }
}

const PALETTE = [
  '#15803d', '#1d4ed8', '#b45309', '#831843', '#0f766e',
  '#6b21a8', '#be123c', '#047857', '#1e3a5f', '#92400e',
  '#4c1d95', '#065f46', '#7c2d12', '#3730a3', '#115e59',
]

function courseColor(course: Course, index: number): string {
  if (course.couleur) return course.couleur
  return PALETTE[index % PALETTE.length]
}

interface SlotInfo {
  jour: string
  heure: string
  idTemps?: number
}

type ViewMode = 'classe' | 'enseignant' | 'salle'

export default function CoursesPage() {
  const { t } = useTranslation()
  const calendarRef = useRef<FullCalendar>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [salles, setSalles] = useState<Salle[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [timetable, setTimetable] = useState<EmploiDuTemps[]>([])
  const [loading, setLoading] = useState(true)
  const [courseModal, setCourseModal] = useState(false)
  const [courseForm, setCourseForm] = useState({ libelle: '', coefficient: 1, idClasse: 0 })
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null)
  const [slotModal, setSlotModal] = useState(false)
  const [slotForm, setSlotForm] = useState({ idCycle: 0, idClasse: 0, idCours: 0, idEnseignant: 0, idSalle: 0 })

  const [viewMode, setViewMode] = useState<ViewMode>('classe')
  const [selectedFilter, setSelectedFilter] = useState<number>(0)

  const [conflicts, setConflicts] = useState<EmploiDuTemps[]>([])
  const [conflictModal, setConflictModal] = useState(false)

  const loadTimetable = useCallback(() => {
    const params: Record<string, number> = {}
    if (viewMode === 'classe' && selectedFilter) params.idClasse = selectedFilter
    if (viewMode === 'enseignant' && selectedFilter) params.idEnseignant = selectedFilter
    if (viewMode === 'salle' && selectedFilter) params.idSalle = selectedFilter
    return courseAPI.getTimetable(selectedFilter && viewMode === 'classe' ? selectedFilter : undefined)
      .then((r) => setTimetable(r.data))
  }, [viewMode, selectedFilter])

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      courseAPI.getAll(),
      courseAPI.getTimetable(),
      teacherAPI.getAll(),
      classAPI.getSalles(),
      classAPI.getCycles(),
      classAPI.getClasses(),
    ]).then(([c, t, te, s, cy, cl]) => {
      setCourses(c.data)
      setTimetable(t.data)
      setTeachers(te.data)
      setSalles(s.data)
      setCycles(cy.data)
      setClasses(cl.data)
      setLoading(false)
    })
  }, [])

  useEffect(() => { load() }, [load])

  const filteredEntries = useMemo(() => {
    if (!selectedFilter) return timetable
    return timetable.filter((e) => {
      if (viewMode === 'classe') return e.idClasse === selectedFilter
      if (viewMode === 'enseignant') return e.idEnseignant === selectedFilter
      if (viewMode === 'salle') return e.idSalle === selectedFilter
      return true
    })
  }, [timetable, viewMode, selectedFilter])

  const colorMap = useMemo(() => {
    const m = new Map<number, string>()
    courses.forEach((c, i) => m.set(c.idCours, courseColor(c, i)))
    return m
  }, [courses])

  const events = filteredEntries.map((e) => ({
    id: String(e.idTemps),
    title: e.cours || '',
    start: toEventDate(e.jour, e.heure),
    end: new Date(toEventDate(e.jour, e.heure).getTime() + 60 * 60 * 1000),
    backgroundColor: colorMap.get(e.idCours) || '#15803d',
    borderColor: colorMap.get(e.idCours) || '#15803d',
    textColor: '#fff',
    extendedProps: { idEnseignant: e.idEnseignant, idSalle: e.idSalle },
  }))

  function handleDateSelect(selectInfo: DateSelectArg) {
    const { jour, heure } = fromEventDate(selectInfo.start)
    setSlotInfo({ jour, heure })
    setSlotForm({ idCycle: 0, idClasse: 0, idCours: 0, idEnseignant: 0, idSalle: 0 })
    setSlotModal(true)
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const entry = timetable.find((e) => e.idTemps === Number(clickInfo.event.id))
    if (!entry) return
    const cls = classes.find((c) => c.idClasse === entry.idClasse)
    setSlotInfo({ jour: entry.jour, heure: entry.heure, idTemps: entry.idTemps })
    setSlotForm({
      idCycle: cls?.idCycle || 0,
      idClasse: entry.idClasse,
      idCours: entry.idCours,
      idEnseignant: entry.idEnseignant || 0,
      idSalle: entry.idSalle || 0,
    })
    setSlotModal(true)
  }

  async function checkAndSave(data: {
    jour: string; heure: string; idCours: number; idEnseignant?: number; idSalle?: number; excludeId?: number
  }) {
    if (!data.idEnseignant && !data.idSalle) return true
    try {
      const res = await courseAPI.checkConflicts({
        jour: data.jour, heure: data.heure,
        idEnseignant: data.idEnseignant,
        idSalle: data.idSalle,
        excludeId: data.excludeId,
      })
      if (res.data.conflict) {
        setConflicts(res.data.entries)
        setConflictModal(true)
        return false
      }
      return true
    } catch {
      return true
    }
  }

  async function handleEventDrop(dropInfo: EventDropArg) {
    const id = Number(dropInfo.event.id)
    const { jour, heure } = fromEventDate(dropInfo.event.start!)
    const entry = timetable.find((e) => e.idTemps === id)
    if (!entry) return
    const ok = await checkAndSave({ jour, heure, idCours: entry.idCours, idEnseignant: entry.idEnseignant, idSalle: entry.idSalle, excludeId: id })
    if (!ok) { dropInfo.revert(); return }
    try {
      const res = await courseAPI.updateTimetableEntry(id, {
        jour, heure, idCours: entry.idCours,
        idEnseignant: entry.idEnseignant, idSalle: entry.idSalle,
      })
      setTimetable((prev) => prev.map((e) => (e.idTemps === id ? res.data : e)))
      toast.success(t('toast.saved'))
    } catch {
      dropInfo.revert()
      toast.error(t('toast.error'))
    }
  }

  async function handleEventResize(resizeInfo: EventResizeDoneArg) {
    const id = Number(resizeInfo.event.id)
    const start = resizeInfo.event.start!
    const end = resizeInfo.event.end!
    const startTime = fromEventDate(start)
    const endTime = fromEventDate(end)
    const startHour = parseInt(startTime.heure.split(':')[0])
    const heure = `${String(startHour).padStart(2, '0')}:00`
    try {
      const entry = timetable.find((e) => e.idTemps === id)
      if (!entry) return
      await courseAPI.updateTimetableEntry(id, {
        jour: startTime.jour, heure,
        idCours: entry.idCours,
        idEnseignant: entry.idEnseignant, idSalle: entry.idSalle,
      })
      toast.success(t('toast.saved'))
    } catch {
      resizeInfo.revert()
      toast.error(t('toast.error'))
    }
  }

  async function handleSlotSave() {
    if (!slotInfo) return
    if (!slotForm.idCours) { toast.error(t('timetable.selectCourse')); return }
    if (!slotForm.idClasse) { toast.error('Sélectionnez une classe'); return }
    const ok = await checkAndSave({
      jour: slotInfo.jour, heure: slotInfo.heure,
      idCours: slotForm.idCours,
      idEnseignant: slotForm.idEnseignant || undefined,
      idSalle: slotForm.idSalle || undefined,
      excludeId: slotInfo.idTemps,
    })
    if (!ok) return
    try {
      if (slotInfo.idTemps) {
        const res = await courseAPI.updateTimetableEntry(slotInfo.idTemps, {
          jour: slotInfo.jour, heure: slotInfo.heure,
          idClasse: slotForm.idClasse,
          idCours: slotForm.idCours,
          idEnseignant: slotForm.idEnseignant || undefined,
          idSalle: slotForm.idSalle || undefined,
        })
        setTimetable((prev) => prev.map((e) => (e.idTemps === slotInfo.idTemps ? res.data : e)))
      } else {
        const res = await courseAPI.addTimetableEntry({
          jour: slotInfo.jour, heure: slotInfo.heure,
          idClasse: slotForm.idClasse,
          idCours: slotForm.idCours,
          idEnseignant: slotForm.idEnseignant || undefined,
          idSalle: slotForm.idSalle || undefined,
        })
        setTimetable((prev) => [...prev, res.data])
      }
      setSlotModal(false)
      setSlotInfo(null)
      toast.success(t('toast.saved'))
    } catch {
      toast.error(t('toast.error'))
    }
  }

  async function handleDeleteEntry() {
    if (!slotInfo?.idTemps) return
    try {
      await courseAPI.deleteTimetableEntry(slotInfo.idTemps)
      setTimetable((prev) => prev.filter((e) => e.idTemps !== slotInfo.idTemps))
      setSlotModal(false)
      setSlotInfo(null)
      toast.success(t('toast.deleted'))
    } catch {
      toast.error(t('toast.error'))
    }
  }

  async function handleDeleteCourse(id: number) {
    if (!confirm('Supprimer cette matière ?')) return
    try {
      await courseAPI.delete(id)
      setCourses((prev) => prev.filter((c) => c.idCours !== id))
      toast.success(t('toast.deleted'))
    } catch {
      toast.error(t('toast.error'))
    }
  }

  const filteredClassesByCycle = useMemo(
    () => classes.filter((c) => !slotForm.idCycle || c.idCycle === slotForm.idCycle),
    [classes, slotForm.idCycle]
  )

  const filteredCourses = selectedFilter && viewMode === 'classe'
    ? courses.filter((c) => c.idClasse === selectedFilter)
    : courses

  const filterOptions = useMemo(() => {
    if (viewMode === 'classe') return classes.map((c) => ({ value: c.idClasse, label: c.libelle }))
    if (viewMode === 'enseignant') return teachers.filter((t) => t.actif).map((t) => ({ value: t.idEnseignant, label: `${t.nom} ${t.prenom}` }))
    return salles.filter((s) => s.actif).map((s) => ({ value: s.idSalle, label: s.libelle }))
  }, [viewMode, teachers, salles, classes])

  function handlePrint() {
    if (!printRef.current) return
    const win = window.open('', '_blank')
    if (!win) return
    const coursesMap = new Map(courses.map((c) => [c.idCours, c.libelle]))
    const rows = filteredEntries.length
      ? filteredEntries
      : timetable
    const sorted = [...rows].sort((a, b) => {
      const da = DAY_MAP[a.jour] || 0
      const db = DAY_MAP[b.jour] || 0
      return da - db || a.heure.localeCompare(b.heure)
    })
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Emploi du Temps</title>
<style>
  @page { size: A4 landscape; margin: 15mm }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; }
  h1 { text-align: center; font-size: 20px; margin-bottom: 6px; }
  .sub { text-align: center; font-size: 13px; color: #666; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #15803d; color: #fff; padding: 8px 6px; text-align: center; font-weight: 600; }
  td { border: 1px solid #d1d5db; padding: 6px 4px; vertical-align: top; }
  .hour { font-weight: 600; color: #374151; white-space: nowrap; width: 60px; text-align: center; }
  .entry { background: #f0fdf4; border-radius: 4px; padding: 2px 4px; margin-bottom: 2px; font-size: 11px; }
  .entry strong { display: block; }
  .entry .meta { color: #6b7280; font-size: 10px; }
  .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px; }
</style></head><body>
<h1>Emploi du Temps</h1>
<p class="sub">${viewMode === 'classe' ? 'Classe: ' + (classes.find((c) => c.idClasse === selectedFilter)?.libelle || 'Toutes') : viewMode === 'enseignant' ? 'Enseignant: ' + (teachers.find((t) => t.idEnseignant === selectedFilter)?.nom || 'Tous') : 'Salle: ' + (salles.find((s) => s.idSalle === selectedFilter)?.libelle || 'Toutes')}</p>
<table><thead><tr><th>Horaire</th>
${Object.entries(DAY_MAP).sort(([,a],[,b]) => a-b).map(([name]) => `<th>${name}</th>`).join('')}
</tr></thead><tbody>
${['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map((h) => {
  const hourNum = parseInt(h)
  return `<tr><td class="hour">${h}</td>${Object.entries(DAY_MAP).sort(([,a],[,b]) => a-b).map(([dayName]) => {
    const entries = sorted.filter((e) => e.jour === dayName && parseInt(e.heure) === hourNum)
    if (!entries.length) return '<td></td>'
    return `<td>${entries.map((e) => `<div class="entry"><strong>${e.cours || ''}</strong><span class="meta">${e.enseignant ? e.enseignant : ''}${e.salle ? ' | ' + e.salle : ''}</span></div>`).join('')}</td>`
  }).join('')}</tr>`
}).join('')}
</tbody></table>
<p class="footer">Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
</body></html>`)
    win.document.close()
    win.print()
  }

  if (loading) return <LoadingSkeleton rows={6} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('course.title')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
            <FileDown size={16} /> PDF
          </button>
          <button onClick={() => { setCourseForm({ libelle: '', coefficient: 1, idClasse: classes[0]?.idClasse || 0 }); setCourseModal(true) }} className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition">
            <Plus size={16} /> {t('course.add')}
          </button>
        </div>
      </div>

      {/* Course cards with colored dots */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold mb-4">{t('course.title')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((c, i) => {
            const color = courseColor(c, i)
            return (
              <div key={c.idCours} className="px-4 py-3 bg-gray-50 rounded-lg text-sm flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  {c.libelle}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">Coeff {c.coefficient}</span>
                  <button onClick={() => handleDeleteCourse(c.idCours)} className="text-gray-400 hover:text-red-500 transition" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Timetable */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold">{t('timetable.title')}</h3>
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
              {(['classe', 'enseignant', 'salle'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode); setSelectedFilter(0) }}
                  className={`px-3 py-1.5 rounded-md transition ${
                    viewMode === mode ? 'bg-white shadow text-cameroon-green' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode === 'classe' ? 'Classe' : mode === 'enseignant' ? 'Enseignant' : 'Salle'}
                </button>
              ))}
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(parseInt(e.target.value))}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value={0}>{t('common.all')}</option>
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="timetable-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{ left: '', center: 'title', right: '' }}
            firstDay={1}
            locale="fr"
            slotMinTime="07:00:00"
            slotMaxTime="17:00:00"
            slotDuration="01:00:00"
            allDaySlot={false}
            weekends={false}
            height="auto"
            events={events}
            selectable
            selectMirror
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            editable
            eventDurationEditable
            eventStartEditable
            dayHeaderFormat={{ weekday: 'long' }}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          />
        </div>
      </div>

      {/* Conflict modal */}
      <Modal open={conflictModal} onClose={() => setConflictModal(false)} title="Conflit d'horaire">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-lg">
            <AlertTriangle size={18} />
            <span className="text-sm font-medium">Un conflit a été détecté</span>
          </div>
          <p className="text-sm text-gray-500">Les créneaux suivants occupent déjà cet horaire :</p>
          {conflicts.map((c) => (
            <div key={c.idTemps} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg text-sm">
              <span className="font-medium">{c.cours || '?'}</span>
              <span className="text-gray-400">{c.jour} {c.heure}</span>
              {c.enseignant && <span className="text-xs text-gray-400">· {c.enseignant}</span>}
              {c.salle && <span className="text-xs text-gray-400">· {c.salle}</span>}
            </div>
          ))}
          <button onClick={() => setConflictModal(false)} className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
            J'ai compris
          </button>
        </div>
      </Modal>

      {/* Course modal */}
      <Modal open={courseModal} onClose={() => setCourseModal(false)} title={t('course.add')}>
        <form onSubmit={async (e) => { e.preventDefault(); if (!courseForm.idClasse) { toast.error('Sélectionnez une classe'); return }; await courseAPI.create(courseForm); toast.success(t('toast.saved')); setCourseModal(false); setCourseForm({ libelle: '', coefficient: 1, idClasse: 0 }); load() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t('course.libelle')}</label><input type="text" value={courseForm.libelle} onChange={(e) => setCourseForm({ ...courseForm, libelle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('course.coefficient')}</label><input type="number" min={1} max={5} value={courseForm.coefficient} onChange={(e) => setCourseForm({ ...courseForm, coefficient: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Classe</label><select value={courseForm.idClasse} onChange={(e) => setCourseForm({ ...courseForm, idClasse: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm"><option value={0}>--</option>{classes.map((c) => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}</select></div>
          <button type="submit" className="w-full py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium">{t('common.save')}</button>
        </form>
      </Modal>

      {/* Slot modal */}
      <Modal open={slotModal} onClose={() => { setSlotModal(false); setSlotInfo(null) }} title={slotInfo?.idTemps ? t('timetable.edit') : t('timetable.add')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {slotInfo?.jour} &middot; {slotInfo?.heure}
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Cycle</label>
            <select value={slotForm.idCycle} onChange={(e) => setSlotForm({ ...slotForm, idCycle: parseInt(e.target.value), idClasse: 0 })} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value={0}>--</option>
              {cycles.map((cy) => <option key={cy.idCycle} value={cy.idCycle}>{cy.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Classe</label>
            <select value={slotForm.idClasse} onChange={(e) => setSlotForm({ ...slotForm, idClasse: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value={0}>--</option>
              {filteredClassesByCycle.map((cl) => <option key={cl.idClasse} value={cl.idClasse}>{cl.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('timetable.course')}</label>
            <select value={slotForm.idCours} onChange={(e) => setSlotForm({ ...slotForm, idCours: parseInt(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value={0}>--</option>
              {filteredCourses.map((c) => <option key={c.idCours} value={c.idCours}>{c.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.title')}</label>
            <select value={slotForm.idEnseignant} onChange={(e) => setSlotForm({ ...slotForm, idEnseignant: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value={0}>--</option>
              {teachers.filter((t) => t.actif).map((t) => <option key={t.idEnseignant} value={t.idEnseignant}>{t.nom} {t.prenom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('classroom.title')}</label>
            <select value={slotForm.idSalle} onChange={(e) => setSlotForm({ ...slotForm, idSalle: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value={0}>--</option>
              {salles.filter((s) => s.actif).map((s) => <option key={s.idSalle} value={s.idSalle}>{s.libelle}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            {slotInfo?.idTemps && (
              <button onClick={handleDeleteEntry} className="flex-1 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition">
                {t('common.delete')}
              </button>
            )}
            <button onClick={handleSlotSave} className="flex-1 py-2 bg-cameroon-green text-white rounded-lg text-sm font-medium hover:bg-cameroon-green-light transition">
              {t('common.save')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Hidden printable area */}
      <div ref={printRef} style={{ display: 'none' }} />
    </div>
  )
}
