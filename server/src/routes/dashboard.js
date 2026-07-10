import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/stats', async (_req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query("SELECT COUNT(*) AS totalStudents FROM Eleve WHERE actif = 1 AND isDelete = 0")
    const [[{ totalTeachers }]] = await pool.query("SELECT COUNT(*) AS totalTeachers FROM enseignants WHERE actif = 1")
    const [[{ totalPayments }]] = await pool.query('SELECT COALESCE(SUM(montant),0) AS totalPayments FROM Paiement')
    const [[{ pendingFees }]] = await pool.query("SELECT COALESCE(SUM(montant),0) AS pendingFees FROM Tranches WHERE actif = 1")
    const [[{ classesCount }]] = await pool.query("SELECT COUNT(*) AS classesCount FROM Classe WHERE isDelete = 0")
    const [[{ boysCount }]] = await pool.query("SELECT COUNT(*) AS boysCount FROM Eleve WHERE sexe = 1 AND actif = 1 AND isDelete = 0")
    const [[{ girlsCount }]] = await pool.query("SELECT COUNT(*) AS girlsCount FROM Eleve WHERE sexe = 2 AND actif = 1 AND isDelete = 0")

    res.json({
      totalStudents,
      totalTeachers,
      totalPayments,
      pendingFees,
      classesCount,
      boysCount,
      girlsCount,
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/teacher/:idPers', async (req, res) => {
  try {
    const { idPers } = req.params
    const [[teacher]] = await pool.query('SELECT e.*, p.nom, p.prenom FROM enseignants e LEFT JOIN personnes p ON p.id_pers = e.id_pers WHERE e.id_pers = ?', [idPers])
    const idEns = teacher?.id_enseignant || 0
    const [cours] = await pool.query(
      'SELECT c.*, cl.libelle AS classeLibelle FROM Cours c LEFT JOIN Classe cl ON cl.idClasse = c.idClasse WHERE c.idEnseignant = ?',
      [idEns]
    )
    const [classes] = await pool.query(
      'SELECT idClasse, libelle FROM Classe WHERE titulaire = ? AND isDelete = 0',
      [idEns]
    )
    res.json({ teacher, cours, classes })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/parent/:idPers', async (req, res) => {
  try {
    const { idPers } = req.params
    const [children] = await pool.query(
      `       SELECT e.*, s.idClasse AS idClasse, cl.libelle AS classe, s.libelle AS salle
       FROM Parents p
       JOIN eleves e ON CAST(p.matricule AS CHAR) = CAST(e.matricule AS CHAR)
       LEFT JOIN Frequente f ON f.matricule = CAST(e.matricule AS UNSIGNED)
         AND f.idFrequente = (SELECT MAX(f2.idFrequente) FROM Frequente f2 WHERE f2.matricule = CAST(e.matricule AS UNSIGNED))
       LEFT JOIN Salle s ON s.idSalle = f.idSalle
       LEFT JOIN Classe cl ON cl.idClasse = s.idClasse
       WHERE p.idPers = ?`,
      [idPers]
    )
    res.json({ children })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/recent-payments', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.idPaie, p.matricule, p.idAca, p.montant, p.idMode, p.idPers, p.date AS datePaie, p.trancheCouverte, p.justificatifUrl, p.actif, p.createdAt, p.updatedAt, m.libelle AS mode FROM Paiement p JOIN Mode m ON p.idMode = m.idMode ORDER BY p.date DESC LIMIT 5"
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/recent-students', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM eleves WHERE actif = 1 ORDER BY created_at DESC LIMIT 5"
    )
    const mapped = rows.map((r) => ({
      matricule: parseInt(r.matricule) || r.matricule,
      nom: r.nom,
      prenom: r.prenom,
      dateNaissance: r.date_naissance,
      lieuNaissance: r.lieu_naissance,
      sexe: r.sexe === 'M' ? 1 : 2,
      langue: r.langue || 'FR',
      photoURL: r.photo_url || '',
      actif: !!r.actif,
    }))
    res.json(mapped)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/students-per-class', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cl.libelle, COUNT(f.matricule) AS effectif
      FROM Classe cl
      LEFT JOIN Salle s ON s.idClasse = cl.idClasse
      LEFT JOIN Frequente f ON f.idSalle = s.idSalle
      WHERE cl.isDelete = 0
      GROUP BY cl.idClasse, cl.libelle
    `)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/payment-trend', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(date, '%Y-%m') AS month, SUM(montant) AS total
      FROM Paiement
      GROUP BY month ORDER BY month
    `)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
