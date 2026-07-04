export function validateRequired(value: string, labelFr: string, labelEn: string, lang: 'fr' | 'en'): string | null {
  if (!value || !value.trim()) {
    return lang === 'fr' ? `${labelFr} est requis` : `${labelEn} is required`
  }
  return null
}

export function validateEmail(value: string, lang: 'fr' | 'en'): string | null {
  if (!value) return null
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(value)) {
    return lang === 'fr' ? 'Email invalide' : 'Invalid email'
  }
  return null
}

export function validatePhone(value: string, lang: 'fr' | 'en'): string | null {
  if (!value) return null
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length < 9) {
    return lang === 'fr' ? 'Numéro invalide (9 chiffres requis)' : 'Invalid phone (9 digits required)'
  }
  return null
}

export function validateGrade(value: number, lang: 'fr' | 'en'): string | null {
  if (value < 0 || value > 20) {
    return lang === 'fr' ? 'La note doit être entre 0 et 20' : 'Grade must be between 0 and 20'
  }
  return null
}
