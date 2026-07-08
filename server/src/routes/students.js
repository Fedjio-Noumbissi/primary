import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { sendWelcomeEmail } from '../email.js'

pool.query('ALTER TABLE eleves ADD COLUMN idCycle INT NULL').catch(() => {})

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, cl.libelle AS classe, s.libelle AS salle, cy.libelle AS cycle,
        sc.idScolarite, sc.inscription, sc.pension, sc.nbreTranche
      FROM eleves e
      LEFT JOIN Frequente f ON f.matricule = CAST(e.matricule AS UNSIGNED)
        AND f.idFrequente = (
          SELECT MAX(f2.idFrequente) FROM Frequente f2 WHERE f2.matricule = CAST(e.matricule AS UNSIGNED)
        )
      LEFT JOIN Salle s ON s.idSalle = f.idSalle
      LEFT JOIN Classe cl ON cl.idClasse = s.idClasse
      LEFT JOIN Cycle cy ON cy.idCycle = e.idCycle
      LEFT JOIN Scolarite sc ON sc.idScolarite = f.idScolarite
      WHERE e.actif = 1
    `)
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
      classe: r.classe || null,
      salle: r.salle || null,
      idCycle: r.idCycle || null,
      cycle: r.cycle || null,
      idScolarite: r.idScolarite || null,
      inscription: r.inscription || null,
      pension: r.pension || null,
      nbreTranche: r.nbreTranche || null,
    }))
    res.json(mapped)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, sc.idScolarite, sc.inscription, sc.pension, sc.nbreTranche
      FROM eleves e
      LEFT JOIN Frequente f ON f.matricule = CAST(e.matricule AS UNSIGNED)
        AND f.idFrequente = (SELECT MAX(f2.idFrequente) FROM Frequente f2 WHERE f2.matricule = CAST(e.matricule AS UNSIGNED))
      LEFT JOIN Scolarite sc ON sc.idScolarite = f.idScolarite
      WHERE e.matricule = ?
    `, [req.params.id])
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
      idCycle: r.idCycle || null,
      actif: !!r.actif,
      idScolarite: r.idScolarite || null,
      inscription: r.inscription || null,
      pension: r.pension || null,
      nbreTranche: r.nbreTranche || null,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { nom, prenom, dateNaissance, lieuNaissance, sexe, langue, photoURL, idCycle } = req.body
    const [[{ maxMat }]] = await pool.query('SELECT COALESCE(MAX(CAST(matricule AS UNSIGNED)), 20260000) + 1 AS maxMat FROM eleves')
    const matricule = String(maxMat)
    await pool.query(
      'INSERT INTO eleves (matricule, nom, prenom, date_naissance, lieu_naissance, sexe, langue, photo_url, actif, idCycle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
      [matricule, nom, prenom, dateNaissance, lieuNaissance, sexe == 1 ? 'M' : 'F', langue || 'FR', photoURL || '', idCycle || null]
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
      idCycle: r.idCycle || null,
      actif: true,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { nom, prenom, dateNaissance, lieuNaissance, sexe, langue, photoURL, idCycle } = req.body
    await pool.query(
      'UPDATE eleves SET nom = ?, prenom = ?, date_naissance = ?, lieu_naissance = ?, sexe = ?, langue = ?, photo_url = ?, idCycle = ? WHERE matricule = ?',
      [nom, prenom, dateNaissance, lieuNaissance, sexe == 1 ? 'M' : 'F', langue || 'FR', photoURL || '', idCycle || null, req.params.id]
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
      idCycle: r.idCycle || null,
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

router.patch('/batch/toggle-active', authenticate, async (req, res) => {
  try {
    const { matricules } = req.body
    if (!Array.isArray(matricules) || matricules.length === 0) {
      return res.status(400).json({ message: 'matricules must be a non-empty array' })
    }
    const placeholders = matricules.map(() => '?').join(',')
    await pool.query(
      `UPDATE eleves SET actif = NOT actif WHERE matricule IN (${placeholders})`,
      matricules
    )
    const [rows] = await pool.query(
      `SELECT * FROM eleves WHERE matricule IN (${placeholders})`,
      matricules
    )
    const mapped = rows.map((r) => ({
      matricule: parseInt(r.matricule) || r.matricule,
      actif: !!r.actif,
    }))
    res.json({ updated: mapped.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.patch('/batch/class', authenticate, async (req, res) => {
  try {
    const { matricules, idSalle } = req.body
    if (!Array.isArray(matricules) || matricules.length === 0) {
      return res.status(400).json({ message: 'matricules must be a non-empty array' })
    }
    if (!idSalle) {
      return res.status(400).json({ message: 'idSalle is required' })
    }
    let updated = 0
    for (const mat of matricules) {
      const [existing] = await pool.query(
        'SELECT idFrequente FROM Frequente WHERE matricule = ? ORDER BY idFrequente DESC LIMIT 1',
        [mat]
      )
      if (existing.length) {
        await pool.query('UPDATE Frequente SET idSalle = ? WHERE idFrequente = ?', [idSalle, existing[0].idFrequente])
      } else {
        await pool.query('INSERT INTO Frequente (idSalle, matricule) VALUES (?, ?)', [idSalle, mat])
      }
      updated++
    }
    res.json({ updated })
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
    const { matricule, idSalle, idAcademi, idScolarite, parent } = req.body
    const idAdmin = req.user?.id || 1
    await pool.query('ALTER TABLE Frequente ADD COLUMN idScolarite INT NULL').catch(() => {})
    const [existing] = await pool.query('SELECT * FROM Frequente WHERE matricule = ? AND idAcademi = ?', [matricule, idAcademi])
    if (existing.length) {
      await pool.query('UPDATE Frequente SET idSalle = ?, idAdmin = ?, idScolarite = ? WHERE matricule = ? AND idAcademi = ?', [idSalle, idAdmin, idScolarite || null, matricule, idAcademi])
    } else {
      await pool.query('INSERT INTO Frequente (idSalle, idAcademi, matricule, idAdmin, idScolarite) VALUES (?, ?, ?, ?, ?)', [idSalle || 0, idAcademi || 0, matricule, idAdmin, idScolarite || null])
    }
    if (parent && parent.nom && parent.email) {
      if (parent.idPers) {
        await pool.query('INSERT INTO Parents (idPers, matricule, idAdmin) VALUES (?, ?, ?)', [parent.idPers, matricule, idAdmin])
      } else {
        const hashed = await bcrypt.hash(parent.password || 'password', 10)
        const [persResult] = await pool.query(
          'INSERT INTO Personne (nom, prenom, mobile, typePersonne, login, email, password, actif, idAdmin) VALUES (?, ?, ?, 3, ?, ?, ?, 1, ?)',
          [parent.nom, parent.prenom || '', parent.mobile || '', parent.email, parent.email, hashed, idAdmin]
        )
        const idPers = persResult.insertId
        await pool.query(
          'INSERT INTO users (nom, prenom, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [parent.nom, parent.prenom || '', parent.email, hashed, 'PARENT']
        )
        await pool.query('INSERT INTO Parents (idPers, matricule, idAdmin) VALUES (?, ?, ?)', [idPers, matricule, idAdmin])
        sendWelcomeEmail(parent.email, parent.password || 'password', `${parent.prenom || ''} ${parent.nom}`.trim(), 'parent').catch(console.error)
      }
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
