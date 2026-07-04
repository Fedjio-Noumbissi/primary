import { createContext, useContext, useState, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface LanguageContextType {
  lang: 'fr' | 'en'
  toggle: () => void
}

const LanguageContext = createContext<LanguageContextType>({ lang: 'fr', toggle: () => {} })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [lang, setLang] = useState<'fr' | 'en'>(i18n.language as 'fr' | 'en')

  const toggle = () => {
    const next = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
    i18n.changeLanguage(next)
  }

  return (
    <LanguageContext.Provider value={{ lang, toggle }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
