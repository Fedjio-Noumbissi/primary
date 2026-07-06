import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/parents', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.idParent, p.idPers, p.matricule, pr.nom, pr.prenom, u.email, pr.mobile FROM Parents p JOIN personnes pr ON p.idPers = pr.id_pers LEFT JOIN users u ON u.id = pr.user_id WHERE p.isDelete = 0'
    )
    const mapped = rows.map(r => ({ ...r, actif: true }))
    res.json(mapped)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
