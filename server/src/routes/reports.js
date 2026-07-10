import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/reports/:matricule/:idTrimes', async (req, res) => {
  try {
    const { matricule, idTrimes } = req.params
    const [rows] = await pool.query(
      'SELECT e.*, c.libelle AS matiere FROM Evaluation e JOIN Cours c ON e.idCours = c.idCours WHERE e.matricule = ? AND e.idSession IN (SELECT idSession FROM Session WHERE idTrimestre = ?)',
      [matricule, idTrimes]
    )
    const [student] = await pool.query('SELECT * FROM Eleve WHERE matricule = ?', [matricule])
    const [trimestre] = await pool.query('SELECT * FROM Trimestre WHERE idTrimes = ?', [idTrimes])

    const [discipline] = await pool.query(
      `SELECT d.ID, d.libelle, d.points, r.date AS event_date
       FROM Rapport r
       JOIN Discipline d ON d.ID = r.idDiscipline
       WHERE r.matricule = ? AND r.idAca = (SELECT idAca FROM Trimestre WHERE idTrimes = ?)`,
      [matricule, idTrimes]
    )

    res.json({
      student: student[0] || null,
      trimestre: trimestre[0] || null,
      evaluations: rows,
      discipline,
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
