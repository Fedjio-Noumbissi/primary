import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/messages', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Messages ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/messages', async (req, res) => {
  try {
    const { idExp_Pers, idParent, objet, information } = req.body
    const [result] = await pool.query(
      'INSERT INTO Messages (idExp_Pers, idParent, objet, information) VALUES (?, ?, ?, ?)',
      [idExp_Pers, idParent, objet, information]
    )
    const [rows] = await pool.query('SELECT * FROM Messages WHERE idMessages = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
