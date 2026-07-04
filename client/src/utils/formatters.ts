export function formatDate(date: string): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount)
}

export function formatPhone(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 9) return `+237 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  return phone
}

export function getInitials(nom: string, prenom: string): string {
  return `${(nom?.[0] || '').toUpperCase()}${(prenom?.[0] || '').toUpperCase()}`
}
