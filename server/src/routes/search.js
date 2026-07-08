import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const PAGES = [
  { label: 'Tableau de Bord', labelEn: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard', roles: [1] },
  { label: 'Élèves', labelEn: 'Students', path: '/admin/students', icon: 'Users', roles: [1] },
  { label: 'Ajouter un Élève', labelEn: 'Add Student', path: '/admin/students/new', icon: 'UserPlus', roles: [1] },
  { label: 'Inscrire un Élève', labelEn: 'Enroll Student', path: '/admin/students/enroll', icon: 'UserCheck', roles: [1] },
  { label: 'Enseignants', labelEn: 'Teachers', path: '/admin/teachers', icon: 'GraduationCap', roles: [1] },
  { label: 'Utilisateurs', labelEn: 'Users', path: '/admin/users', icon: 'UserCog', roles: [1] },
  { label: 'Classes & Salles', labelEn: 'Classes & Rooms', path: '/admin/classes', icon: 'School', roles: [1] },
  { label: 'Année & Trimestres', labelEn: 'Academic Year', path: '/admin/academic', icon: 'Calendar', roles: [1] },
  { label: 'Matières & Emploi du Temps', labelEn: 'Courses & Timetable', path: '/admin/courses', icon: 'BookOpen', roles: [1] },
  { label: 'Examens & Notes', labelEn: 'Exams & Grades', path: '/admin/exams', icon: 'ClipboardList', roles: [1] },
  { label: 'Bulletins', labelEn: 'Report Cards', path: '/admin/reports', icon: 'FileText', roles: [1] },
  { label: 'Paiements', labelEn: 'Payments', path: '/admin/payments', icon: 'CreditCard', roles: [1] },
  { label: 'Bibliothèque', labelEn: 'Library', path: '/admin/library', icon: 'BookMarked', roles: [1] },
  { label: 'Messages', labelEn: 'Messages', path: '/admin/messages', icon: 'MessageSquare', roles: [1, 2, 3] },
  { label: 'Discipline', labelEn: 'Discipline', path: '/admin/discipline', icon: 'ShieldAlert', roles: [1] },
  { label: 'Paramètres', labelEn: 'Settings', path: '/admin/settings', icon: 'Settings', roles: [1] },
  { label: 'Tableau de Bord', labelEn: 'Dashboard', path: '/teacher/dashboard', icon: 'LayoutDashboard', roles: [2] },
  { label: 'Notes', labelEn: 'Grades', path: '/teacher/grades', icon: 'ClipboardList', roles: [2] },
  { label: 'Emploi du Temps', labelEn: 'Timetable', path: '/teacher/timetable', icon: 'Calendar', roles: [2] },
  { label: 'Messages', labelEn: 'Messages', path: '/teacher/messages', icon: 'MessageSquare', roles: [2] },
  { label: 'Tableau de Bord', labelEn: 'Dashboard', path: '/parent/dashboard', icon: 'LayoutDashboard', roles: [3] },
  { label: 'Notes', labelEn: 'Grades', path: '/parent/grades', icon: 'ClipboardList', roles: [3] },
  { label: 'Paiements', labelEn: 'Payments', path: '/parent/payments', icon: 'CreditCard', roles: [3] },
  { label: 'Messages', labelEn: 'Messages', path: '/parent/messages', icon: 'MessageSquare', roles: [3] },
]

router.get('/', authenticate, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim()
    if (!q || q.length < 1) return res.json({ students: [], teachers: [], pages: [] })

    const searchPattern = `%${q}%`

    const [students] = await pool.query(`
      SELECT e.matricule, e.nom, e.prenom, e.date_naissance, e.sexe,
             cl.libelle AS classe, s.libelle AS salle
      FROM eleves e
      LEFT JOIN Frequente f ON f.matricule = CAST(e.matricule AS UNSIGNED)
        AND f.idFrequente = (
          SELECT MAX(f2.idFrequente) FROM Frequente f2 WHERE f2.matricule = CAST(e.matricule AS UNSIGNED)
        )
      LEFT JOIN Salle s ON s.idSalle = f.idSalle
      LEFT JOIN Classe cl ON cl.idClasse = s.idClasse
      WHERE e.actif = 1
        AND (e.nom LIKE ? OR e.prenom LIKE ? OR CAST(e.matricule AS CHAR) LIKE ?)
      LIMIT 5
    `, [searchPattern, searchPattern, searchPattern])

    const [teachers] = await pool.query(`
      SELECT e.id_enseignant AS idEnseignant, p.nom, p.prenom, p.mobile,
             cl.libelle AS classeLibelle
      FROM enseignants e
      JOIN personnes p ON p.id_pers = e.id_pers
      LEFT JOIN Classe cl ON cl.titulaire = e.id_enseignant AND cl.isDelete = 0
      WHERE e.actif = 1
        AND (p.nom LIKE ? OR p.prenom LIKE ?)
      LIMIT 5
    `, [searchPattern, searchPattern])

    const role = req.user?.typePersonne ?? 1
    const pages = PAGES
      .filter(p => p.roles.includes(role))
      .filter(p => {
        const l = q.toLowerCase()
        return p.label.toLowerCase().includes(l) || p.labelEn.toLowerCase().includes(l)
      })
      .slice(0, 5)

    res.json({
      students: students.map(r => ({
        matricule: parseInt(r.matricule),
        nom: r.nom,
        prenom: r.prenom,
        classe: r.classe || null,
        salle: r.salle || null,
      })),
      teachers: teachers.map(r => ({
        idEnseignant: r.idEnseignant,
        nom: r.nom,
        prenom: r.prenom,
        classeLibelle: r.classeLibelle || null,
      })),
      pages,
    })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: 'Erreur lors de la recherche' })
  }
})

export default router
