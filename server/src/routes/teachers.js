import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { sendWelcomeEmail } from '../email.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id_enseignant AS idEnseignant, e.id_pers AS idPers, e.actif,
              p.nom, p.prenom, p.mobile, cl.idClasse, cl.libelle AS classeLibelle
       FROM enseignants e
       LEFT JOIN personnes p ON p.id_pers = e.id_pers
       LEFT JOIN Classe cl ON cl.titulaire = e.id_enseignant AND cl.isDelete = 0`
    )
    const mapped = []
    for (const r of rows) {
      const [cours] = await pool.query(
        'SELECT * FROM Cours WHERE idEnseignant = ? AND isDelete = 0',
        [r.idEnseignant]
      )
      mapped.push({
        idEnseignant: r.idEnseignant,
        idPers: r.idPers,
        nom: r.nom || '',
        prenom: r.prenom || '',
        mobile: r.mobile || '',
        cours,
        actif: !!r.actif,
        idClasse: r.idClasse || null,
        classeLibelle: r.classeLibelle || null,
      })
    }
    res.json(mapped)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { nom, prenom, mobile, email, password } = req.body
    const [persResult] = await pool.query(
      "INSERT INTO personnes (nom, prenom, mobile, type_personne) VALUES (?, ?, ?, 'ENSEIGNANT')",
      [nom, prenom || '', mobile || '']
    )
    const idPers = persResult.insertId
    const [result] = await pool.query(
      'INSERT INTO enseignants (id_pers, actif) VALUES (?, 1)',
      [idPers]
    )
    const hashed = await bcrypt.hash(password || 'password', 10)
    const [userResult] = await pool.query(
      'INSERT INTO users (nom, prenom, email, password_hash, role, is_active, telephone) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [nom, prenom || '', email, hashed, 'ENSEIGNANT', mobile || null]
    )
    await pool.query('UPDATE personnes SET user_id = ? WHERE id_pers = ?', [userResult.insertId, idPers])
    sendWelcomeEmail(email, password || 'password', `${prenom || ''} ${nom}`.trim(), 'enseignant').catch(console.error)
    res.status(201).json({
      idEnseignant: result.insertId,
      idPers,
      nom,
      prenom: prenom || '',
      mobile: mobile || '',
      email,
      password: '',
      typePersonne: 2,
      token: '',
      actif: true,
      idClasse: null,
      classeLibelle: null,
      cours: [],
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { nom, prenom, mobile, email, password } = req.body
    const [rows] = await pool.query('SELECT e.id_pers, p.user_id FROM enseignants e LEFT JOIN personnes p ON p.id_pers = e.id_pers WHERE e.id_enseignant = ?', [id])
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' })
    const { id_pers: idPers, user_id: userId } = rows[0]
    await pool.query('UPDATE personnes SET nom = ?, prenom = ?, mobile = ? WHERE id_pers = ?', [nom, prenom || '', mobile || '', idPers])
    if (userId) {
      await pool.query('UPDATE users SET nom = ?, prenom = ?, telephone = ? WHERE id = ?', [nom, prenom || '', mobile || null, userId])
      if (email) await pool.query('UPDATE users SET email = ? WHERE id = ?', [email, userId])
      if (password) {
        const hashed = await bcrypt.hash(password, 10)
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, userId])
      }
    }
    const [cls] = await pool.query(
      'SELECT idClasse, libelle AS classeLibelle FROM Classe WHERE titulaire = ? AND isDelete = 0',
      [id]
    )
    res.json({
      idEnseignant: parseInt(id),
      idPers,
      nom,
      prenom: prenom || '',
      mobile: mobile || '',
      email: email || '',
      password: '',
      typePersonne: 2,
      token: '',
      actif: true,
      idClasse: cls[0]?.idClasse || null,
      classeLibelle: cls[0]?.classeLibelle || null,
      cours: [],
    })
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
              p.nom, p.prenom, p.mobile, cl.idClasse, cl.libelle AS classeLibelle
       FROM enseignants e
       LEFT JOIN personnes p ON p.id_pers = e.id_pers
       LEFT JOIN Classe cl ON cl.titulaire = e.id_enseignant AND cl.isDelete = 0
       WHERE e.id_enseignant = ?`,
      [req.params.id]
    )
    const r = rows[0]
    const [cours] = await pool.query('SELECT * FROM Cours WHERE idEnseignant = ? AND isDelete = 0', [r.idEnseignant])
    res.json({
      idEnseignant: r.idEnseignant,
      idPers: r.idPers,
      nom: r.nom || '',
      prenom: r.prenom || '',
      mobile: r.mobile || '',
      cours,
      actif: !!r.actif,
      idClasse: r.idClasse || null,
      classeLibelle: r.classeLibelle || null,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.patch('/:id/courses', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { courseIds } = req.body
    if (!Array.isArray(courseIds)) {
      return res.status(400).json({ message: 'courseIds must be an array' })
    }
    await pool.query('UPDATE Cours SET idEnseignant = NULL WHERE idEnseignant = ?', [id])
    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',')
      await pool.query(
        `UPDATE Cours SET idEnseignant = ? WHERE idCours IN (${placeholders})`,
        [id, ...courseIds]
      )
    }
    const [cours] = await pool.query(
      'SELECT * FROM Cours WHERE idEnseignant = ? AND isDelete = 0',
      [id]
    )
    res.json({ cours })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.patch('/:id/class', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { idClasse } = req.body
    if (idClasse) {
      await pool.query(
        'UPDATE Classe SET titulaire = ? WHERE idClasse = ?',
        [id, idClasse]
      )
    } else {
      await pool.query(
        'UPDATE Classe SET titulaire = NULL WHERE titulaire = ?',
        [id]
      )
    }
    res.json({ idEnseignant: parseInt(id), idClasse: idClasse || null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
