import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.password, u.role, u.is_active,
              p.id_pers, p.nom, p.prenom, p.mobile, p.type_personne
       FROM users u
       LEFT JOIN personnes p ON p.user_id = u.id
       WHERE u.email = ? AND u.is_active = 1`,
      [email]
    )
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const roleMap = { admin: 1, Admin: 1, ADMIN: 1, ENSEIGNANT: 2, enseignant: 2, PARENT: 3, parent: 3 }
    // Priorité : type_personne de la table personnes, sinon rôle de la table users
    const typePersonne = roleMap[user.type_personne] || roleMap[user.role] || 1

    const token = jwt.sign(
      { id: user.id, idPers: user.id_pers, typePersonne },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      idPers: user.id_pers || user.id,
      nom: user.nom || user.name,
      prenom: user.prenom || '',
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
