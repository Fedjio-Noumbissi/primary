import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/parents', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.idParent, p.idPers, p.matricule, pr.nom, pr.prenom, u.email, pr.mobile FROM Parents p JOIN personnes pr ON p.idPers = pr.id_pers LEFT JOIN users u ON u.id = pr.user_id WHERE p.isDelete = 0"
    )
    const mapped = rows.map(r => ({ ...r, actif: true }))
    res.json(mapped)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/parents/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim()
    if (!q || q.length < 1) return res.json([])
    const pattern = `%${q}%`
    const [rows] = await pool.query(
      `SELECT p.idParent, p.idPers, p.matricule, pr.nom, pr.prenom, u.email, pr.mobile
       FROM Parents p
       JOIN personnes pr ON p.idPers = pr.id_pers
       LEFT JOIN users u ON u.id = pr.user_id
       WHERE p.isDelete = 0
         AND (pr.nom LIKE ? OR pr.prenom LIKE ? OR pr.mobile LIKE ?)
       LIMIT 8`,
      [pattern, pattern, pattern]
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
