import { Router } from 'express'
import pool from '../db.js'

const router = Router()

pool.query('ALTER TABLE EmploiDuTemps ADD COLUMN idEnseignant INT NULL').catch(() => {})
pool.query('ALTER TABLE EmploiDuTemps ADD COLUMN idSalle INT NULL').catch(() => {})
pool.query("ALTER TABLE Cours ADD COLUMN couleur VARCHAR(7) DEFAULT NULL").catch(() => {})

router.get('/courses', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Cours WHERE isDelete = 0')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/courses', async (req, res) => {
  try {
    const { libelle, coefficient, description, idClasse, note } = req.body
    const [result] = await pool.query(
      'INSERT INTO Cours (libelle, coefficient, description, idClasse, note, idAdmin) VALUES (?, ?, ?, ?, ?, 1)',
      [libelle, coefficient || 1, description || '', idClasse, note || 1]
    )
    const [rows] = await pool.query('SELECT * FROM Cours WHERE idCours = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/timetable', async (req, res) => {
  try {
    let query = 'SELECT e.*, c.libelle AS cours, c.couleur FROM EmploiDuTemps e JOIN Cours c ON e.idCours = c.idCours'
    const params = []
    const conditions = []
    if (req.query.idClasse) { conditions.push('e.idClasse = ?'); params.push(Number(req.query.idClasse)) }
    if (req.query.idEnseignant) { conditions.push('e.idEnseignant = ?'); params.push(Number(req.query.idEnseignant)) }
    if (req.query.idSalle) { conditions.push('e.idSalle = ?'); params.push(Number(req.query.idSalle)) }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/timetable/check-conflicts', async (req, res) => {
  try {
    const { jour, heure, idEnseignant, idSalle, excludeId } = req.query
    const params = [jour, heure]
    const orParts = []
    if (idEnseignant) { orParts.push('e.idEnseignant = ?'); params.push(Number(idEnseignant)) }
    if (idSalle) { orParts.push('e.idSalle = ?'); params.push(Number(idSalle)) }
    if (orParts.length === 0) return res.json({ conflict: false, entries: [] })
    let query = `SELECT e.*, c.libelle AS cours FROM EmploiDuTemps e JOIN Cours c ON e.idCours = c.idCours WHERE e.jour = ? AND e.heure = ? AND (${orParts.join(' OR ')})`
    if (excludeId) { query += ' AND e.idTemps != ?'; params.push(Number(excludeId)) }
    const [rows] = await pool.query(query, params)
    res.json({ conflict: rows.length > 0, entries: rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/timetable', async (req, res) => {
  try {
    const { jour, heure, idClasse, idCours, idEnseignant, idSalle } = req.body
    const [result] = await pool.query(
      'INSERT INTO EmploiDuTemps (jour, heure, idClasse, idCours, idEnseignant, idSalle, idAdmin) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [jour, heure, idClasse, idCours, idEnseignant || null, idSalle || null]
    )
    const [rows] = await pool.query('SELECT e.*, c.libelle AS cours FROM EmploiDuTemps e JOIN Cours c ON e.idCours = c.idCours WHERE e.idTemps = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/timetable/:id', async (req, res) => {
  try {
    const { jour, heure, idCours, idEnseignant, idSalle } = req.body
    await pool.query(
      'UPDATE EmploiDuTemps SET jour = ?, heure = ?, idCours = ?, idEnseignant = ?, idSalle = ? WHERE idTemps = ?',
      [jour, heure, idCours, idEnseignant || null, idSalle || null, Number(req.params.id)]
    )
    const [rows] = await pool.query('SELECT e.*, c.libelle AS cours FROM EmploiDuTemps e JOIN Cours c ON e.idCours = c.idCours WHERE e.idTemps = ?', [Number(req.params.id)])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/courses/:id', async (req, res) => {
  try {
    await pool.query('UPDATE Cours SET isDelete = 1 WHERE idCours = ?', [Number(req.params.id)])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/timetable/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM EmploiDuTemps WHERE idTemps = ?', [Number(req.params.id)])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
