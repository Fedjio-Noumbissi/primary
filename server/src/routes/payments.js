import { Router } from 'express'
import pool from '../db.js'
import PDFDocument from 'pdfkit'

const router = Router()

function formatCurrency(amount) {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 })
}

router.get('/paiements/:id/receipt', async (req, res) => {
  try {
    const [payments] = await pool.query(
      `SELECT p.*, m.libelle AS mode, el.nom, el.prenom, cl.libelle AS classe, cy.idCycle
       FROM Paiement p
       JOIN Mode m ON p.idMode = m.idMode
       JOIN eleves el ON CAST(el.matricule AS UNSIGNED) = p.matricule
       LEFT JOIN Frequente f ON f.matricule = CAST(el.matricule AS UNSIGNED)
         AND f.idFrequente = (SELECT MAX(f2.idFrequente) FROM Frequente f2 WHERE f2.matricule = CAST(el.matricule AS UNSIGNED))
       LEFT JOIN Salle s ON s.idSalle = f.idSalle
       LEFT JOIN Classe cl ON cl.idClasse = s.idClasse
       LEFT JOIN Cycle cy ON cy.idCycle = el.idCycle
       WHERE p.idPaie = ?`,
      [Number(req.params.id)]
    )
    if (!payments.length) return res.status(404).json({ message: 'Payment not found' })
    const paie = payments[0]

    const [totalPaid] = await pool.query(
      'SELECT COALESCE(SUM(montant), 0) AS total FROM Paiement WHERE matricule = ? AND idPaie <= ?',
      [paie.matricule, Number(req.params.id)]
    )

    const [scolarites] = await pool.query(
      'SELECT * FROM Scolarite WHERE idCycle = ?',
      [paie.idCycle || 1]
    )
    const scolarite = scolarites[0]
    const totalDue = (scolarite?.inscription || 0) + (scolarite?.pension || 0)
    const reste = Math.max(0, totalDue - totalPaid[0].total)

    const doc = new PDFDocument({ margin: 50, size: 'A5' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename=recu_${paie.idPaie}.pdf`)
    doc.pipe(res)

    const pageWidth = doc.page.width - 100
    const centerX = doc.page.width / 2

    doc.fontSize(16).font('Helvetica-Bold').text('ÉCOLE PRIMAIRE', centerX, 50, { align: 'center' })
    doc.fontSize(9).font('Helvetica').text('B.P. 1234 Yaoundé — Tél: +237 677 000 000', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(8).text('Email: contact@ecoleprimaire.cm • Site: www.ecoleprimaire.cm', { align: 'center' })

    doc.moveDown(0.3)
    doc.moveTo(50, doc.y).lineTo(pageWidth + 50, doc.y).stroke('#006B3F')
    doc.moveDown(0.5)

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#006B3F').text('REÇU DE PAIEMENT', { align: 'center' })
    doc.fillColor('#000')
    doc.moveDown(0.3)

    doc.fontSize(8).fillColor('#666').text(`N° ${String(paie.idPaie).padStart(6, '0')} / ${new Date().getFullYear()}`, { align: 'center' })
    doc.fillColor('#000')
    doc.moveDown(0.5)

    const lineHeight = 14
    const col1X = 50
    const col2X = 160
    let y = doc.y

    doc.fontSize(9).font('Helvetica-Bold')
    doc.text('ÉLÈVE', col1X, y)
    doc.font('Helvetica')
    doc.text(`${paie.nom} ${paie.prenom}`, col2X, y)
    y += lineHeight
    doc.font('Helvetica-Bold').text('Classe', col1X, y)
    doc.font('Helvetica').text(paie.classe || '—', col2X, y)
    y += lineHeight + 4

    doc.moveTo(50, y).lineTo(pageWidth + 50, y).stroke('#ddd')
    y += 8

    doc.fontSize(9).font('Helvetica-Bold')
    doc.text('PAIEMENT', col1X, y)
    y += lineHeight
    doc.font('Helvetica-Bold').text('Date', col1X, y)
    doc.font('Helvetica').text(new Date(paie.datePaie).toLocaleDateString('fr-FR'), col2X, y)
    y += lineHeight
    doc.font('Helvetica-Bold').text('Mode', col1X, y)
    doc.font('Helvetica').text(paie.mode, col2X, y)
    y += lineHeight + 4

    doc.moveTo(50, y).lineTo(pageWidth + 50, y).stroke('#ddd')
    y += 8

    doc.fontSize(9).font('Helvetica-Bold')
    doc.text('MONTANT', col1X, y)
    y += lineHeight
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#006B3F')
    doc.text(formatCurrency(paie.montant), col2X, y)
    doc.fillColor('#000')
    y += lineHeight + 4

    doc.moveTo(50, y).lineTo(pageWidth + 50, y).stroke('#ddd')
    y += 8

    doc.fontSize(9).font('Helvetica-Bold')
    doc.text('SITUATION FINANCIÈRE', col1X, y)
    y += lineHeight
    doc.font('Helvetica-Bold').text('Total scolarité', col1X, y)
    doc.font('Helvetica').text(formatCurrency(totalDue), col2X, y)
    y += lineHeight
    doc.font('Helvetica-Bold').text('Total versé', col1X, y)
    doc.font('Helvetica').text(formatCurrency(totalPaid[0].total), col2X, y)
    y += lineHeight
    doc.font('Helvetica-Bold').fillColor('#CE1126').text('Reste à payer', col1X, y)
    doc.text(formatCurrency(reste), col2X, y)
    doc.fillColor('#000')
    y += lineHeight + 8

    doc.moveTo(50, y).lineTo(pageWidth + 50, y).stroke('#006B3F')
    y += 12

    doc.fontSize(8).fillColor('#666')
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    doc.text(`Date d'édition : ${dateStr}`, col1X, y, { align: 'left' })
    doc.text('Cachet & Signature', pageWidth - 20, y, { align: 'right' })

    doc.moveDown(1.5)
    doc.fontSize(7).fillColor('#999')
    doc.text('Reçu généré par le système de gestion scolaire — Document non valable sans cachet', { align: 'center' })

    doc.end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/scolarites', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Scolarite')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/scolarites', async (req, res) => {
  try {
    const { inscription, pension, nbreTranche, idCycle } = req.body
    const [result] = await pool.query(
      'INSERT INTO Scolarite (inscription, pension, nbreTranche, idCycle) VALUES (?, ?, ?, ?)',
      [inscription, pension, nbreTranche || 3, idCycle]
    )
    const [rows] = await pool.query('SELECT * FROM Scolarite WHERE idScolarite = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/tranches', async (req, res) => {
  try {
    let query = 'SELECT * FROM Tranches'
    const params = []
    if (req.query.idScolante) {
      query += ' WHERE idScolarite = ?'
      params.push(Number(req.query.idScolante))
    }
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/tranches', async (req, res) => {
  try {
    const { libelle, montant, delai_mois, delai_jour, idScolarite } = req.body
    const [result] = await pool.query(
      'INSERT INTO Tranches (libelle, montant, delai_mois, delai_jour, idScolarite) VALUES (?, ?, ?, ?, ?)',
      [libelle, montant, delai_mois, delai_jour, idScolarite]
    )
    const [rows] = await pool.query('SELECT * FROM Tranches WHERE idTranche = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/modes', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Mode')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/modes', async (req, res) => {
  try {
    const { libelle } = req.body
    const [result] = await pool.query('INSERT INTO Mode (libelle) VALUES (?)', [libelle])
    const [rows] = await pool.query('SELECT * FROM Mode WHERE idMode = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/paiements', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, m.libelle AS mode FROM Paiement p JOIN Mode m ON p.idMode = m.idMode'
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/paiements', async (req, res) => {
  try {
    const { matricule, idAca, montant, idMode, datePaie, idPers } = req.body
    const [result] = await pool.query(
      'INSERT INTO Paiement (matricule, idAca, montant, idMode, datePaie, idPers, dateEnregistrer) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [matricule, idAca, montant, idMode, datePaie || new Date().toISOString().slice(0, 10), idPers]
    )
    const [rows] = await pool.query(
      'SELECT p.*, m.libelle AS mode FROM Paiement p JOIN Mode m ON p.idMode = m.idMode WHERE p.idPaie = ?',
      [result.insertId]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
