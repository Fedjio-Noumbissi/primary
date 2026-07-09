import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { dashboardAPI, studentAPI, paymentAPI } from '../../services/api'
import { Paiement, Scolarite, Tranche } from '../../types'
import { CreditCard, RefreshCw, Download, GraduationCap, CheckCircle, Clock } from 'lucide-react'
import StatCard from '../../components/StatCard'
import DataTable from '../../components/DataTable'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { formatCurrency, formatDate } from '../../utils/formatters'

interface ChildData {
  matricule: number
  nom: string
  prenom: string
  idClasse?: number
  classe?: string
  salle?: string
}

export default function ParentPayments() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [children, setChildren] = useState<ChildData[]>([])
  const [selectedMatricule, setSelectedMatricule] = useState<number | null>(null)
  const [payments, setPayments] = useState<Paiement[]>([])
  const [scolarite, setScolarite] = useState<Scolarite | null>(null)
  const [tranches, setTranches] = useState<Tranche[]>([])
  const [paidTrancheIds, setPaidTrancheIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadChildren = () => {
    if (!user?.idPers) { setLoading(false); setError(true); return }
    setLoading(true)
    setError(false)
    dashboardAPI.getParentData(user.idPers)
      .then((res) => {
        const kids = res.data.children || []
        setChildren(kids)
        if (kids.length > 0) setSelectedMatricule(kids[0].matricule)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadChildren() }, [user])

  useEffect(() => {
    if (!selectedMatricule) return
    setPayments([])
    setScolarite(null)
    setTranches([])
    setPaidTrancheIds([])
    const child = children.find((c) => c.matricule === selectedMatricule)
    const promises: Promise<any>[] = [
      studentAPI.getPayments(selectedMatricule),
      paymentAPI.getPaidTranches(selectedMatricule),
    ]
    if (child?.idClasse) {
      promises.push(paymentAPI.getScolariteByClasse(child.idClasse))
    }
    Promise.all(promises).then(([payRes, paidRes, scolRes]) => {
      setPayments(payRes.data || [])
      setPaidTrancheIds(paidRes.data || [])
      if (scolRes) {
        setScolarite(scolRes.data.scolarite)
        setTranches(scolRes.data.tranches || [])
      }
    }).catch(() => {})
  }, [selectedMatricule, children])

  if (loading) return <LoadingSkeleton rows={4} />
  if (error) return (
    <div className="text-center py-10">
      <p className="text-red-500 font-medium">Erreur de chargement</p>
      <p className="text-gray-400 text-sm mt-1">Impossible de charger les données.</p>
      <button onClick={loadChildren} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cameroon-green text-white rounded-lg text-sm">
        <RefreshCw size={16} /> Réessayer
      </button>
    </div>
  )

  const child = children.find((c) => c.matricule === selectedMatricule) || children[0]
  if (!child) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('parent.payments')}</h1>
      <p className="text-gray-500 italic">{t('common.noData')}</p>
    </div>
  )

  const totalPaid = payments.reduce((s, p) => s + p.montant, 0)
  const totalDue = (scolarite?.inscription || 0) + (scolarite?.pension || 0)
  const remaining = Math.max(0, totalDue - totalPaid)

  const columns = [
    { key: 'datePaie', label: 'Date', render: (p: Paiement) => formatDate(p.datePaie) },
    { key: 'montant', label: 'Montant', render: (p: Paiement) => <span className="font-semibold">{formatCurrency(p.montant)}</span> },
    { key: 'mode', label: 'Mode', render: (p: Paiement) => p.mode || '—' },
    {
      key: 'idPaie', label: 'Reçu', render: (p: Paiement) => (
        <a
          href={`/api/paiements/${p.idPaie}/receipt`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-cameroon-green hover:text-green-700 text-sm"
        >
          <Download size={14} /> PDF
        </a>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Paiements — {user?.nom} {user?.prenom}
      </h1>

      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((c) => (
            <button
              key={c.matricule}
              onClick={() => setSelectedMatricule(c.matricule)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                selectedMatricule === c.matricule
                  ? 'bg-cameroon-green text-white border-cameroon-green'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-cameroon-green'
              }`}
            >
              <GraduationCap size={14} className="inline mr-1" />
              {c.nom} {c.prenom}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Informations de l'élève</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Nom</p>
            <p className="font-medium">{child.nom} {child.prenom}</p>
          </div>
          <div>
            <p className="text-gray-400">Matricule</p>
            <p className="font-medium">{child.matricule}</p>
          </div>
          <div>
            <p className="text-gray-400">Classe</p>
            <p className="font-medium">{child.classe || child.salle || '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total versé" value={formatCurrency(totalPaid)} icon={<CreditCard size={22} />} color="text-green-600" />
        {totalDue > 0 && (
          <StatCard title="Scolarité" value={formatCurrency(totalDue)} icon={<CreditCard size={22} />} />
        )}
        {totalDue > 0 && (
          <StatCard title="Reste à payer" value={formatCurrency(remaining)} icon={<CreditCard size={22} />} color={remaining > 0 ? 'text-red-600' : 'text-green-600'} />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Échéancier (tranches)</h3>
        {tranches.length > 0 ? (
          <div className="space-y-2">
            {tranches.map((tr) => {
              const paid = paidTrancheIds.includes(tr.idTranche)
              return (
                <div key={tr.idTranche} className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm border ${
                  paid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {paid ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <Clock size={18} className="text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium">{tr.libelle}</p>
                      <p className="text-gray-400 text-xs">
                        {tr.date_limite ? `Échéance : ${formatDate(tr.date_limite)}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${paid ? 'text-green-700' : 'text-gray-700'}`}>
                    {formatCurrency(tr.montant)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Aucun échéancier défini pour cette classe</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Historique des paiements</h3>
        {payments.length > 0 ? (
          <DataTable columns={columns} data={payments} rowId={(r) => r.idPaie} />
        ) : (
          <p className="text-sm text-gray-400 italic">{t('common.noData')}</p>
        )}
      </div>
    </div>
  )
}
