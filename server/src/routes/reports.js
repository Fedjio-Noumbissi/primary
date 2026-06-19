import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/reports/:matricule/:idTrimes', async (req, res) => {
  try {
    const { matricule, idTrimes } = req.params
    const [rows] = await pool.query(
      'SELECT * FROM Evaluation WHERE matricule = ? AND idSession IN (SELECT idSession FROM Session WHERE idTrimestre = ?)',
      [matricule, idTrimes]
    )
    const [student] = await pool.query('SELECT * FROM eleves WHERE matricule = ?', [matricule])
    const [trimestre] = await pool.query('SELECT * FROM Trimestre WHERE idTrimes = ?', [idTrimes])

    res.json({
      student: student[0] || null,
      trimestre: trimestre[0] || null,
      evaluations: rows,
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
