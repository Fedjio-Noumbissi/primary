import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const current = i18n.language as 'fr' | 'en'

  return (
    <button
      onClick={() => i18n.changeLanguage(current === 'fr' ? 'en' : 'fr')}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-cameroon-green text-cameroon-green hover:bg-cameroon-green hover:text-white transition text-sm font-medium"
      title={current === 'fr' ? 'Switch to English' : 'Basculer en Français'}
    >
      <span className={`${current === 'fr' ? 'font-bold' : ''}`}>FR</span>
      <span className="text-xs">/</span>
      <span className={`${current === 'en' ? 'font-bold' : ''}`}>EN</span>
    </button>
  )
}
