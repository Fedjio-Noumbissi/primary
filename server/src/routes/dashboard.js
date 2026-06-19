import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/stats', async (_req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query("SELECT COUNT(*) AS totalStudents FROM Eleve WHERE actif = 1 AND isDelete = 0")
    const [[{ totalTeachers }]] = await pool.query("SELECT COUNT(*) AS totalTeachers FROM Enseignant WHERE Actif = 1 AND isDelete = 0")
    const [[{ totalPayments }]] = await pool.query('SELECT COALESCE(SUM(montant),0) AS totalPayments FROM Paiement')
    const [[{ pendingFees }]] = await pool.query("SELECT COALESCE(SUM(montant),0) AS pendingFees FROM Tranches WHERE actif = 1")
    const [[{ classesCount }]] = await pool.query("SELECT COUNT(*) AS classesCount FROM Classe WHERE isDelete = 0")
    const [[{ boysCount }]] = await pool.query("SELECT COUNT(*) AS boysCount FROM Eleve WHERE sexe = 1 AND actif = 1 AND isDelete = 0")
    const [[{ girlsCount }]] = await pool.query("SELECT COUNT(*) AS girlsCount FROM Eleve WHERE sexe = 2 AND actif = 1 AND isDelete = 0")

    res.json({
      totalStudents,
      totalTeachers,
      totalPayments,
      pendingFees,
      classesCount,
      boysCount,
      girlsCount,
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/teacher/:idPers', async (req, res) => {
  try {
    const { idPers } = req.params
    const [[teacher]] = await pool.query('SELECT * FROM Enseignant WHERE id_pers = ?', [idPers])
    const [cours] = await pool.query('SELECT * FROM Cours WHERE idEnseignant = ?', [teacher?.id_enseignant || 0])
    res.json({ teacher, cours })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/parent/:idPers', async (req, res) => {
  try {
    const { idPers } = req.params
    const [children] = await pool.query(
      'SELECT e.* FROM Parents p JOIN eleves e ON p.matricule = e.matricule WHERE p.idPers = ?',
      [idPers]
    )
    res.json({ children })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
