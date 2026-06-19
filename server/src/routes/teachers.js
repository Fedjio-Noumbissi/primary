import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'

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
      idClasse: null,
      classeLibelle: null,
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
      cours: [],
      actif: true,
      idClasse: cls[0]?.idClasse || null,
      classeLibelle: cls[0]?.classeLibelle || null,
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
