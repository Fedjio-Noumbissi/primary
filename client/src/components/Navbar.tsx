import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LanguageToggle from './LanguageToggle'
import { LogOut, Menu, X, School } from 'lucide-react'

interface NavbarProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export default function Navbar({ onToggleSidebar, sidebarOpen }: NavbarProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  const roleLabel = user?.typePersonne === 1 ? t('auth.admin') : user?.typePersonne === 2 ? t('auth.teacher') : t('auth.parent')

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
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
        <LanguageToggle />
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
          <div className="w-8 h-8 rounded-full bg-cameroon-green text-white flex items-center justify-center text-xs font-bold">
            {user?.nom?.[0]}{user?.prenom?.[0]}
          </div>
          <div>
            <p className="font-medium leading-tight">{user?.nom} {user?.prenom}</p>
            <p className="text-xs text-gray-400">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"
          title={t('nav.logout')}
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
