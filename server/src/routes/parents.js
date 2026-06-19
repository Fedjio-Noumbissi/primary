import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/parents', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.idParent, p.idPers, p.matricule, pr.nom, pr.prenom, pr.email, pr.mobile FROM Parents p JOIN Personne pr ON p.idPers = pr.id_pers WHERE p.isDelete = 0'
    )
    const mapped = rows.map(r => ({ ...r, actif: true }))
    res.json(mapped)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
