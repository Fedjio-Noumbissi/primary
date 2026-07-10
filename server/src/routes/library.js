import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/specialites', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Specialite')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/livres', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Livres')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/livres', async (req, res) => {
  try {
    const { titre, auteurs, prix, idSpecialite, edition, totalCopie } = req.body
    const [result] = await pool.query(
      'INSERT INTO Livres (titre, auteurs, prix, idSpecialite, edition, totalCopie, idAdmin) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [titre, auteurs || '', prix || 0, idSpecialite, edition || '', totalCopie || 1]
    )
    const [rows] = await pool.query('SELECT * FROM Livres WHERE idLivre = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
