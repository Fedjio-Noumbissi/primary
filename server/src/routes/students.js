import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM eleves WHERE actif = 1')
    const mapped = rows.map((r) => ({
      matricule: parseInt(r.matricule) || r.matricule,
      nom: r.nom,
      prenom: r.prenom,
      dateNaissance: r.date_naissance,
      lieuNaissance: r.lieu_naissance,
      sexe: r.sexe === 'M' ? 1 : 2,
      langue: r.langue || 'FR',
      photoURL: r.photo_url || '',
      actif: !!r.actif,
    }))
    res.json(mapped)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM eleves WHERE matricule = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' })
    const r = rows[0]
    res.json({
      matricule: parseInt(r.matricule) || r.matricule,
      nom: r.nom,
      prenom: r.prenom,
      dateNaissance: r.date_naissance,
      lieuNaissance: r.lieu_naissance,
      sexe: r.sexe === 'M' ? 1 : 2,
      langue: r.langue || 'FR',
      photoURL: r.photo_url || '',
      actif: !!r.actif,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { nom, prenom, dateNaissance, lieuNaissance, sexe, langue, photoURL } = req.body
    const [[{ maxMat }]] = await pool.query('SELECT COALESCE(MAX(CAST(matricule AS UNSIGNED)), 20260000) + 1 AS maxMat FROM eleves')
    const matricule = String(maxMat)
    await pool.query(
      'INSERT INTO eleves (matricule, nom, prenom, date_naissance, lieu_naissance, sexe, langue, photo_url, actif) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [matricule, nom, prenom, dateNaissance, lieuNaissance, sexe == 1 ? 'M' : 'F', langue || 'FR', photoURL || '']
    )
    const [rows] = await pool.query('SELECT * FROM eleves WHERE matricule = ?', [matricule])
    const r = rows[0]
    res.status(201).json({
      matricule: parseInt(r.matricule) || r.matricule,
      nom: r.nom,
      prenom: r.prenom,
      dateNaissance: r.date_naissance,
      lieuNaissance: r.lieu_naissance,
      sexe: r.sexe === 'M' ? 1 : 2,
      langue: r.langue || 'FR',
      photoURL: r.photo_url || '',
      actif: true,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { nom, prenom, dateNaissance, lieuNaissance, sexe, langue, photoURL } = req.body
    await pool.query(
      'UPDATE eleves SET nom = ?, prenom = ?, date_naissance = ?, lieu_naissance = ?, sexe = ?, langue = ?, photo_url = ? WHERE matricule = ?',
      [nom, prenom, dateNaissance, lieuNaissance, sexe == 1 ? 'M' : 'F', langue || 'FR', photoURL || '', req.params.id]
    )
    const [rows] = await pool.query('SELECT * FROM eleves WHERE matricule = ?', [req.params.id])
    const r = rows[0]
    res.json({
      matricule: parseInt(r.matricule) || r.matricule,
      nom: r.nom,
      prenom: r.prenom,
      dateNaissance: r.date_naissance,
      lieuNaissance: r.lieu_naissance,
      sexe: r.sexe === 'M' ? 1 : 2,
      langue: r.langue || 'FR',
      photoURL: r.photo_url || '',
      actif: !!r.actif,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM eleves WHERE matricule = ?', [req.params.id])
    res.sendStatus(204)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.patch('/:id/toggle-active', authenticate, async (req, res) => {
  try {
    await pool.query('UPDATE eleves SET actif = NOT actif WHERE matricule = ?', [req.params.id])
    const [rows] = await pool.query('SELECT * FROM eleves WHERE matricule = ?', [req.params.id])
    const r = rows[0]
    res.json({
      matricule: parseInt(r.matricule) || r.matricule,
      nom: r.nom,
      prenom: r.prenom,
      dateNaissance: r.date_naissance,
      lieuNaissance: r.lieu_naissance,
      sexe: r.sexe === 'M' ? 1 : 2,
      langue: r.langue || 'FR',
      photoURL: r.photo_url || '',
      actif: !!r.actif,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/enroll', authenticate, async (req, res) => {
  try {
    const { matricule, idSalle, idAcademi } = req.body
    const [existing] = await pool.query('SELECT * FROM Frequente WHERE matricule = ? AND idAcademi = ?', [matricule, idAcademi])
    if (existing.length) {
      await pool.query('UPDATE Frequente SET idSalle = ? WHERE matricule = ? AND idAcademi = ?', [idSalle, matricule, idAcademi])
    } else {
      await pool.query('INSERT INTO Frequente (idSalle, idAcademi, matricule) VALUES (?, ?, ?)', [idSalle, idAcademi, matricule])
    }
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:id/grades', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT e.*, c.libelle AS matiere FROM Evaluation e JOIN Cours c ON e.idCours = c.idCours WHERE e.matricule = ?',
      [req.params.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:id/payments', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, m.libelle AS mode FROM Paiement p JOIN Mode m ON p.idMode = m.idMode WHERE p.matricule = ?',
      [req.params.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
