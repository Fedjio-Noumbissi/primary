import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { mockStudents, mockEvaluations, mockCourses, mockTrimestres, mockAnnees, mockClasses } from '../../services/mockData'
import { calculateAverage, getAppreciation, getGradeColor } from '../../utils/grading'
import { REPUBLIC_HEADER_FR, REPUBLIC_HEADER_EN, DAYS } from '../../utils/constants'
import { formatCurrency } from '../../utils/formatters'
import { Printer } from 'lucide-react'

export default function ReportPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'fr' | 'en'
  const [matricule, setMatricule] = useState(0)
  const [idTrimes, setIdTrimes] = useState(0)
  const printRef = useRef<HTMLDivElement>(null)

  const student = mockStudents.find((s) => s.matricule === matricule)
  const trimester = mockTrimestres.find((t) => t.idTrimes === idTrimes)
  const year = trimester ? mockAnnees.find((a) => a.idAnnee === trimester.idAca) : null
  const grades = mockEvaluations.filter((e) => e.matricule === matricule)

  const gradedCourses = mockCourses
    .filter((c) => grades.some((g) => g.idCours === c.idCours))
    .map((c) => {
      const g = grades.find((gr) => gr.idCours === c.idCours)
      return { ...c, note: g?.note || 0 }
    })

  const avg = calculateAverage(gradedCourses.map((c) => ({ note: c.note, coefficient: c.coefficient })))

  const handlePrint = () => {
    const w = window.open('', '_blank')
    if (!w || !printRef.current) return
    w.document.write(`<html><head><title>${t('report.title')}</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 20px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: center; font-size: 13px; }
        th { background: #f0f0f0; font-weight: bold; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 18px; margin: 4px 0; }
        .header h2 { font-size: 16px; margin: 4px 0; }
        .student-info { margin: 16px 0; }
        .student-info td { border: none; text-align: left; padding: 2px 8px; }
        .signature-line { border-top: 1px solid black; margin-top: 40px; padding-top: 4px; width: 200px; text-align: center; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; }
        .rank { font-weight: bold; font-size: 15px; }
        @media print { body { padding: 0; } }
      </style></head><body>`)
    w.document.write(printRef.current.innerHTML)
    w.document.write('</body></html>')
    w.document.close()
    w.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('report.title')}</h1>
        <button
          onClick={handlePrint}
          disabled={!matricule || !idTrimes}
          className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm hover:bg-cameroon-green-light transition disabled:opacity-50"
        >
          <Printer size={16} /> {t('report.print')}
        </button>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">{t('report.student')}</label>
            <select value={matricule} onChange={(e) => setMatricule(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">{t('common.select')}</option>
              {mockStudents.filter((s) => s.actif).map((s) => (
                <option key={s.matricule} value={s.matricule}>{s.nom} {s.prenom} — {s.classe}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('report.trimester')}</label>
            <select value={idTrimes} onChange={(e) => setIdTrimes(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">{t('common.select')}</option>
              {mockTrimestres.map((t) => (
                <option key={t.idTrimes} value={t.idTrimes}>{t.libelle}</option>
              ))}
            </select>
          </div>
        </div>

        {student && trimester && (
          <div ref={printRef} className="report-card">
            <div className="header" style={{ textAlign: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>
                {lang === 'fr' ? REPUBLIC_HEADER_FR : REPUBLIC_HEADER_EN}
              </p>
              <p style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '8px' }}>{t('report.header').toUpperCase()}</p>
              <p style={{ fontSize: '14px', marginTop: '4px' }}>{t('app.subtitle')}</p>
              <p style={{ fontSize: '13px' }}>{year?.libelle}</p>
            </div>

            <table className="student-info" style={{ width: '100%', marginBottom: '16px' }}>
              <tbody>
                <tr><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px', fontWeight: 'bold' }}>{t('student.nom')}:</td><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px' }}>{student.nom} {student.prenom}</td></tr>
                <tr><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px', fontWeight: 'bold' }}>{t('student.matricule')}:</td><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px' }}>{student.matricule}</td></tr>
                <tr><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px', fontWeight: 'bold' }}>{t('student.classe')}:</td><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px' }}>{student.classe}</td></tr>
                <tr><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px', fontWeight: 'bold' }}>{t('academic.trimestre')}:</td><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px' }}>{trimester.libelle}</td></tr>
              </tbody>
            </table>

            <table id="grades-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #333', padding: '6px 8px', background: '#f0f0f0' }}>{t('report.subject')}</th>
                  <th style={{ border: '1px solid #333', padding: '6px 8px', background: '#f0f0f0' }}>{t('report.grade')} /20</th>
                  <th style={{ border: '1px solid #333', padding: '6px 8px', background: '#f0f0f0' }}>{t('report.coef')}</th>
                  <th style={{ border: '1px solid #333', padding: '6px 8px', background: '#f0f0f0' }}>{t('report.weighted')}</th>
                  <th style={{ border: '1px solid #333', padding: '6px 8px', background: '#f0f0f0' }}>{t('grade.appreciation')}</th>
                </tr>
              </thead>
              <tbody>
                {gradedCourses.map((c) => (
                  <tr key={c.idCours}>
                    <td style={{ border: '1px solid #333', padding: '6px 8px', textAlign: 'left' }}>{c.libelle}</td>
                    <td style={{ border: '1px solid #333', padding: '6px 8px', color: getGradeColor(c.note).replace('text-', '') }}>{c.note}</td>
                    <td style={{ border: '1px solid #333', padding: '6px 8px' }}>{c.coefficient}</td>
                    <td style={{ border: '1px solid #333', padding: '6px 8px' }}>{(c.note * c.coefficient).toFixed(1)}</td>
                    <td style={{ border: '1px solid #333', padding: '6px 8px' }}>{getAppreciation(c.note, lang)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ border: '1px solid #333', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                    {t('grade.average')}: <span style={{ fontSize: '16px' }}>{avg.toFixed(2)} /20</span>
                  </td>
                  <td style={{ border: '1px solid #333', padding: '6px 8px', fontWeight: 'bold' }}>
                    {getAppreciation(avg, lang)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p>{t('report.teacherComment')}:</p>
                <div className="signature-line" style={{ borderTop: '1px solid black', marginTop: '40px', paddingTop: '4px', width: '200px', textAlign: 'center' }}>
                  {t('report.principalSignature')}
                </div>
              </div>
              <div className="signature-line" style={{ borderTop: '1px solid black', marginTop: '40px', paddingTop: '4px', width: '200px', textAlign: 'center' }}>
                {t('report.parentSignature')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
