import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/contacts', async (_req, res) => {
  try {
    const [parents] = await pool.query(
      "SELECT p.idPers, pr.nom, pr.prenom, 'parent' AS role FROM Parents p JOIN personnes pr ON p.idPers = pr.id_pers WHERE p.isDelete = 0"
    )
    const [teachers] = await pool.query(
      'SELECT e.id_pers AS idPers, p.nom, p.prenom, \'teacher\' AS role FROM enseignants e JOIN personnes p ON p.id_pers = e.id_pers WHERE e.actif = 1'
    )
    res.json([...parents, ...teachers])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
