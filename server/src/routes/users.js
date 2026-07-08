import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

const roleMap = { 1: 'admin', 2: 'ENSEIGNANT', 3: 'PARENT' }
const roleToType = { admin: 1, ADMIN: 1, DIRECTEUR: 1, directeur: 1, ENSEIGNANT: 2, enseignant: 2, PARENT: 3, parent: 3 }

router.get('/', authenticate, authorize(1), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nom, prenom, email, role, is_active AS actif, telephone
       FROM users
       ORDER BY id`
    )
    const mapped = rows.map((r) => ({
      idPers: r.id,
      nom: r.nom || '',
      prenom: r.prenom || '',
      email: r.email,
      password: '',
      typePersonne: roleToType[r.role] || 3,
      mobile: r.telephone || '',
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
      'INSERT INTO users (nom, prenom, email, password_hash, role, is_active, telephone) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [nom, prenom || '', email, hashed, role, mobile || null]
    )
    const userId = result.insertId

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
    await pool.query('UPDATE users SET nom = ?, prenom = ?, email = ?, telephone = ? WHERE id = ?', [nom, prenom || '', email, mobile || null, id])
    if (password) {
      const hashed = await bcrypt.hash(password, 10)
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, id])
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
    const [rows] = await pool.query('SELECT id, nom, prenom, email, is_active FROM users WHERE id = ?', [id])
    const u = rows[0]
    res.json({ idPers: u.id, nom: u.nom || '', prenom: u.prenom || '', email: u.email, password: '', typePersonne: 1, mobile: '', token: '', actif: !!u.is_active })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
