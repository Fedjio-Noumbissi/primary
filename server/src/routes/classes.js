import { Router } from 'express'
import pool from '../db.js'
import PDFDocument from 'pdfkit'

const router = Router()

// ─── Cycles ────────────────────────────────────────────────

router.get('/cycles', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Cycle WHERE isDelete = 0')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/cycles/archived', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Cycle WHERE isDelete = 1')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/cycles', async (req, res) => {
  try {
    const { libelle, description } = req.body
    const now = new Date()
    const [result] = await pool.query('INSERT INTO Cycle (libelle, description, idAdmin, createdAt, updatedAt) VALUES (?, ?, 1, ?, ?)', [libelle, description || '', now, now])
    const [rows] = await pool.query('SELECT * FROM Cycle WHERE idCycle = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/cycles/:id/toggle-archive', async (req, res) => {
  try {
    const [cycle] = await pool.query('SELECT isDelete FROM Cycle WHERE idCycle = ?', [req.params.id])
    if (!cycle.length) return res.status(404).json({ error: 'Not found' })
    const newVal = cycle[0].isDelete ? 0 : 1
    await pool.query('UPDATE Cycle SET isDelete = ? WHERE idCycle = ?', [newVal, req.params.id])
    if (newVal) await pool.query('UPDATE Classe SET isDelete = 1 WHERE idCycle = ?', [req.params.id])
    const [rows] = await pool.query('SELECT * FROM Cycle WHERE idCycle = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Classes ───────────────────────────────────────────────

router.get('/classes', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.idClasse, c.libelle, c.idCycle, cy.libelle AS cycle,
              c.titulaire, CONCAT(p.nom, ' ', p.prenom) AS titulaireNom
       FROM Classe c
       JOIN Cycle cy ON c.idCycle = cy.idCycle
       LEFT JOIN enseignants e ON e.id_enseignant = c.titulaire
       LEFT JOIN personnes p ON p.id_pers = e.id_pers
       WHERE c.isDelete = 0`
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/classes/archived', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.idClasse, c.libelle, c.idCycle, cy.libelle AS cycle,
              c.titulaire, CONCAT(p.nom, ' ', p.prenom) AS titulaireNom
       FROM Classe c
       JOIN Cycle cy ON c.idCycle = cy.idCycle
       LEFT JOIN enseignants e ON e.id_enseignant = c.titulaire
       LEFT JOIN personnes p ON p.id_pers = e.id_pers
       WHERE c.isDelete = 1`
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/classes', async (req, res) => {
  try {
    const { libelle, idCycle } = req.body
    const now = new Date()
    const [result] = await pool.query('INSERT INTO Classe (libelle, idCycle, idAdmin, createdAt, updatedAt) VALUES (?, ?, 1, ?, ?)', [libelle, idCycle, now, now])
    const [rows] = await pool.query(
      `SELECT c.idClasse, c.libelle, c.idCycle, cy.libelle AS cycle,
              c.titulaire, CONCAT(p.nom, ' ', p.prenom) AS titulaireNom
       FROM Classe c
       JOIN Cycle cy ON c.idCycle = cy.idCycle
       LEFT JOIN enseignants e ON e.id_enseignant = c.titulaire
       LEFT JOIN personnes p ON p.id_pers = e.id_pers
       WHERE c.idClasse = ?`,
      [result.insertId]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/classes/:id/toggle-archive', async (req, res) => {
  try {
    const [cl] = await pool.query('SELECT isDelete FROM Classe WHERE idClasse = ?', [req.params.id])
    if (!cl.length) return res.status(404).json({ error: 'Not found' })
    const newVal = cl[0].isDelete ? 0 : 1
    await pool.query('UPDATE Classe SET isDelete = ? WHERE idClasse = ?', [newVal, req.params.id])
    const [rows] = await pool.query(
      `SELECT c.idClasse, c.libelle, c.idCycle, cy.libelle AS cycle,
              c.titulaire, CONCAT(p.nom, ' ', p.prenom) AS titulaireNom
       FROM Classe c
       JOIN Cycle cy ON c.idCycle = cy.idCycle
       LEFT JOIN enseignants e ON e.id_enseignant = c.titulaire
       LEFT JOIN personnes p ON p.id_pers = e.id_pers
       WHERE c.idClasse = ?`,
      [req.params.id]
    )
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/classes/:id/titulaire', async (req, res) => {
  try {
    const { titulaire } = req.body
    await pool.query('UPDATE Classe SET titulaire = ? WHERE idClasse = ?', [titulaire || null, req.params.id])
    const [rows] = await pool.query(
      `SELECT c.idClasse, c.libelle, c.idCycle, cy.libelle AS cycle,
              c.titulaire, CONCAT(p.nom, ' ', p.prenom) AS titulaireNom
       FROM Classe c
       JOIN Cycle cy ON c.idCycle = cy.idCycle
       LEFT JOIN enseignants e ON e.id_enseignant = c.titulaire
       LEFT JOIN personnes p ON p.id_pers = e.id_pers
       WHERE c.idClasse = ?`,
      [req.params.id]
    )
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/classes/:id/students', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM Frequente f
       JOIN Salle s ON s.idSalle = f.idSalle
       WHERE s.idClasse = ?`,
      [req.params.id]
    )
    res.json({ count: rows[0].count })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/classes/:id/pdf', async (req, res) => {
  try {
    const [classes] = await pool.query(
      `SELECT c.idClasse, c.libelle, cy.libelle AS cycle,
              c.titulaire, CONCAT(p.nom, ' ', p.prenom) AS titulaireNom
       FROM Classe c
       JOIN Cycle cy ON c.idCycle = cy.idCycle
       LEFT JOIN enseignants e ON e.id_enseignant = c.titulaire
       LEFT JOIN personnes p ON p.id_pers = e.id_pers
       WHERE c.idClasse = ?`,
      [req.params.id]
    )
    if (!classes.length) return res.status(404).json({ error: 'Not found' })
    const cls = classes[0]

    const [salles] = await pool.query(
      'SELECT idSalle, libelle, position, capacite FROM Salle WHERE idClasse = ? AND actif = 1',
      [req.params.id]
    )

    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename=classe_${cls.libelle}.pdf`)
    doc.pipe(res)

    const centerX = doc.page.width / 2

    doc.fontSize(18).font('Helvetica-Bold').fillColor('#006B3F').text('ÉCOLE PRIMAIRE', centerX, 50, { align: 'center' })
    doc.fontSize(12).fillColor('#000').text('FICHE DE CLASSE', { align: 'center' })
    doc.moveDown(0.5)
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#006B3F')
    doc.moveDown(0.5)

    doc.fontSize(11).font('Helvetica-Bold').text(`Classe : ${cls.libelle}`)
    doc.font('Helvetica').fontSize(10).text(`Cycle : ${cls.cycle}`)
    doc.text(`Titulaire : ${cls.titulaireNom || 'Non assigné'}`)
    doc.moveDown(0.5)

    doc.font('Helvetica-Bold').fontSize(10).text(`Salles (${salles.length}) :`)
    doc.moveDown(0.3)
    doc.font('Helvetica').fontSize(9)
    if (salles.length) {
      for (const s of salles) {
        doc.text(`  • ${s.libelle} — ${s.position || 'N/C'} (Capacité: ${s.capacite || 'N/C'})`)
      }
    } else {
      doc.text('  Aucune salle assignée')
    }

    doc.moveDown(2)
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#006B3F')
    doc.moveDown(0.5)
    doc.fontSize(8).fillColor('#999').text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' })

    doc.end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ─── Salles ────────────────────────────────────────────────

router.get('/salles', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.idSalle, s.libelle, s.position, s.surface, s.idClasse, cl.idCycle, s.actif, s.capacite,
              cl.libelle AS classe, COUNT(f.idSalle) AS occupancy
       FROM Salle s
       JOIN Classe cl ON s.idClasse = cl.idClasse
       LEFT JOIN Frequente f ON f.idSalle = s.idSalle
       WHERE cl.isDelete = 0
       GROUP BY s.idSalle`
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/salles', async (req, res) => {
  try {
    const { libelle, position, surface, idClasse, capacite } = req.body
    const now = new Date()
    const [result] = await pool.query(
      'INSERT INTO Salle (libelle, position, surface, idClasse, capacite, idAdmin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      [libelle, position || '', surface || '', idClasse, capacite || null, now, now]
    )
    const [rows] = await pool.query(
      'SELECT s.idSalle, s.libelle, s.position, s.surface, s.idClasse, s.actif, s.capacite, cl.libelle AS classe FROM Salle s JOIN Classe cl ON s.idClasse = cl.idClasse WHERE s.idSalle = ?',
      [result.insertId]
    )
    res.status(201).json({ ...rows[0], occupancy: 0 })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/salles/:id/toggle-active', async (req, res) => {
  try {
    await pool.query('UPDATE Salle SET actif = NOT actif WHERE idSalle = ?', [req.params.id])
    const [rows] = await pool.query(
      'SELECT s.idSalle, s.libelle, s.position, s.surface, s.idClasse, s.actif, s.capacite, cl.libelle AS classe FROM Salle s JOIN Classe cl ON s.idClasse = cl.idClasse WHERE s.idSalle = ?',
      [req.params.id]
    )
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/classes/:id', async (req, res) => {
  try {
    const [salles] = await pool.query('SELECT idSalle FROM Salle WHERE idClasse = ?', [req.params.id])
    for (const s of salles) {
      await pool.query('DELETE FROM Titulaire WHERE idSalle = ?', [s.idSalle])
      await pool.query('DELETE FROM Frequente WHERE idSalle = ?', [s.idSalle])
    }
    await pool.query('DELETE FROM Salle WHERE idClasse = ?', [req.params.id])
    await pool.query('DELETE FROM EmploiDuTemps WHERE idClasse = ?', [req.params.id])
    await pool.query('DELETE FROM Cours WHERE idClasse = ?', [req.params.id])
    await pool.query('DELETE FROM Classe WHERE idClasse = ?', [req.params.id])
    res.json({ message: 'Supprimé' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/salles/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Titulaire WHERE idSalle = ?', [req.params.id])
    await pool.query('DELETE FROM Frequente WHERE idSalle = ?', [req.params.id])
    await pool.query('DELETE FROM Salle WHERE idSalle = ?', [req.params.id])
    res.json({ message: 'Supprimé' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/salles/:id', async (req, res) => {
  try {
    const { libelle, position, surface, idClasse, capacite } = req.body
    const now = new Date()
    await pool.query(
      'UPDATE Salle SET libelle = ?, position = ?, surface = ?, idClasse = ?, capacite = ?, updatedAt = ? WHERE idSalle = ?',
      [libelle, position || '', surface || '', idClasse, capacite || null, now, req.params.id]
    )
    const [rows] = await pool.query(
      'SELECT s.idSalle, s.libelle, s.position, s.surface, s.idClasse, s.actif, s.capacite, cl.libelle AS classe FROM Salle s JOIN Classe cl ON s.idClasse = cl.idClasse WHERE s.idSalle = ?',
      [req.params.id]
    )
    res.json({ ...rows[0], occupancy: 0 })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
