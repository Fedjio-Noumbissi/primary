import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/scolarites', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Scolarite')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/scolarites', async (req, res) => {
  try {
    const { inscription, pension, nbreTranche, idCycle } = req.body
    const [result] = await pool.query(
      'INSERT INTO Scolarite (inscription, pension, nbreTranche, idCycle) VALUES (?, ?, ?, ?)',
      [inscription, pension, nbreTranche || 3, idCycle]
    )
    const [rows] = await pool.query('SELECT * FROM Scolarite WHERE idScolarite = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/tranches', async (req, res) => {
  try {
    let query = 'SELECT * FROM Tranches'
    const params = []
    if (req.query.idScolante) {
      query += ' WHERE idScolarite = ?'
      params.push(Number(req.query.idScolante))
    }
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/tranches', async (req, res) => {
  try {
    const { libelle, montant, delai_mois, delai_jour, idScolarite } = req.body
    const [result] = await pool.query(
      'INSERT INTO Tranches (libelle, montant, delai_mois, delai_jour, idScolarite) VALUES (?, ?, ?, ?, ?)',
      [libelle, montant, delai_mois, delai_jour, idScolarite]
    )
    const [rows] = await pool.query('SELECT * FROM Tranches WHERE idTranche = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/modes', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Mode')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/modes', async (req, res) => {
  try {
    const { libelle } = req.body
    const [result] = await pool.query('INSERT INTO Mode (libelle) VALUES (?)', [libelle])
    const [rows] = await pool.query('SELECT * FROM Mode WHERE idMode = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/paiements', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, m.libelle AS mode FROM Paiement p JOIN Mode m ON p.idMode = m.idMode'
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/paiements', async (req, res) => {
  try {
    const { matricule, idAca, montant, idMode, datePaie, idPers } = req.body
    const [result] = await pool.query(
      'INSERT INTO Paiement (matricule, idAca, montant, idMode, datePaie, idPers, dateEnregistrer) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [matricule, idAca, montant, idMode, datePaie || new Date().toISOString().slice(0, 10), idPers]
    )
    const [rows] = await pool.query(
      'SELECT p.*, m.libelle AS mode FROM Paiement p JOIN Mode m ON p.idMode = m.idMode WHERE p.idPaie = ?',
      [result.insertId]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
