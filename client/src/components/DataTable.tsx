import { useTranslation } from 'react-i18next'

interface DataTableProps {
  columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[]
  data: any[]
  search?: string
  onSearch?: (val: string) => void
  actions?: (row: any) => React.ReactNode
  loading?: boolean
  filters?: React.ReactNode
}

export default function DataTable({ columns, data, search, onSearch, actions, loading, filters }: DataTableProps) {
  const { t } = useTranslation()
  const [page, setPage] = React.useState(1)
  const perPage = 10

  const totalPages = Math.ceil(data.length / perPage)
  const paginated = data.slice((page - 1) * perPage, page * perPage)

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
              className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green focus:border-transparent"
            />
          )}
          {filters}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-medium text-gray-600">
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right font-medium text-gray-600">{t('common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-gray-400">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render(row) : row[col.key] ?? '-'}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            {t('common.page')} {page} {t('common.of')} {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
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
                      p === page ? 'bg-cameroon-green text-white border-cameroon-green' : 'hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import React from 'react'
