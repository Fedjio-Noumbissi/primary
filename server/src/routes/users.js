import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

const roleMap = { 1: 'admin', 2: 'ENSEIGNANT', 3: 'PARENT' }

router.get('/', authenticate, authorize(1), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id AS idPers, u.name AS nom, '' AS prenom, u.email, u.role, u.is_active AS actif,
              p.nom AS pers_nom, p.prenom, p.mobile
       FROM users u
       LEFT JOIN personnes p ON p.user_id = u.id
       ORDER BY u.id`
    )
    const mapped = rows.map((r) => ({
      idPers: r.idPers,
      nom: r.prenom ? r.pers_nom : r.nom,
      prenom: r.prenom || '',
      email: r.email,
      password: '',
      typePersonne: r.role === 'admin' ? 1 : r.role === 'ENSEIGNANT' ? 2 : 3,
      mobile: r.mobile || '',
      token: '',
      actif: !!r.actif,
    }))
    res.json(mapped)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', authenticate, authorize(1), async (req, res) => {
  try {
    const { nom, prenom, email, password, mobile, typePersonne } = req.body
    const role = roleMap[typePersonne] || 'PARENT'
    const hashed = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, 1)',
      [nom, email, hashed, role]
    )
    const userId = result.insertId

    if (prenom || mobile) {
      await pool.query(
        'INSERT INTO personnes (user_id, nom, prenom, mobile, type_personne) VALUES (?, ?, ?, ?, ?)',
        [userId, nom, prenom || '', mobile || '', role]
      )
    }

    res.status(201).json({
      idPers: userId,
      nom,
      prenom: prenom || '',
      email,
      password: '',
      typePersonne,
      mobile: mobile || '',
      token: '',
      actif: true,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', authenticate, authorize(1), async (req, res) => {
  try {
    const { id } = req.params
    const { nom, prenom, email, password, mobile } = req.body
    await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [nom, email, id])
    if (password) {
      const hashed = await bcrypt.hash(password, 10)
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, id])
    }
    const [existing] = await pool.query('SELECT id_pers FROM personnes WHERE user_id = ?', [id])
    if (existing.length > 0) {
      await pool.query('UPDATE personnes SET nom = ?, prenom = ?, mobile = ? WHERE user_id = ?', [nom, prenom || '', mobile || '', id])
    } else if (prenom || mobile) {
      await pool.query('INSERT INTO personnes (user_id, nom, prenom, mobile) VALUES (?, ?, ?, ?)', [id, nom, prenom || '', mobile || ''])
    }
    res.json({ idPers: parseInt(id), nom, prenom: prenom || '', email, password: '', typePersonne: 1, mobile: mobile || '', token: '', actif: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', authenticate, authorize(1), async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM personnes WHERE user_id = ?', [id])
    await pool.query('DELETE FROM admins WHERE user_id = ?', [id])
    await pool.query('DELETE FROM users WHERE id = ?', [id])
    res.sendStatus(204)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.patch('/:id/toggle-active', authenticate, authorize(1), async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [id])
    const [rows] = await pool.query('SELECT id, name, email, is_active FROM users WHERE id = ?', [id])
    res.json({ idPers: rows[0].id, nom: rows[0].name, prenom: '', email: rows[0].email, password: '', typePersonne: 1, mobile: '', token: '', actif: !!rows[0].is_active })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
