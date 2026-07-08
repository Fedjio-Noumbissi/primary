import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, X } from 'lucide-react'

interface ComboboxProps {
  label: string
  placeholder?: string
  fetchFn: (q: string) => Promise<{ data: { idParent?: number; idPers?: number; nom: string; prenom: string; email?: string; mobile?: string }[] }>
  onSelect: (item: { idParent?: number; idPers?: number; nom: string; prenom: string; email?: string; mobile?: string } | null) => void
  selectedLabel?: string | null
  required?: boolean
  error?: string
}

export default function Combobox({ label, placeholder, fetchFn, onSelect, selectedLabel, required, error }: ComboboxProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ idParent?: number; idPers?: number; nom: string; prenom: string; email?: string; mobile?: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim() || selected) { setResults([]); return }
    setLoading(true)
    const timer = setTimeout(() => {
      fetchFn(query.trim()).then(res => {
        setResults(res.data)
        setLoading(false)
        setOpen(true)
      }).catch(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [query, fetchFn, selected])

  const handleSelect = (item: { idParent?: number; idPers?: number; nom: string; prenom: string; email?: string; mobile?: string }) => {
    setSelected(true)
    setQuery(`${item.nom} ${item.prenom}`.trim())
    setOpen(false)
    onSelect(item)
  }

  const handleClear = () => {
    setSelected(false)
    setQuery('')
    setResults([])
    onSelect(null)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
        {label} {required && '*'}
      </label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={selected ? (selectedLabel || query) : query}
          onChange={e => { setSelected(false); setQuery(e.target.value) }}
          onFocus={() => { if (!selected && query.trim()) setOpen(true) }}
          placeholder={placeholder || 'Rechercher...'}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
        />
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
        {selected && !loading && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((item, i) => (
            <li key={item.idParent || item.idPers || i}>
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-cameroon-green/5 dark:hover:bg-cameroon-green/10 transition border-b border-gray-100 dark:border-slate-700 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-cameroon-green/10 text-cameroon-green flex items-center justify-center text-xs font-bold shrink-0">
                  {item.nom?.[0]}{item.prenom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{item.nom} {item.prenom}</p>
                  <p className="text-xs text-gray-400 truncate">{item.email || item.mobile || '-'}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim() && results.length === 0 && !selected && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl p-4 text-center text-sm text-gray-400">
          Aucun parent trouvé
        </div>
      )}
    </div>
  )
}
