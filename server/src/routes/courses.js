import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/courses', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, cl.idClasse AS classId, cl.libelle AS className
      FROM Cours c
      LEFT JOIN CoursClasse cc ON cc.idCours = c.idCours
      LEFT JOIN Classe cl ON cl.idClasse = cc.idClasse
      WHERE c.isDelete = 0
    `)
    const map = new Map()
    for (const r of rows) {
      if (!map.has(r.idCours)) {
        map.set(r.idCours, { ...r, classes: [] })
        delete map.get(r.idCours).classId
        delete map.get(r.idCours).className
      }
      if (r.classId) {
        map.get(r.idCours).classes.push({ idClasse: r.classId, libelle: r.className })
      }
    }
    res.json([...map.values()])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/courses', async (req, res) => {
  try {
    const { libelle, coefficient, description, idClasses } = req.body
    const now = new Date()
    const firstClass = Array.isArray(idClasses) && idClasses.length > 0 ? idClasses[0] : null
    const [result] = await pool.query(
      'INSERT INTO Cours (libelle, coefficient, description, idClasse, noteMax, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [libelle, coefficient || 1, description || '', firstClass, 10, now, now]
    )
    const idCours = result.insertId
    if (Array.isArray(idClasses)) {
      for (const idClasse of idClasses) {
        await pool.query('INSERT INTO CoursClasse (idCours, idClasse) VALUES (?, ?)', [idCours, idClasse])
      }
    }
    const [rows] = await pool.query('SELECT * FROM Cours WHERE idCours = ?', [idCours])
    res.status(201).json({ ...rows[0], classes: (idClasses || []).map(id => ({ idClasse: id })) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/timetable', async (req, res) => {
  try {
    let query = `SELECT e.idTemps, e.jour, e.heureDebut AS heure, e.heureFin, e.idClasse, e.idCours, e.idEnseignant, e.idSalle, e.createdAt, e.updatedAt,
      c.libelle AS cours, c.couleur
      FROM EmploiDuTemps e JOIN Cours c ON e.idCours = c.idCours`
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
    let query = `SELECT e.idTemps, e.jour, e.heureDebut AS heure, e.heureFin, e.idClasse, e.idCours, e.idEnseignant, e.idSalle, e.createdAt, e.updatedAt, c.libelle AS cours FROM EmploiDuTemps e JOIN Cours c ON e.idCours = c.idCours WHERE e.jour = ? AND e.heureDebut = ? AND (${orParts.join(' OR ')})`
    if (excludeId) { query += ' AND e.idTemps != ?'; params.push(Number(excludeId)) }
    const [rows] = await pool.query(query, params)
    res.json({ conflict: rows.length > 0, entries: rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/timetable', async (req, res) => {
  try {
    const { jour, heureDebut, heureFin, heure, idClasse, idCours, idEnseignant, idSalle } = req.body
    const debut = heureDebut || heure || '08:00'
    const fin = heureFin || debut
    const now = new Date()
    const [result] = await pool.query(
      'INSERT INTO EmploiDuTemps (jour, heureDebut, heureFin, idClasse, idCours, idEnseignant, idSalle, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [jour, debut, fin, idClasse, idCours, idEnseignant || null, idSalle || null, now, now]
    )
    const [rows] = await pool.query('SELECT e.idTemps, e.jour, e.heureDebut AS heure, e.heureFin, e.idClasse, e.idCours, e.idEnseignant, e.idSalle, e.createdAt, e.updatedAt, c.libelle AS cours FROM EmploiDuTemps e JOIN Cours c ON e.idCours = c.idCours WHERE e.idTemps = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/timetable/:id', async (req, res) => {
  try {
    const { jour, heureDebut, heureFin, heure, idClasse, idCours, idEnseignant, idSalle } = req.body
    const debut = heureDebut || heure || '08:00'
    const fin = heureFin || debut
    const now = new Date()
    await pool.query(
      'UPDATE EmploiDuTemps SET jour = ?, heureDebut = ?, heureFin = ?, idClasse = ?, idCours = ?, idEnseignant = ?, idSalle = ?, updatedAt = ? WHERE idTemps = ?',
      [jour, debut, fin, idClasse || null, idCours, idEnseignant || null, idSalle || null, now, Number(req.params.id)]
    )
    const [rows] = await pool.query('SELECT e.idTemps, e.jour, e.heureDebut AS heure, e.heureFin, e.idClasse, e.idCours, e.idEnseignant, e.idSalle, e.createdAt, e.updatedAt, c.libelle AS cours FROM EmploiDuTemps e JOIN Cours c ON e.idCours = c.idCours WHERE e.idTemps = ?', [Number(req.params.id)])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/courses/:id', async (req, res) => {
  try {
    const { libelle, coefficient, description, idClasses } = req.body
    const now = new Date()
    const firstClass = Array.isArray(idClasses) && idClasses.length > 0 ? idClasses[0] : null
    await pool.query(
      'UPDATE Cours SET libelle = ?, coefficient = ?, description = ?, idClasse = ?, updatedAt = ? WHERE idCours = ?',
      [libelle, coefficient || 1, description || '', firstClass, now, Number(req.params.id)]
    )
    await pool.query('DELETE FROM CoursClasse WHERE idCours = ?', [Number(req.params.id)])
    if (Array.isArray(idClasses)) {
      for (const idClasse of idClasses) {
        await pool.query('INSERT INTO CoursClasse (idCours, idClasse) VALUES (?, ?)', [Number(req.params.id), idClasse])
      }
    }
    const [rows] = await pool.query(`
      SELECT c.*, cl.idClasse AS classId, cl.libelle AS className
      FROM Cours c
      LEFT JOIN CoursClasse cc ON cc.idCours = c.idCours
      LEFT JOIN Classe cl ON cl.idClasse = cc.idClasse
      WHERE c.idCours = ?
    `, [Number(req.params.id)])
    const map = new Map()
    for (const r of rows) {
      if (!map.has(r.idCours)) {
        map.set(r.idCours, { ...r, classes: [] })
        delete map.get(r.idCours).classId
        delete map.get(r.idCours).className
      }
      if (r.classId) {
        map.get(r.idCours).classes.push({ idClasse: r.classId, libelle: r.className })
      }
    }
    res.json([...map.values()][0])
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
