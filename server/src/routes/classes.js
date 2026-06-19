import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/cycles', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Cycle WHERE isDelete = 0')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/cycles', async (req, res) => {
  try {
    const { libelle, description } = req.body
    const [result] = await pool.query('INSERT INTO Cycle (libelle, description) VALUES (?, ?)', [libelle, description || ''])
    const [rows] = await pool.query('SELECT * FROM Cycle WHERE idCycle = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/classes', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT c.idClasse, c.libelle, c.idCycle, cy.libelle AS cycle FROM Classe c JOIN Cycle cy ON c.idCycle = cy.idCycle WHERE c.isDelete = 0'
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/classes', async (req, res) => {
  try {
    const { libelle, idCycle } = req.body
    const [result] = await pool.query('INSERT INTO Classe (libelle, idCycle) VALUES (?, ?)', [libelle, idCycle])
    const [rows] = await pool.query(
      'SELECT c.idClasse, c.libelle, c.idCycle, cy.libelle AS cycle FROM Classe c JOIN Cycle cy ON c.idCycle = cy.idCycle WHERE c.idClasse = ?',
      [result.insertId]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/salles', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT s.idSalle, s.libelle, s.position, s.surface, s.idClasse, s.actif, cl.libelle AS classe FROM Salle s JOIN Classe cl ON s.idClasse = cl.idClasse'
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/salles', async (req, res) => {
  try {
    const { libelle, position, surface, idClasse } = req.body
    const [result] = await pool.query(
      'INSERT INTO Salle (libelle, position, surface, idClasse) VALUES (?, ?, ?, ?)',
      [libelle, position || '', surface || '', idClasse]
    )
    const [rows] = await pool.query(
      'SELECT s.idSalle, s.libelle, s.position, s.surface, s.idClasse, s.actif, cl.libelle AS classe FROM Salle s JOIN Classe cl ON s.idClasse = cl.idClasse WHERE s.idSalle = ?',
      [result.insertId]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
