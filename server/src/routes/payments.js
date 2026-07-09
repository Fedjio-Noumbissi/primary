import { Router } from 'express'
import pool from '../db.js'
import PDFDocument from 'pdfkit'

const router = Router()

function formatCurrency(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
}

router.get('/paiements/:id/receipt', async (req, res) => {
  try {
    const [payments] = await pool.query(
      `SELECT p.*, m.libelle AS mode, el.nom, el.prenom, cl.libelle AS classe, cl.idClasse AS idClasse
       FROM Paiement p
       JOIN Mode m ON p.idMode = m.idMode
       JOIN eleves el ON CAST(el.matricule AS UNSIGNED) = p.matricule
       LEFT JOIN Frequente f ON f.matricule = CAST(el.matricule AS UNSIGNED)
         AND f.idFrequente = (SELECT MAX(f2.idFrequente) FROM Frequente f2 WHERE f2.matricule = CAST(el.matricule AS UNSIGNED))
       LEFT JOIN Salle s ON s.idSalle = f.idSalle
       LEFT JOIN Classe cl ON cl.idClasse = s.idClasse
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
      'SELECT * FROM Scolarite WHERE idClasse = ?',
      [paie.idClasse || null]
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
    await pool.query('ALTER TABLE Scolarite ADD COLUMN idClasse INT NULL').catch(() => {})
    const [rows] = await pool.query(
      'SELECT s.*, cy.libelle AS cycle FROM Scolarite s LEFT JOIN Cycle cy ON s.idCycle = cy.idCycle'
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/scolarites', async (req, res) => {
  try {
    const { inscription, pension, nbreTranche, idCycle, idClasse, description } = req.body
    const [result] = await pool.query(
      'INSERT INTO Scolarite (inscription, pension, nbreTranche, idCycle, idClasse, description, idFondateur) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [inscription, pension, nbreTranche || 3, idCycle || null, idClasse || null, description || `Plan ${idClasse ? `classe #${idClasse}` : `cycle ${idCycle}`}`]
    )
    const [rows] = await pool.query('SELECT s.*, cy.libelle AS cycle FROM Scolarite s LEFT JOIN Cycle cy ON s.idCycle = cy.idCycle WHERE s.idScolarite = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/scolarite/by-classe/:idClasse', async (req, res) => {
  try {
    const { idClasse } = req.params
    const [scolarites] = await pool.query('SELECT * FROM Scolarite WHERE idClasse = ?', [Number(idClasse)])
    let scolarite = scolarites.length ? scolarites[0] : null
    if (!scolarite) {
      const [classes] = await pool.query('SELECT idCycle FROM Classe WHERE idClasse = ?', [Number(idClasse)])
      if (!classes.length) return res.status(404).json({ message: 'Classe not found' })
      const [cycleScolarites] = await pool.query('SELECT * FROM Scolarite WHERE idCycle = ? AND idClasse IS NULL', [classes[0].idCycle])
      scolarite = cycleScolarites.length ? cycleScolarites[0] : null
    }
    let tranches = []
    if (scolarite) {
      const [rows] = await pool.query('SELECT * FROM Tranches WHERE idScolarite = ?', [scolarite.idScolarite])
      tranches = rows
    }
    res.json({ scolarite, tranches })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/scolarite/:idScolarite', async (req, res) => {
  try {
    const { idScolarite } = req.params
    const { inscription, pension, nbreTranche, idClasse, description } = req.body
    await pool.query(
      'UPDATE Scolarite SET inscription = ?, pension = ?, nbreTranche = ?, idClasse = ?, description = ? WHERE idScolarite = ?',
      [inscription, pension, nbreTranche || 3, idClasse || null, description || '', Number(idScolarite)]
    )
    const [rows] = await pool.query('SELECT * FROM Scolarite WHERE idScolarite = ?', [Number(idScolarite)])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/scolarites/:id', async (req, res) => {
  try {
    const { inscription, pension, nbreTranche, idCycle, idClasse } = req.body
    await pool.query(
      'UPDATE Scolarite SET inscription = ?, pension = ?, nbreTranche = ?, idCycle = ?, idClasse = ? WHERE idScolarite = ?',
      [inscription, pension, nbreTranche, idCycle, idClasse || null, req.params.id]
    )
    const [rows] = await pool.query('SELECT s.*, cy.libelle AS cycle FROM Scolarite s LEFT JOIN Cycle cy ON s.idCycle = cy.idCycle WHERE s.idScolarite = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/scolarites/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Tranches WHERE idScolarite = ?', [req.params.id])
    await pool.query('DELETE FROM Scolarite WHERE idScolarite = ?', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/scolarites-with-tranches', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const { inscription, pension, nbreTranche, idCycle, idClasse, tranches } = req.body
    const [scolResult] = await conn.query(
      'INSERT INTO Scolarite (inscription, pension, nbreTranche, idCycle, idClasse, description, idFondateur) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [inscription, pension, nbreTranche, idCycle || null, idClasse || null, '', 1]
    )
    const idScolarite = scolResult.insertId
    if (tranches && tranches.length > 0) {
      for (const t of tranches) {
        await conn.query(
          'INSERT INTO Tranches (libelle, montant, delai_mois, delai_jour, date_limite, idScolarite, idFondateur) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [t.libelle, t.montant, t.delai_mois || '', t.delai_jour || '', t.date_limite || null, idScolarite, 1]
        )
      }
    }
    await conn.commit()
    const [scol] = await pool.query(
      'SELECT s.*, cy.libelle AS cycle FROM Scolarite s LEFT JOIN Cycle cy ON s.idCycle = cy.idCycle WHERE s.idScolarite = ?',
      [idScolarite]
    )
    const [trancheRows] = await pool.query('SELECT * FROM Tranches WHERE idScolarite = ?', [idScolarite])
    res.status(201).json({ scolarite: scol[0], tranches: trancheRows })
  } catch (err) {
    await conn.rollback()
    console.error(err)
    res.status(500).json({ error: err.message })
  } finally {
    conn.release()
  }
})

router.get('/tranches', async (req, res) => {
  try {
    let query = 'SELECT * FROM Tranches'
    const params = []
    if (req.query.idScolarite) {
      query += ' WHERE idScolarite = ?'
      params.push(Number(req.query.idScolarite))
    }
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/tranches', async (req, res) => {
  try {
    const { libelle, montant, delai_mois, delai_jour, date_limite, idScolarite } = req.body
    const [result] = await pool.query(
      'INSERT INTO Tranches (libelle, montant, delai_mois, delai_jour, date_limite, idScolarite, idFondateur) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [libelle, montant, delai_mois || '', delai_jour || '', date_limite || null, idScolarite, 1]
    )
    const [rows] = await pool.query('SELECT * FROM Tranches WHERE idTranche = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/tranches/:id', async (req, res) => {
  try {
    const { libelle, montant, date_limite, actif } = req.body
    await pool.query(
      'UPDATE Tranches SET libelle = ?, montant = ?, date_limite = ?, actif = ? WHERE idTranche = ?',
      [libelle, montant, date_limite || null, actif ?? 1, req.params.id]
    )
    const [rows] = await pool.query('SELECT * FROM Tranches WHERE idTranche = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/tranches/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Tranches WHERE idTranche = ?', [req.params.id])
    res.json({ message: 'Deleted' })
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
    const [result] = await pool.query('INSERT INTO Mode (libelle, information, idFondateur) VALUES (?, ?, ?)', [libelle, libelle, 1])
    const [rows] = await pool.query('SELECT * FROM Mode WHERE idMode = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/modes/:id', async (req, res) => {
  try {
    const { libelle, actif } = req.body
    await pool.query('UPDATE Mode SET libelle = ?, actif = ? WHERE idMode = ?', [libelle, actif ?? 1, req.params.id])
    const [rows] = await pool.query('SELECT * FROM Mode WHERE idMode = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/modes/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Mode WHERE idMode = ?', [req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Mode non trouvé' })
    res.json({ message: 'Supprimé' })
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ message: 'Ce mode est utilisé par des paiements et ne peut pas être supprimé' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.get('/paiements', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, m.libelle AS mode, el.nom, el.prenom
       FROM Paiement p
       JOIN Mode m ON p.idMode = m.idMode
       LEFT JOIN eleves el ON CAST(el.matricule AS UNSIGNED) = p.matricule`
    )
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/paiements', async (req, res) => {
  try {
    const { matricule, idAca, montant, idMode, datePaie, idPers, tranches } = req.body
    console.log('POST /paiements body:', { matricule, idAca, montant, idMode, datePaie, idPers, tranches })
    await pool.query(
      'INSERT IGNORE INTO Eleve (matricule, nom, prenom, dateNaissance, lieuNaissance, sexe, langue, actif, idVilleNaissance, idAdmin) SELECT CAST(? AS UNSIGNED), nom, prenom, COALESCE(date_naissance, CURDATE()), COALESCE(lieu_naissance, "Non spécifié"), IF(sexe="M",1,2), langue, 1, 1, 1 FROM eleves WHERE CAST(matricule AS UNSIGNED) = ?',
      [matricule, matricule]
    )
    const [result] = await pool.query(
      'INSERT INTO Paiement (matricule, idAca, montant, idMode, datePaie, idPers, dateEnregistrer) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [matricule, idAca, montant, idMode, datePaie || new Date().toISOString().slice(0, 10), idPers]
    )
    const idPaie = result.insertId
    if (tranches && tranches.length > 0) {
      const values = tranches.map((t) => [idPaie, t])
      await pool.query('INSERT INTO PaiementTranche (idPaie, idTranche) VALUES ?', [values])
    }
    const [rows] = await pool.query(
      'SELECT p.*, m.libelle AS mode FROM Paiement p JOIN Mode m ON p.idMode = m.idMode WHERE p.idPaie = ?',
      [idPaie]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/paiements/:matricule/tranches-payees', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pt.idTranche FROM PaiementTranche pt
       JOIN Paiement p ON p.idPaie = pt.idPaie
       WHERE p.matricule = ?`,
      [Number(req.params.matricule)]
    )
    res.json(rows.map(r => r.idTranche))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
