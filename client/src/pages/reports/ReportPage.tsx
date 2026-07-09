import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { reportAPI, studentAPI, courseAPI, academicAPI, classAPI } from '../../services/api'
import { calculateAverage, getAppreciation, getGradeColor } from '../../utils/grading'
import { REPUBLIC_HEADER_FR, REPUBLIC_HEADER_EN } from '../../utils/constants'
import { Printer, Loader2 } from 'lucide-react'
import LoadingSkeleton from '../../components/LoadingSkeleton'

function buildReportHtml(student: any, trimester: any, courses: any[], lang: 'fr' | 'en', t: any, discCount: number) {
  const grades = (student.evaluations || []).map((e: any) => {
    const c = courses.find((co: any) => co.idCours === e.idCours)
    return { ...c, note: e.note, idCours: e.idCours }
  }).filter((g: any) => g.libelle)

  const disc = student.discipline || []
  const discTotal = disc.reduce((s: number, d: any) => s + d.points, 0)
  const avg = grades.length > 0
    ? calculateAverage(grades.map((c: any) => ({ note: c.note, coefficient: c.coefficient })))
    : 0
  const adjustedAvg = avg - discTotal

  return `<div class="report-page">
    <div class="header">
      <p class="repub">${lang === 'fr' ? REPUBLIC_HEADER_FR : REPUBLIC_HEADER_EN}</p>
      <p class="main-title">${t('report.header').toUpperCase()}</p>
      <p class="subtitle">${t('app.subtitle')}</p>
      <p class="year">${trimester?.libelle || ''}</p>
    </div>

    <table class="student-info">
      <tr><td class="label">${t('student.nom')}:</td><td>${student.nom} ${student.prenom}</td></tr>
      <tr><td class="label">${t('student.matricule')}:</td><td>${student.matricule}</td></tr>
      <tr><td class="label">${t('student.classe')}:</td><td>${student.classe || '—'}</td></tr>
      <tr><td class="label">${t('academic.trimestre')}:</td><td>${trimester?.libelle || '—'}</td></tr>
    </table>

    <table class="grades">
      <thead><tr>
        <th>${t('report.subject')}</th>
        <th>${t('report.grade')} /20</th>
        <th>${t('report.coef')}</th>
        <th>${t('report.weighted')}</th>
        <th>${t('grade.appreciation')}</th>
      </tr></thead>
      <tbody>
        ${grades.length === 0 ? '<tr><td colspan="5" style="color:#999">' + t('common.noData') + '</td></tr>' : ''}
        ${grades.map((c: any) => `
          <tr>
            <td class="left">${c.libelle}</td>
            <td style="color:${getGradeColor(c.note).replace('text-', '')}">${c.note}</td>
            <td>${c.coefficient}</td>
            <td>${(c.note * c.coefficient).toFixed(1)}</td>
            <td>${getAppreciation(c.note, lang)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot><tr>
        <td colspan="4" class="avg-label">${t('grade.average')}: <span class="avg-value">${discTotal !== 0 ? `${avg.toFixed(2)} → ${Math.max(0, Math.min(20, adjustedAvg)).toFixed(2)}` : avg.toFixed(2)} /20</span>
          ${discTotal !== 0 ? `<span class="disc-adj"> (${discTotal > 0 ? '-' : '+'}${Math.abs(discTotal)} ${lang === 'fr' ? 'pts discipline' : 'disc. pts'})</span>` : ''}
        </td>
        <td class="avg-appr">${getAppreciation(Math.max(0, Math.min(20, adjustedAvg)), lang)}</td>
      </tr></tfoot>
    </table>

    <h3 class="disc-title">${lang === 'fr' ? 'Discipline / Conduite' : 'Discipline / Behaviour'}</h3>
    <p class="disc-info">${disc.length} événement(s) — Total: ${disc.reduce((s: number, d: any) => s + d.points, 0)} points</p>
    ${disc.length > 0 ? `
      <table class="discipline">
        <thead><tr>
          <th>${lang === 'fr' ? 'Date' : 'Date'}</th>
          <th>${lang === 'fr' ? 'Événement' : 'Event'}</th>
          <th>${lang === 'fr' ? 'Points' : 'Points'}</th>
          <th>${lang === 'fr' ? 'Commentaire' : 'Comment'}</th>
        </tr></thead>
        <tbody>
          ${disc.map((d: any) => `
            <tr>
              <td>${d.event_date ? new Date(d.event_date).toLocaleDateString(lang === 'fr' ? 'fr' : 'en') : '—'}</td>
              <td class="left">${d.libelle}</td>
              <td style="color:${d.points > 0 ? 'red' : 'green'};font-weight:bold">${d.points > 0 ? '-' + d.points : '+' + Math.abs(d.points)}</td>
              <td class="left">${d.commentaire || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : `<p class="disc-info">${lang === 'fr' ? 'Aucun événement disciplinaire' : 'No discipline events'}</p>`}

    <div class="footer">
      <div>
        <p>${t('report.teacherComment')}:</p>
        <div class="sig">${t('report.principalSignature')}</div>
      </div>
      <div class="sig">${t('report.parentSignature')}</div>
    </div>
  </div>`
}

export default function ReportPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'fr' | 'en'
  const [students, setStudents] = useState<any[]>([])
  const [trimestres, setTrimestres] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [cycles, setCycles] = useState<any[]>([])
  const [annees, setAnnees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)
  const [filterClasse, setFilterClasse] = useState('')
  const [selectedMatricules, setSelectedMatricules] = useState<Set<number>>(new Set())
  const [idTrimes, setIdTrimes] = useState(0)

  const activeAnnee = annees.find((a: any) => a.actif)
  const activeTrimestres = trimestres.filter((t: any) => !activeAnnee || t.idAca === activeAnnee.idAnnee)

  useEffect(() => {
    Promise.all([
      studentAPI.getAll(),
      academicAPI.getTrimestres(),
      courseAPI.getAll(),
      classAPI.getClasses(),
      classAPI.getCycles(),
      academicAPI.getAnnees(),
    ]).then(([sRes, tRes, cRes, clRes, cyRes, aRes]) => {
      setStudents(sRes.data)
      setTrimestres(tRes.data)
      setCourses(cRes.data)
      setClasses(clRes.data)
      setCycles(cyRes.data)
      setAnnees(aRes.data)
      setLoading(false)
    })
  }, [])

  const activeCycleIds = new Set(cycles.map((c: any) => c.idCycle))
  const visibleClasses = classes.filter((c: any) => activeCycleIds.has(c.idCycle))
    .sort((a: any, b: any) => a.idClasse - b.idClasse)

  const filteredStudents = students.filter((s: any) => s.actif && (!filterClasse || s.classe === filterClasse))

  const toggleStudent = (matricule: number) => {
    setSelectedMatricules((prev) => {
      const next = new Set(prev)
      if (next.has(matricule)) next.delete(matricule)
      else next.add(matricule)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedMatricules.size === filteredStudents.length) {
      setSelectedMatricules(new Set())
    } else {
      setSelectedMatricules(new Set(filteredStudents.map((s: any) => s.matricule)))
    }
  }

  const trimester = trimestres.find((t: any) => t.idTrimes === idTrimes)

  async function handlePrint() {
    if (selectedMatricules.size === 0 || !idTrimes) return
    setPrinting(true)
    try {
      const matricules = Array.from(selectedMatricules)
      const results = await Promise.allSettled(
        matricules.map((mat) => reportAPI.generate(mat, idTrimes).then((r) => r.data))
      )
      const allHtml = results.filter((r) => r.status === 'fulfilled').map((r: any) => {
        const data = r.value
        const discCount = (data.discipline || []).length
        return buildReportHtml(
          { ...data.student, evaluations: data.evaluations, discipline: data.discipline },
          data.trimestre,
          courses,
          lang,
          t,
          discCount
        )
      }).join('<div class="page-break"></div>')

      const w = window.open('', '_blank')
      if (!w) { setPrinting(false); return }
      w.document.write(`<html><head><title>${t('report.title')}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 20px; font-size: 14px; margin: 0; }
          .report-page { page-break-after: always; }
          .report-page:last-child { page-break-after: auto; }
          .page-break { page-break-before: always; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 6px 8px; text-align: center; font-size: 13px; }
          th { background: #f0f0f0; font-weight: bold; }
          .header { text-align: center; margin-bottom: 16px; }
          .repub { font-size: 13px; font-weight: bold; letter-spacing: 1px; }
          .main-title { font-size: 15px; font-weight: bold; margin-top: 8px; }
          .subtitle { font-size: 14px; margin-top: 4px; }
          .year { font-size: 13px; }
          .student-info { margin-bottom: 16px; }
          .student-info td { border: none; text-align: left; padding: 2px 8px; }
          .student-info .label { font-weight: bold; }
          .left { text-align: left; }
          .avg-label { text-align: right; font-weight: bold; }
          .avg-value { font-size: 16px; }
          .avg-appr { font-weight: bold; }
          .disc-title { font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 8px; }
          .disc-info { font-size: 12px; color: #666; margin: 4px 0 8px; }
          .disc-adj { font-size: 12px; color: #888; margin-left: 4px; }
          .sig { border-top: 1px solid black; margin-top: 40px; padding-top: 4px; width: 200px; text-align: center; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; }
          @media print { body { padding: 0; } }
        </style></head><body>`)
      w.document.write(allHtml)
      w.document.write('</body></html>')
      w.document.close()
      w.print()
    } catch (err) {
      console.error('Print error:', err)
    } finally {
      setPrinting(false)
    }
  }

  if (loading) return <LoadingSkeleton rows={8} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('report.title')}</h1>
        <button
          onClick={handlePrint}
          disabled={selectedMatricules.size === 0 || !idTrimes || printing}
          className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition disabled:opacity-50"
        >
          {printing ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
          {t('report.print')} ({selectedMatricules.size})
        </button>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('student.classe')}</label>
            <select value={filterClasse} onChange={(e) => { setFilterClasse(e.target.value); setSelectedMatricules(new Set()) }} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">{lang === 'fr' ? 'Toutes les classes' : 'All classes'}</option>
              {visibleClasses.map((cl: any) => (
                <option key={cl.idClasse} value={cl.libelle}>{cl.libelle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('report.trimester')}</label>
            <select value={idTrimes} onChange={(e) => { setIdTrimes(parseInt(e.target.value)); setSelectedMatricules(new Set()) }} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">{t('common.select')}</option>
              {activeTrimestres.map((t: any) => (
                <option key={t.idTrimes} value={t.idTrimes}>{t.libelle}</option>
              ))}
              <option disabled>— {activeAnnee?.libelle || ''} —</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={filteredStudents.length > 0 && selectedMatricules.size === filteredStudents.length} onChange={toggleAll} className="rounded" />
            <span className="font-medium">{lang === 'fr' ? 'Tous sélectionner' : 'Select all'}</span>
          </label>
          <span className="text-xs text-gray-400">{selectedMatricules.size}/{filteredStudents.length} {lang === 'fr' ? 'élève(s)' : 'student(s)'}</span>
        </div>

        <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
          {filteredStudents.length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">{t('common.noData')}</p>
          )}
          {filteredStudents.map((s: any) => (
            <label key={s.matricule} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selectedMatricules.has(s.matricule)}
                onChange={() => toggleStudent(s.matricule)}
                className="rounded"
              />
              <span className="font-medium">{s.nom} {s.prenom}</span>
              <span className="text-xs text-gray-400 ml-auto">{s.classe}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
