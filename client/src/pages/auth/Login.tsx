import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { School, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { t, i18n } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.login(email, password)
      const serverRole = (res.data.typePersonne ?? role) as 1 | 2 | 3 | 4
      const user = { ...res.data, typePersonne: serverRole }
      login(user)
      const path = serverRole === 1 ? '/admin/dashboard' : serverRole === 2 ? '/teacher/dashboard' : '/parent/dashboard'
      toast.success(t('toast.success'))
      window.location.href = path
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.code === 'ERR_NETWORK' || !err.response) {
        toast.error(t('auth.networkError'))
      } else if (err.response?.status === 401) {
        toast.error(t('auth.invalid'))
      } else {
        toast.error(t('auth.serverError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cameroon-green to-cameroon-green-dark p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 backdrop-blur-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-cameroon-green flex items-center justify-center mx-auto mb-4">
            <School size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-cameroon-green">{t('app.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('auth.login')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('auth.role')}</label>
            <div className="flex gap-2">
              {([{ v: 1, l: 'auth.admin' }, { v: 2, l: 'auth.teacher' }, { v: 3, l: 'auth.parent' }] as const).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setRole(opt.v)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition border ${role === opt.v
                      ? 'bg-cameroon-green text-white border-cameroon-green'
                      : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:border-cameroon-green'
                    }`}
                >
                  {t(opt.l)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('user.email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@school.cm"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('auth.password')}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="1234"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cameroon-green transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cameroon-green text-white rounded-lg font-medium hover:bg-cameroon-green-light transition disabled:opacity-60"
          >
            {loading ? t('app.loading') : t('auth.loginBtn')}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-6">
          {i18n.language === 'fr'
            ? 'Admin : admin@ecole.test / password'
            : 'Admin: admin@ecole.test / password'}
        </p>
      </div>
    </div>
  )
}
