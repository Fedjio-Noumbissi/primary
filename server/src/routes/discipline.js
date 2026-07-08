import { Router } from 'express'
import pool from '../db.js'

pool.query('ALTER TABLE Rapport ADD COLUMN idDiscipline INT NULL').catch(() => {})

const router = Router()

router.get('/discipline', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, e.nom, e.prenom
      FROM Rapport r
      JOIN eleves e ON CAST(e.matricule AS UNSIGNED) = r.matricule
      ORDER BY r.idRap DESC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/discipline', async (req, res) => {
  try {
    const { libelle, points, matricule, idAca, commentaire } = req.body
    const [discResult] = await pool.query(
      'INSERT INTO Discipline (libelle, points) VALUES (?, ?)',
      [libelle, points]
    )
    const [rapResult] = await pool.query(
      'INSERT INTO Rapport (libelle, points, matricule, idAca, commentaire, idDiscipline) VALUES (?, ?, ?, ?, ?, ?)',
      [libelle, points, matricule, idAca || null, commentaire || '', discResult.insertId]
    )
    const [rows] = await pool.query(
      `SELECT r.*, e.nom, e.prenom
       FROM Rapport r
       JOIN eleves e ON CAST(e.matricule AS UNSIGNED) = r.matricule
       WHERE r.idRap = ?`,
      [rapResult.insertId]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
