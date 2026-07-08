import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const [rows] = await pool.query(
      `SELECT id, email, password_hash, role, is_active, nom, prenom, telephone
       FROM users
       WHERE email = ? AND is_active = 1`,
      [email]
    )
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const roleMap = { admin: 1, Admin: 1, ADMIN: 1, DIRECTEUR: 1, directeur: 1, ENSEIGNANT: 2, enseignant: 2, PARENT: 3, parent: 3 }
    const typePersonne = roleMap[user.role] || 1

    const token = jwt.sign(
      { id: user.id, idPers: user.id, typePersonne },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Update last login
    pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]).catch(() => {})

    res.json({
      idPers: user.id,
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email,
      password: '',
      typePersonne,
      mobile: user.telephone || '',
      token,
      actif: !!user.is_active,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
