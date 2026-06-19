import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/courses', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Cours WHERE isDelete = 0')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/courses', async (req, res) => {
  try {
    const { libelle, coefficient, description, idClasse, note } = req.body
    const [result] = await pool.query(
      'INSERT INTO Cours (libelle, coefficient, description, idClasse, note) VALUES (?, ?, ?, ?, ?)',
      [libelle, coefficient || 1, description || '', idClasse, note || 1]
    )
    const [rows] = await pool.query('SELECT * FROM Cours WHERE idCours = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/timetable', async (req, res) => {
  try {
    let query = 'SELECT e.*, c.libelle AS cours FROM EmploiDuTemps e JOIN Cours c ON e.idCours = c.idCours'
    const params = []
    if (req.query.idClasse) {
      query += ' WHERE e.idClasse = ?'
      params.push(Number(req.query.idClasse))
    }
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/timetable', async (req, res) => {
  try {
    const { jour, heure, idClasse, idCours } = req.body
    const [result] = await pool.query(
      'INSERT INTO EmploiDuTemps (jour, heure, idClasse, idCours) VALUES (?, ?, ?, ?)',
      [jour, heure, idClasse, idCours]
    )
    const [rows] = await pool.query('SELECT e.*, c.libelle AS cours FROM EmploiDuTemps e JOIN Cours c ON e.idCours = c.idCours WHERE e.idTemps = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
