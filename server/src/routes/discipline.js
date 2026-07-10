import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/discipline', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, r.date AS event_date,
             COALESCE(e.nom, E.nom) AS nom,
             COALESCE(e.prenom, E.prenom) AS prenom,
             d.libelle, d.points
      FROM Rapport r
      LEFT JOIN eleves e ON CAST(e.matricule AS UNSIGNED) = r.matricule
      LEFT JOIN Eleve E ON E.matricule = r.matricule
      JOIN Discipline d ON d.ID = r.idDiscipline
      ORDER BY r.idRap DESC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/discipline', async (req, res) => {
  try {
    const { libelle, points, matricule, idAca, commentaire, idPers, event_date } = req.body
    const now = new Date()

    let resolvedIdAca = idAca
    if (!resolvedIdAca) {
      const [acaRows] = await pool.query('SELECT idAnnee FROM AnneeAcademique WHERE actif = 1 LIMIT 1')
      if (acaRows.length > 0) resolvedIdAca = acaRows[0].idAnnee
    }

    let resolvedIdPers = idPers
    if (!resolvedIdPers) {
      const [pRows] = await pool.query('SELECT idPers FROM Personne LIMIT 1')
      if (pRows.length > 0) resolvedIdPers = pRows[0].idPers
    }

    const [discResult] = await pool.query(
      'INSERT INTO Discipline (libelle, points, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [libelle, points || 0, now, now]
    )

    const [rapResult] = await pool.query(
      'INSERT INTO Rapport (matricule, idAca, commentaire, date, idPers, idDiscipline, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [matricule, resolvedIdAca || 1, commentaire || '', event_date || now, resolvedIdPers || 1, discResult.insertId, now, now]
    )

    const [rows] = await pool.query(
      `SELECT r.*, r.date AS event_date,
              COALESCE(e.nom, E.nom) AS nom,
              COALESCE(e.prenom, E.prenom) AS prenom,
              d.libelle, d.points
       FROM Rapport r
       LEFT JOIN eleves e ON CAST(e.matricule AS UNSIGNED) = r.matricule
       LEFT JOIN Eleve E ON E.matricule = r.matricule
       JOIN Discipline d ON d.ID = r.idDiscipline
       WHERE r.idRap = ?`,
      [rapResult.insertId]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
