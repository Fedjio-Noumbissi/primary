import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()

// Seed / ensure admin user exists on startup
bcrypt.hash('password', 10).then((hash) => {
  pool.query(
    `INSERT INTO users (nom, prenom, email, password_hash, role, is_active)
     VALUES ('Admin', 'Système', 'admin@ecole.test', ?, 'admin', 1)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), nom = VALUES(nom), prenom = VALUES(prenom), is_active = 1`,
    [hash]
  ).then(() => {
    pool.query(
      `INSERT IGNORE INTO personnes (user_id, nom, prenom, mobile, type_personne)
       SELECT id, nom, prenom, '', 'admin' FROM users WHERE email = 'admin@ecole.test'`
    ).catch(() => {})
  }).catch(() => {})
}).catch(() => {})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const [rows] = await pool.query(
      `SELECT u.id, u.nom, u.prenom AS uprenom, u.email, u.password_hash, u.role, u.is_active,
              p.id_pers, p.nom AS pnom, p.prenom AS pprenom, p.mobile, p.type_personne
       FROM users u
       LEFT JOIN personnes p ON p.user_id = u.id
       WHERE u.email = ? AND u.is_active = 1`,
      [email]
    )
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password_hash || '')
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const roleMap = {
      admin: 1, Admin: 1, ADMIN: 1, DIRECTEUR: 1, directeur: 1,
      ENSEIGNANT: 2, enseignant: 2, Enseignant: 2, Teacher: 2,
      PARENT: 3, parent: 3, Parent: 3,
    }
    const typePersonne = roleMap[user.type_personne] || roleMap[user.role] || 1

    const token = jwt.sign(
      { id: user.id, idPers: user.id_pers || user.id, typePersonne },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    const displayNom = user.pnom || user.nom || ''
    const displayPrenom = user.pprenom || user.uprenom || ''

    res.json({
      idPers: user.id_pers || user.id,
      nom: displayNom,
      prenom: displayPrenom,
      email: user.email,
      password: '',
      typePersonne,
      mobile: user.mobile || '',
      token,
      actif: !!user.is_active,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
