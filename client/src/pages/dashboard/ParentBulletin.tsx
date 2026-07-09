import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { dashboardAPI, academicAPI, reportAPI } from '../../services/api'
import { Printer } from 'lucide-react'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { REPUBLIC_HEADER_FR, REPUBLIC_HEADER_EN } from '../../utils/constants'
import { calculateAverage, getAppreciation, getGradeColor } from '../../utils/grading'

interface Child {
  matricule: number
  nom: string
  prenom: string
  classe?: string
}

interface Trimestre {
  idTrimes: number
  libelle: string
  idAca: number
}

interface Annee {
  idAnnee: number
  libelle: string
  actif?: boolean
}

interface ReportData {
  student: any
  trimestre: any
  evaluations: any[]
}

export default function ParentBulletin() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'fr' | 'en'
  const { user } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<number | null>(null)
  const [annees, setAnnees] = useState<Annee[]>([])
  const [trimestres, setTrimestres] = useState<Trimestre[]>([])
  const [selectedTrimes, setSelectedTrimes] = useState<number | null>(null)
  const [annee, setAnnee] = useState<Annee | null>(null)
  const [trimestre, setTrimestre] = useState<Trimestre | null>(null)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user?.idPers) { setLoading(false); setError(true); return }
    Promise.all([
      dashboardAPI.getParentData(user.idPers),
      academicAPI.getAnnees(),
    ]).then(([childrenRes, anneesRes]) => {
      const kids = childrenRes.data.children || []
      setChildren(kids)
      setAnnees(anneesRes.data)
      if (kids.length > 0) setSelectedChild(kids[0].matricule)
      const activeAnnee = anneesRes.data.find((a: Annee) => a.actif) || anneesRes.data[0]
      if (activeAnnee) {
        setAnnee(activeAnnee)
        return academicAPI.getTrimestres(activeAnnee.idAnnee)
      }
    }).then((trimRes) => {
      if (trimRes) {
        setTrimestres(trimRes.data)
        if (trimRes.data.length > 0) setSelectedTrimes(trimRes.data[0].idTrimes)
      }
    }).catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!selectedChild || !selectedTrimes) return
    reportAPI.generate(selectedChild, selectedTrimes)
      .then((res) => {
        setReport(res.data)
        setTrimestre(res.data.trimestre)
      })
      .catch(() => {})
  }, [selectedChild, selectedTrimes])

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
        @media print { body { padding: 0; } }
      </style></head><body>`)
    w.document.write(printRef.current.innerHTML)
    w.document.write('</body></html>')
    w.document.close()
    w.print()
  }

  if (loading) return <LoadingSkeleton rows={4} />
  if (error) return <div className="text-center py-10"><p className="text-red-500 font-medium">{t('common.error')}</p></div>

  const child = children.find((c) => c.matricule === selectedChild) || children[0]

  const grades = report?.evaluations || []
  const studentInfo = report?.student
  const avg = grades.length > 0
    ? grades.reduce((s, g) => s + (g.note || 0), 0) / grades.length
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('report.title')}</h1>
        <button
          onClick={handlePrint}
          disabled={!report}
          className="flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm disabled:opacity-50"
        >
          <Printer size={16} /> {t('report.print')}
        </button>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map((c) => (
            <button
              key={c.matricule}
              onClick={() => setSelectedChild(c.matricule)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                selectedChild === c.matricule
                  ? 'bg-cameroon-green text-white border-cameroon-green'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-cameroon-green'
              }`}
            >
              {c.nom} {c.prenom}
            </button>
          ))}
        </div>
      )}

      {!child && (
        <p className="text-gray-500 italic">{t('common.noData')}</p>
      )}

      {child && (
        <div className="bg-white rounded-xl border p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">{t('report.trimester')}</label>
              <select
                value={selectedTrimes || ''}
                onChange={(e) => setSelectedTrimes(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">{t('common.select')}</option>
                {trimestres.map((tr) => (
                  <option key={tr.idTrimes} value={tr.idTrimes}>{tr.libelle}</option>
                ))}
              </select>
            </div>
          </div>

          {report && (
            <div ref={printRef} className="report-card">
              <div className="header" style={{ textAlign: 'center', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>
                  {lang === 'fr' ? REPUBLIC_HEADER_FR : REPUBLIC_HEADER_EN}
                </p>
                <p style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '8px' }}>{t('report.header').toUpperCase()}</p>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>{t('app.subtitle')}</p>
                <p style={{ fontSize: '13px' }}>{annee?.libelle}</p>
              </div>

              <table className="student-info" style={{ width: '100%', marginBottom: '16px' }}>
                <tbody>
                  <tr><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px', fontWeight: 'bold' }}>{t('student.nom')}:</td><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px' }}>{studentInfo?.nom} {studentInfo?.prenom}</td></tr>
                  <tr><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px', fontWeight: 'bold' }}>{t('student.matricule')}:</td><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px' }}>{studentInfo?.matricule}</td></tr>
                  <tr><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px', fontWeight: 'bold' }}>{t('student.classe')}:</td><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px' }}>{studentInfo?.classe}</td></tr>
                  <tr><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px', fontWeight: 'bold' }}>{t('academic.trimestre')}:</td><td style={{ border: 'none', textAlign: 'left', padding: '2px 8px' }}>{trimestre?.libelle}</td></tr>
                </tbody>
              </table>

              <table id="grades-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '6px 8px', background: '#f0f0f0' }}>{t('report.subject')}</th>
                    <th style={{ border: '1px solid #333', padding: '6px 8px', background: '#f0f0f0' }}>{t('report.grade')} /20</th>
                    <th style={{ border: '1px solid #333', padding: '6px 8px', background: '#f0f0f0' }}>{t('grade.appreciation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g: any) => (
                    <tr key={g.idEval}>
                      <td style={{ border: '1px solid #333', padding: '6px 8px', textAlign: 'left' }}>{g.matiere}</td>
                      <td style={{ border: '1px solid #333', padding: '6px 8px', color: getGradeColor(g.note).replace('text-', '') }}>{g.note}</td>
                      <td style={{ border: '1px solid #333', padding: '6px 8px' }}>{getAppreciation(g.note, lang)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #333', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
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
      )}
    </div>
  )
}
