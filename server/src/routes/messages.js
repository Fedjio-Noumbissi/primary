import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/messages', async (req, res) => {
  try {
    const { role, idPers } = req.query
    let query = 'SELECT * FROM Messages'
    const params = []
    if (role && idPers) {
      query += ' WHERE receiverRole = ? AND receiverId = ?'
      params.push(role, parseInt(idPers))
    }
    query += ' ORDER BY dateEnvoi DESC, createdAt DESC LIMIT 100'
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/messages', async (req, res) => {
  try {
    const { idExp_Pers, idParent, objet, information, receiverRole, receiverId, receiverLabel } = req.body
    const now = new Date()
    const [[{ idAca }]] = await pool.query('SELECT COALESCE((SELECT idAnnee FROM AnneeAcademique ORDER BY idAnnee DESC LIMIT 1), 1) AS idAca')
    const [result] = await pool.query(
      'INSERT INTO Messages (idExp_Pers, idParent, objet, information, AnneeAcade, receiverRole, receiverId, receiverLabel, type, dateEnvoi, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [idExp_Pers, idParent || null, objet, information, idAca, receiverRole || null, receiverId || null, receiverLabel || null, 1, now, now, now]
    )
    const [rows] = await pool.query('SELECT * FROM Messages WHERE idMessages = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/messages/broadcast', async (req, res) => {
  try {
    const { idExp_Pers, objet, information, target } = req.body
    const now = new Date()
    const [[{ idAca }]] = await pool.query('SELECT COALESCE((SELECT idAnnee FROM AnneeAcademique ORDER BY idAnnee DESC LIMIT 1), 1) AS idAca')
    const values = []

    if (target === 'parents' || target === 'all') {
      const [parents] = await pool.query(
        `SELECT p.idParent, p.idPers,
                COALESCE(pp.nom COLLATE utf8mb4_unicode_ci, pr.nom) AS nom,
                COALESCE(pp.prenom COLLATE utf8mb4_unicode_ci, pr.prenom) AS prenom
         FROM Parents p
         LEFT JOIN personnes pr ON p.idPers = pr.id_pers
         LEFT JOIN Personne pp ON p.idPers = pp.idPers
         WHERE p.isDelete = 0`
      )
      for (const p of parents) {
        values.push([idExp_Pers, p.idParent, objet, information, idAca, 'parent', p.idPers, `${p.nom} ${p.prenom}`, 1, now, now, now])
      }
    }

    if (target === 'teachers' || target === 'all') {
      const [teachers] = await pool.query(
        'SELECT e.id_pers AS idPers, p.nom, p.prenom FROM enseignants e JOIN personnes p ON p.id_pers = e.id_pers WHERE e.actif = 1'
      )
      for (const t of teachers) {
        values.push([idExp_Pers, null, objet, information, idAca, 'teacher', t.idPers, `${t.nom} ${t.prenom}`, 1, now, now, now])
      }
    }

    if (values.length === 0) return res.json({ success: true, count: 0 })
    await pool.query(
      'INSERT INTO Messages (idExp_Pers, idParent, objet, information, AnneeAcade, receiverRole, receiverId, receiverLabel, type, dateEnvoi, createdAt, updatedAt) VALUES ?',
      [values]
    )
    res.status(201).json({ success: true, count: values.length })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
