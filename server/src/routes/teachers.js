import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id_enseignant AS idEnseignant, e.id_pers AS idPers, e.actif,
              p.nom, p.prenom, p.mobile
       FROM enseignants e
       LEFT JOIN personnes p ON p.id_pers = e.id_pers`
    )
    const mapped = rows.map((r) => ({
      idEnseignant: r.idEnseignant,
      idPers: r.idPers,
      nom: r.nom || '',
      prenom: r.prenom || '',
      mobile: r.mobile || '',
      cours: [],
      actif: !!r.actif,
    }))
    res.json(mapped)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { nom, prenom, mobile } = req.body
    const [persResult] = await pool.query(
      "INSERT INTO personnes (nom, prenom, mobile, type_personne) VALUES (?, ?, ?, 'ENSEIGNANT')",
      [nom, prenom || '', mobile || '']
    )
    const idPers = persResult.insertId
    const [result] = await pool.query(
      'INSERT INTO enseignants (id_pers, actif) VALUES (?, 1)',
      [idPers]
    )
    res.status(201).json({
      idEnseignant: result.insertId,
      idPers,
      nom,
      prenom: prenom || '',
      mobile: mobile || '',
      cours: [],
      actif: true,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { nom, prenom, mobile } = req.body
    const [rows] = await pool.query('SELECT id_pers FROM enseignants WHERE id_enseignant = ?', [id])
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' })
    const idPers = rows[0].id_pers
    await pool.query('UPDATE personnes SET nom = ?, prenom = ?, mobile = ? WHERE id_pers = ?', [nom, prenom || '', mobile || '', idPers])
    res.json({ idEnseignant: parseInt(id), idPers, nom, prenom: prenom || '', mobile: mobile || '', cours: [], actif: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.patch('/:id/toggle-active', authenticate, async (req, res) => {
  try {
    await pool.query('UPDATE enseignants SET actif = NOT actif WHERE id_enseignant = ?', [req.params.id])
    const [rows] = await pool.query(
      `SELECT e.id_enseignant AS idEnseignant, e.id_pers AS idPers, e.actif,
              p.nom, p.prenom, p.mobile
       FROM enseignants e
       LEFT JOIN personnes p ON p.id_pers = e.id_pers
       WHERE e.id_enseignant = ?`,
      [req.params.id]
    )
    const r = rows[0]
    res.json({
      idEnseignant: r.idEnseignant,
      idPers: r.idPers,
      nom: r.nom || '',
      prenom: r.prenom || '',
      mobile: r.mobile || '',
      cours: [],
      actif: !!r.actif,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
