import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/parents', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.idParent, p.idPers, p.matricule,
              COALESCE(pp.nom COLLATE utf8mb4_unicode_ci, pr.nom) AS nom,
              COALESCE(pp.prenom COLLATE utf8mb4_unicode_ci, pr.prenom) AS prenom,
              COALESCE(
                (SELECT email FROM users WHERE CAST(email AS CHAR) = CAST(pp.email AS CHAR) LIMIT 1),
                (SELECT email FROM users WHERE id = pr.user_id LIMIT 1)
              ) AS email,
              COALESCE(pp.telephone1 COLLATE utf8mb4_unicode_ci, pr.mobile) AS mobile
       FROM Parents p
       LEFT JOIN personnes pr ON p.idPers = pr.id_pers
       LEFT JOIN Personne pp ON p.idPers = pp.idPers
       WHERE p.isDelete = 0
       UNION
       SELECT NULL AS idParent, pp.idPers, NULL AS matricule,
              pp.nom COLLATE utf8mb4_unicode_ci AS nom,
              pp.prenom COLLATE utf8mb4_unicode_ci AS prenom,
              (SELECT email FROM users WHERE CAST(email AS CHAR) = CAST(pp.email AS CHAR) LIMIT 1) AS email,
              pp.telephone1 COLLATE utf8mb4_unicode_ci AS mobile
       FROM Personne pp
       WHERE pp.typePersonne = 3
         AND pp.email IS NOT NULL AND pp.email != ''
         AND NOT EXISTS (SELECT 1 FROM Parents WHERE idPers = pp.idPers)`
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
      `SELECT p.idParent, p.idPers, p.matricule,
              COALESCE(pp.nom COLLATE utf8mb4_unicode_ci, pr.nom) AS nom,
              COALESCE(pp.prenom COLLATE utf8mb4_unicode_ci, pr.prenom) AS prenom,
              COALESCE(
                (SELECT email FROM users WHERE CAST(email AS CHAR) = CAST(pp.email AS CHAR) LIMIT 1),
                (SELECT email FROM users WHERE id = pr.user_id LIMIT 1)
              ) AS email,
              COALESCE(pp.telephone1 COLLATE utf8mb4_unicode_ci, pr.mobile) AS mobile
       FROM Parents p
       LEFT JOIN personnes pr ON p.idPers = pr.id_pers
       LEFT JOIN Personne pp ON p.idPers = pp.idPers
       WHERE p.isDelete = 0
         AND (COALESCE(pp.nom COLLATE utf8mb4_unicode_ci, pr.nom) LIKE ? OR COALESCE(pp.prenom COLLATE utf8mb4_unicode_ci, pr.prenom) LIKE ? OR COALESCE(pp.telephone1 COLLATE utf8mb4_unicode_ci, pr.mobile) LIKE ?)
       LIMIT 8`,
      [pattern, pattern, pattern]
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
