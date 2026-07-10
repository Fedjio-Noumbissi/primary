import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/contacts', async (_req, res) => {
  try {
    const [parents] = await pool.query(
      `SELECT p.idParent, p.idPers,
              COALESCE(pp.nom COLLATE utf8mb4_unicode_ci, pr.nom) AS nom,
              COALESCE(pp.prenom COLLATE utf8mb4_unicode_ci, pr.prenom) AS prenom,
              'parent' AS role
       FROM Parents p
       LEFT JOIN personnes pr ON p.idPers = pr.id_pers
       LEFT JOIN Personne pp ON p.idPers = pp.idPers
       WHERE p.isDelete = 0
       UNION
       SELECT NULL AS idParent, pp.idPers,
              pp.nom COLLATE utf8mb4_unicode_ci AS nom,
              pp.prenom COLLATE utf8mb4_unicode_ci AS prenom,
              'parent' AS role
       FROM Personne pp
       WHERE pp.typePersonne = 3
         AND pp.email IS NOT NULL AND pp.email != ''
         AND NOT EXISTS (SELECT 1 FROM Parents WHERE idPers = pp.idPers)`
    )
    const [teachers] = await pool.query(
      'SELECT e.id_pers AS idPers, p.nom, p.prenom, \'teacher\' AS role FROM enseignants e JOIN personnes p ON p.id_pers = e.id_pers WHERE e.actif = 1'
    )
    res.json([...parents, ...teachers])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
