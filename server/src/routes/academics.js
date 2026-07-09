import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/annees', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM AnneeAcademique WHERE isDelete = 0')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/annees', async (req, res) => {
  try {
    const { libelle, periode } = req.body
    const now = new Date()
    const [result] = await pool.query(
      'INSERT INTO AnneeAcademique (libelle, periode, createdAt, updatedAt, isDelete) VALUES (?, ?, ?, ?, 0)',
      [libelle, periode || '', now, now]
    )
    const [rows] = await pool.query('SELECT * FROM AnneeAcademique WHERE idAnnee = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/trimestres', async (req, res) => {
  try {
    let query = 'SELECT * FROM Trimestre'
    const params = []
    if (req.query.idAca) {
      query += ' WHERE idAca = ?'
      params.push(Number(req.query.idAca))
    }
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/trimestres', async (req, res) => {
  try {
    const { libelle, periode, idAca } = req.body
    const now = new Date()
    const [maxOrdre] = await pool.query('SELECT COALESCE(MAX(ordre), 0) + 1 AS nextOrdre FROM Trimestre WHERE idAca = ?', [idAca])
    const ordre = maxOrdre[0].nextOrdre
    const [result] = await pool.query(
      'INSERT INTO Trimestre (libelle, periode, idAca, ordre, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [libelle, periode || '', idAca, ordre, now, now]
    )
    const [rows] = await pool.query('SELECT * FROM Trimestre WHERE idTrimes = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/sessions', async (req, res) => {
  try {
    let query = 'SELECT * FROM Session'
    const params = []
    if (req.query.idTrimestre) {
      query += ' WHERE idTrimestre = ?'
      params.push(Number(req.query.idTrimestre))
    }
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/sessions', async (req, res) => {
  try {
    const { libelle, idTrimestre, idPers } = req.body
    const now = new Date()
    const [result] = await pool.query(
      'INSERT INTO Session (libelle, idTrimestre, type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [libelle, idTrimestre, 'normale', now, now]
    )
    const [rows] = await pool.query('SELECT * FROM Session WHERE idSession = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/annees/:id/set-active', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('UPDATE AnneeAcademique SET actif = (idAnnee = ?)', [Number(id)])
    const [rows] = await pool.query('SELECT * FROM AnneeAcademique WHERE idAnnee = ?', [Number(id)])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/trimestres/:id/close', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('UPDATE Trimestre SET clos = 1 WHERE idTrimes = ?', [Number(id)])
    const [rows] = await pool.query('SELECT * FROM Trimestre WHERE idTrimes = ?', [Number(id)])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/annees/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('UPDATE AnneeAcademique SET isDelete = 1 WHERE idAnnee = ?', [Number(id)])
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
