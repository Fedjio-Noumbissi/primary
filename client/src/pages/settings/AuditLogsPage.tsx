import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { auditAPI, userAPI } from '../../services/api'
import { AuditLog, User } from '../../types'
import LoadingSkeleton from '../../components/LoadingSkeleton'
import { formatDate } from '../../utils/formatters'
import { ScrollText, Filter } from 'lucide-react'

const ACTION_OPTIONS = ['CREATE', 'UPDATE', 'DELETE']

export default function AuditLogsPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [userId, setUserId] = useState('')
  const [action, setAction] = useState('')
  const perPage = 30

  const load = () => {
    setLoading(true)
    Promise.all([
      auditAPI.getLogs({ page, limit: perPage, ...(userId ? { userId: Number(userId) } : {}), ...(action ? { action } : {}) }),
      userAPI.getAll(),
    ]).then(([lRes, uRes]) => {
      setLogs(lRes.data.data)
      setTotal(lRes.data.total)
      setUsers(uRes.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [page, userId, action])

  const totalPages = Math.ceil(total / perPage)

  const actionBadge = (act: string) => {
    const map: Record<string, string> = {
      CREATE: 'bg-green-50 text-green-600',
      UPDATE: 'bg-blue-50 text-blue-600',
      DELETE: 'bg-red-50 text-red-600',
    }
    return <span className={`text-xs px-2 py-0.5 rounded font-medium ${map[act] || 'bg-gray-50 text-gray-600'}`}>{act}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText size={24} className="text-cameroon-green" />
          Journal d'Audit
        </h1>
        <span className="text-sm text-gray-400">{total} entrée(s)</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
        <Filter size={16} className="text-gray-400" />
        <select value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1) }} className="px-3 py-1.5 border rounded-lg text-sm min-w-[200px]">
          <option value="">Tous les utilisateurs</option>
          {users.filter((u) => u.typePersonne === 1).map((u) => (
            <option key={u.idPers} value={u.idPers}>{u.nom} {u.prenom}</option>
          ))}
        </select>
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} className="px-3 py-1.5 border rounded-lg text-sm min-w-[150px]">
          <option value="">Toutes les actions</option>
          {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-xs text-gray-400">{(page - 1) * perPage + 1}–{Math.min(page * perPage, total)}</span>
      </div>

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Utilisateur</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Entité</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Détails</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucune entrée</td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{log.adminName}</td>
                    <td className="px-4 py-3">{actionBadge(log.action)}</td>
                    <td className="px-4 py-3">{log.entity}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{log.entityId ?? '—'}</td>
                    <td className="px-4 py-3">
                      {log.details ? (
                        <span className="text-xs text-gray-500 max-w-[200px] block truncate" title={JSON.stringify(log.details)}>
                          {log.details.body ? Object.keys(log.details.body).join(', ') : JSON.stringify(log.details).slice(0, 60)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
              <span>Page {page} / {totalPages}</span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">&lt;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1">...</span>}
                      <button onClick={() => setPage(p)} className={`px-3 py-1 border rounded ${p === page ? 'bg-cameroon-green text-white border-cameroon-green' : 'hover:bg-gray-50'}`}>{p}</button>
                    </span>
                  ))}
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">&gt;</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
