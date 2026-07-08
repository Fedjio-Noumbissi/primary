import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, School, Calendar,
  BookOpen, ClipboardList, FileText, CreditCard, Users as ParentIcon,
  BookMarked, MessageSquare, ShieldAlert, Settings, X, UserCog, ScrollText
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const { role } = useAuth()

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' },
    { to: '/admin/students', icon: Users, label: 'nav.students' },
    { to: '/admin/teachers', icon: GraduationCap, label: 'nav.teachers' },
    { to: '/admin/users', icon: UserCog, label: 'nav.users' },
    { to: '/admin/classes', icon: School, label: 'nav.classes' },
    { to: '/admin/academic', icon: Calendar, label: 'nav.academic' },
    { to: '/admin/courses', icon: BookOpen, label: 'nav.courses' },
    { to: '/admin/exams', icon: ClipboardList, label: 'nav.exams' },
    { to: '/admin/reports', icon: FileText, label: 'nav.reports' },
    { to: '/admin/payments', icon: CreditCard, label: 'nav.payments' },
    { to: '/admin/library', icon: BookMarked, label: 'nav.library' },
    { to: '/admin/messages', icon: MessageSquare, label: 'nav.messages' },
    { to: '/admin/discipline', icon: ShieldAlert, label: 'nav.discipline' },
    { to: '/admin/settings', icon: Settings, label: 'nav.settings' },
    { to: '/admin/audit-logs', icon: ScrollText, label: 'nav.auditLogs' },
  ]

  const teacherLinks = [
    { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' },
    { to: '/teacher/grades', icon: ClipboardList, label: 'nav.exams' },
    { to: '/teacher/timetable', icon: Calendar, label: 'nav.courses' },
    { to: '/teacher/messages', icon: MessageSquare, label: 'nav.messages' },
  ]

  const parentLinks = [
    { to: '/parent/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' },
    { to: '/parent/grades', icon: ClipboardList, label: 'nav.exams' },
    { to: '/parent/payments', icon: CreditCard, label: 'nav.payments' },
    { to: '/parent/messages', icon: MessageSquare, label: 'nav.messages' },
  ]

  const links = role === 2 ? teacherLinks : role === 3 ? parentLinks : adminLinks

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`
          fixed lg:sticky top-0 lg:top-0 left-0 z-20 h-screen
          bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700
          transition-transform duration-200 w-64
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-cameroon-green flex items-center justify-center">
              <span className="text-white text-xs font-bold">CPS</span>
            </div>
            <span className="font-bold text-sm text-cameroon-green">{t('app.subtitle')}</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-600 dark:text-slate-300">
            <X size={18} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-cameroon-green text-white font-medium'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-cameroon-green'
                }`
              }
            >
              <link.icon size={18} />
              <span>{t(link.label)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
