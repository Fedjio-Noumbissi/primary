import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface DataTableProps {
  columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[]
  data: any[]
  search?: string
  onSearch?: (val: string) => void
  actions?: (row: any) => React.ReactNode
  loading?: boolean
  filters?: React.ReactNode
  selectable?: boolean
  selectedIds?: Set<number>
  onSelectionChange?: (ids: Set<number>) => void
  rowId?: (row: any) => number
}

export default function DataTable({ columns, data, search, onSearch, actions, loading, filters, selectable, selectedIds, onSelectionChange, rowId }: DataTableProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const perPage = 10

  const totalPages = Math.ceil(data.length / perPage)
  const paginated = data.slice((page - 1) * perPage, page * perPage)

  const allSelected = selectable && paginated.length > 0 && paginated.every((row) => selectedIds?.has(rowId?.(row) ?? row.matricule ?? row.id))

  function toggleAll() {
    if (!onSelectionChange || !rowId) return
    if (allSelected) {
      const next = new Set(selectedIds)
      paginated.forEach((row) => next.delete(rowId(row)))
      onSelectionChange(next)
    } else {
      const next = new Set(selectedIds)
      paginated.forEach((row) => next.add(rowId(row)))
      onSelectionChange(next)
    }
  }

  function toggleOne(row: any) {
    if (!onSelectionChange || !rowId) return
    const id = rowId(row)
    const next = new Set(selectedIds)
    if (next.has(id)) { next.delete(id) } else { next.add(id) }
    onSelectionChange(next)
  }

  const colCount = columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)

  return (
    <div>
          {(search !== undefined || onSearch || filters) && (
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          {(search !== undefined || onSearch) && (
            <input
              type="text"
              value={search}
              onChange={(e) => { onSearch?.(e.target.value); setPage(1) }}
              placeholder={t('common.search')}
              className="w-full max-w-sm px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
          )}
          {filters}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80">
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300 text-cameroon-green focus:ring-cameroon-green" />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-slate-300">
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-slate-300">{t('common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-slate-700">
                  {Array.from({ length: colCount }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => {
                const id = rowId?.(row) ?? row.matricule ?? row.id
                return (
                  <tr key={id} className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition ${selectable && selectedIds?.has(id) ? 'bg-cameroon-green/5' : ''}`}>
                    {selectable && (
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds?.has(id) ?? false} onChange={() => toggleOne(row)} className="rounded border-gray-300 text-cameroon-green focus:ring-cameroon-green" />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-gray-700 dark:text-slate-300">
                        {col.render ? col.render(row) : row[col.key] ?? '-'}
                      </td>
                    ))}
                    {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-slate-400">
          <span>
            {t('common.page')} {page} {t('common.of')} {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 text-gray-700 dark:text-slate-300"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded ${
                      p === page ? 'bg-cameroon-green text-white border-cameroon-green' : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 text-gray-700 dark:text-slate-300"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
