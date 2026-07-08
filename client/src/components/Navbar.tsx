import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import LanguageToggle from './LanguageToggle'
import { LogOut, Menu, X, School, Moon, Sun, Search } from 'lucide-react'

interface NavbarProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onOpenPalette: () => void
}

export default function Navbar({ onToggleSidebar, sidebarOpen, onOpenPalette }: NavbarProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()

  const roleLabel = user?.typePersonne === 1 ? t('auth.admin') : user?.typePersonne === 2 ? t('auth.teacher') : t('auth.parent')

  return (
    <header className="bg-white/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-300"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <School size={24} className="text-cameroon-green" />
          <span className="font-bold text-cameroon-green hidden sm:inline">
            {t('app.subtitle')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onOpenPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
        >
          <Search size={16} />
          <span className="hidden md:inline">{t('common.search')}</span>
          <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
        <button
          onClick={onOpenPalette}
          className="sm:hidden p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
        >
          <Search size={20} />
        </button>
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <LanguageToggle />
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
          <div className="w-8 h-8 rounded-full bg-cameroon-green text-white flex items-center justify-center text-xs font-bold">
            {user?.nom?.[0]}{user?.prenom?.[0]}
          </div>
          <div>
            <p className="font-medium leading-tight">{user?.nom} {user?.prenom}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition"
          title={t('nav.logout')}
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
