import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { searchAPI } from '../services/api'
import type { SearchResult } from '../types'
import { Search, Users, GraduationCap, FileText, Loader2 } from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const items = useCallback(() => {
    if (!results) return [] as { type: string; label: string; path: string }[]
    const list: { type: string; label: string; path: string }[] = []
    results.students.forEach(s => list.push({ type: 'student', label: `${s.nom} ${s.prenom} — ${s.classe || '-'}`, path: `/admin/students/${s.matricule}` }))
    results.teachers.forEach(t => list.push({ type: 'teacher', label: `${t.nom} ${t.prenom} — ${t.classeLibelle || ''}`, path: '#' }))
    results.pages.forEach(p => list.push({ type: 'page', label: i18n.language === 'fr' ? p.label : p.labelEn, path: p.path }))
    return list
  }, [results, i18n.language])

  useEffect(() => {
    if (!open) { setQuery(''); setResults(null); return }
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults(null); return }
    setLoading(true)
    setSelectedIndex(0)
    const timer = setTimeout(() => {
      searchAPI.global(query.trim()).then(res => {
        setResults(res.data)
        setLoading(false)
      }).catch(() => setLoading(false))
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const flat = items()

  const handleSelect = (idx: number) => {
    const item = flat[idx]
    if (!item) return
    onClose()
    navigate(item.path)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && flat.length > 0) handleSelect(selectedIndex)
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-slate-700">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('common.search')}
            className="flex-1 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-base"
          />
          {loading && <Loader2 size={18} className="text-gray-400 animate-spin shrink-0" />}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {query.trim() && (
          <div className="max-h-80 overflow-y-auto p-2">
            {loading && flat.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                {t('app.loading')}
              </div>
            )}

            {!loading && flat.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">{t('common.noData')}</p>
            )}

            {results && results.students.length > 0 && (
              <div className="mb-2">
                <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <Users size={14} className="inline mr-1" />
                  Élèves
                </p>
                {results.students.map((s, i) => {
                  const idx = flat.findIndex(f => f.type === 'student' && f.label.startsWith(s.nom))
                  return (
                    <button
                      key={s.matricule}
                      onClick={() => handleSelect(idx >= 0 ? idx : 0)}
                      onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition ${
                        selectedIndex === idx ? 'bg-cameroon-green/10 text-cameroon-green dark:bg-cameroon-green/20' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <Users size={16} className="shrink-0" />
                      <span className="font-medium">{s.nom} {s.prenom}</span>
                      <span className="text-xs text-gray-400 ml-auto">{s.classe || '-'}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {results && results.teachers.length > 0 && (
              <div className="mb-2">
                <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <GraduationCap size={14} className="inline mr-1" />
                  Enseignants
                </p>
                {results.teachers.map((tch, i) => {
                  const idx = flat.findIndex(f => f.type === 'teacher' && f.label.startsWith(tch.nom))
                  return (
                    <button
                      key={tch.idEnseignant}
                      onClick={() => handleSelect(idx >= 0 ? idx : 0)}
                      onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition ${
                        selectedIndex === idx ? 'bg-cameroon-green/10 text-cameroon-green dark:bg-cameroon-green/20' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <GraduationCap size={16} className="shrink-0" />
                      <span className="font-medium">{tch.nom} {tch.prenom}</span>
                      <span className="text-xs text-gray-400 ml-auto">{tch.classeLibelle || ''}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {results && results.pages.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <FileText size={14} className="inline mr-1" />
                  Pages
                </p>
                {results.pages.map((p, i) => {
                  const idx = flat.findIndex(f => f.type === 'page' && (f.label === (i18n.language === 'fr' ? p.label : p.labelEn)))
                  return (
                    <button
                      key={p.path}
                      onClick={() => handleSelect(idx >= 0 ? idx : 0)}
                      onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition ${
                        selectedIndex === idx ? 'bg-cameroon-green/10 text-cameroon-green dark:bg-cameroon-green/20' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <FileText size={16} className="shrink-0" />
                      <span>{i18n.language === 'fr' ? p.label : p.labelEn}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {!query.trim() && (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            {t('common.search')}
          </div>
        )}

        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400">
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">↑↓</kbd> Naviguer</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">↵</kbd> Ouvrir</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">Esc</kbd> Fermer</span>
        </div>
      </div>
    </div>
  )
}
