import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/discipline', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, e.nom, e.prenom, d.libelle, d.points
      FROM Rapport r
      JOIN eleves e ON CAST(e.matricule AS UNSIGNED) = r.matricule
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

    // Resolve academic year if not provided
    let resolvedIdAca = idAca
    if (!resolvedIdAca) {
      const [acaRows] = await pool.query(
        'SELECT idAnnee FROM AnneeAcademique WHERE actif = 1 LIMIT 1'
      )
      if (acaRows.length > 0) resolvedIdAca = acaRows[0].idAnnee
    }

    const [discResult] = await pool.query(
      'INSERT INTO Discipline (libelle, points) VALUES (?, ?)',
      [libelle, points || 0]
    )
    if (!idAca) {
      const [activeYear] = await pool.query('SELECT idAnnee FROM AnneeAcademique WHERE actif = 1 LIMIT 1')
      req.body.idAca = activeYear[0]?.idAnnee || null
    }
    const [rapResult] = await pool.query(
      'INSERT INTO Rapport (matricule, idAca, commentaire, event_date, idPers, idDiscipline) VALUES (?, ?, ?, ?, ?, ?)',
      [matricule, resolvedIdAca || 1, commentaire || '', event_date || new Date().toISOString().slice(0, 10), idPers || 1, discResult.insertId]
    )
    const [rows] = await pool.query(
      `SELECT r.*, e.nom, e.prenom, d.libelle, d.points
       FROM Rapport r
       JOIN eleves e ON CAST(e.matricule AS UNSIGNED) = r.matricule
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
