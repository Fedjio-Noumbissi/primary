const APPRECIATION_FR: [number, string][] = [
  [20, 'Excellent'],
  [16, 'Très Bien'],
  [14, 'Bien'],
  [12, 'Assez Bien'],
  [10, 'Passable'],
  [0, 'Insuffisant'],
]

const APPRECIATION_EN: [number, string][] = [
  [20, 'Excellent'],
  [16, 'Very Good'],
  [14, 'Good'],
  [12, 'Fairly Good'],
  [10, 'Passable'],
  [0, 'Insufficient'],
]

export function getAppreciation(grade: number, lang: 'fr' | 'en' = 'fr'): string {
  const scale = lang === 'fr' ? APPRECIATION_FR : APPRECIATION_EN
  for (const [threshold, label] of scale) {
    if (grade >= threshold) return label
  }
  return scale[scale.length - 1][1]
}

export function calculateAverage(grades: { note: number; coefficient: number }[]): number {
  const total = grades.reduce((s, g) => s + g.note * g.coefficient, 0)
  const coeffs = grades.reduce((s, g) => s + g.coefficient, 0)
  return coeffs ? Math.round((total / coeffs) * 100) / 100 : 0
}

export function getGradeColor(grade: number): string {
  if (grade >= 16) return 'text-green-600'
  if (grade >= 10) return 'text-yellow-600'
  return 'text-red-600'
}
