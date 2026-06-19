import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/natures', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM NatureEpreuve')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/epreuves', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT e.*, n.libelle AS nature FROM Epreuve e JOIN NatureEpreuve n ON e.idNature = n.idNature WHERE e.isDelete = 0'
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/epreuves', async (req, res) => {
  try {
    const { libelle, idNature, idPers } = req.body
    const [result] = await pool.query(
      'INSERT INTO Epreuve (libelle, idNature, idPers) VALUES (?, ?, ?)',
      [libelle, idNature, idPers]
    )
    const [rows] = await pool.query(
      'SELECT e.*, n.libelle AS nature FROM Epreuve e JOIN NatureEpreuve n ON e.idNature = n.idNature WHERE e.idEpreuve = ?',
      [result.insertId]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/evaluations', async (req, res) => {
  try {
    let query = 'SELECT e.*, c.libelle AS matiere FROM Evaluation e JOIN Cours c ON e.idCours = c.idCours'
    const params = []
    const conditions = []
    if (req.query.idSession) {
      conditions.push('e.idSession = ?')
      params.push(Number(req.query.idSession))
    }
    if (req.query.idCours) {
      conditions.push('e.idCours = ?')
      params.push(Number(req.query.idCours))
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/evaluations', async (req, res) => {
  try {
    const { note, appreciation, matricule, idEpreuve, idCours, idSession, idPers } = req.body
    const [result] = await pool.query(
      'INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [note || 0, appreciation || '', matricule, idEpreuve, idCours, idSession, idPers]
    )
    const [rows] = await pool.query('SELECT e.*, c.libelle AS matiere FROM Evaluation e JOIN Cours c ON e.idCours = c.idCours WHERE e.idEval = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/evaluations/bulk', async (req, res) => {
  try {
    const items = req.body
    if (!items.length) return res.status(400).json({ error: 'No data' })
    const values = items.map(i => [i.note || 0, i.appreciation || '', i.matricule, i.idEpreuve, i.idCours, i.idSession, i.idPers])
    await pool.query(
      'INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers) VALUES ?',
      [values]
    )
    res.status(201).json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
