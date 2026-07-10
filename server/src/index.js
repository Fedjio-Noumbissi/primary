import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

import pool from './db.js'


import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import studentRoutes from './routes/students.js'
import teacherRoutes from './routes/teachers.js'
import classRoutes from './routes/classes.js'
import academicRoutes from './routes/academics.js'
import courseRoutes from './routes/courses.js'
import examRoutes from './routes/exams.js'
import paymentRoutes from './routes/payments.js'
import libraryRoutes from './routes/library.js'
import messageRoutes from './routes/messages.js'
import parentRoutes from './routes/parents.js'
import dashboardRoutes from './routes/dashboard.js'
import reportRoutes from './routes/reports.js'
import searchRoutes from './routes/search.js'
import uploadRoutes from './routes/upload.js'
import disciplineRoutes from './routes/discipline.js'
import schoolRoutes from './routes/school.js'
import contactRoutes from './routes/contacts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3001

const corsOrigin = process.env.CORS_ORIGIN
app.use(cors(corsOrigin ? { origin: corsOrigin.split(','), credentials: true } : undefined))
app.use(express.json())

// ─── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/teachers', teacherRoutes)
app.use('/api', classRoutes)
app.use('/api', academicRoutes)
app.use('/api', courseRoutes)
app.use('/api', examRoutes)
app.use('/api', paymentRoutes)
app.use('/api', libraryRoutes)
app.use('/api', messageRoutes)
app.use('/api', parentRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api', reportRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api', disciplineRoutes)
app.use('/api', schoolRoutes)
app.use('/api', contactRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

const clientDist = path.join(__dirname, '../../client/dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

// ─── Global error handler ──────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error' })
})

// ─── Migration + startup ───────────────────────────────────
async function migrate() {
  async function columnExists(table, column) {
    const [rows] = await pool.query("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", [table, column])
    return rows.length > 0
  }

  const alters = [
    { sql: 'ALTER TABLE Scolarite ADD COLUMN idClasse INT NULL', check: () => columnExists('Scolarite', 'idClasse') },
    { sql: 'ALTER TABLE Scolarite ADD COLUMN inscription DOUBLE DEFAULT 0', check: () => columnExists('Scolarite', 'inscription') },
    { sql: 'ALTER TABLE Scolarite ADD COLUMN nbreTranche INT DEFAULT 3', check: () => columnExists('Scolarite', 'nbreTranche') },
    { sql: 'ALTER TABLE Scolarite ADD COLUMN description VARCHAR(255) NULL', check: () => columnExists('Scolarite', 'description') },
    { sql: 'ALTER TABLE Scolarite ADD COLUMN idFondateur INT NULL', check: () => columnExists('Scolarite', 'idFondateur') },
    { sql: 'ALTER TABLE Classe ADD COLUMN isDelete TINYINT DEFAULT 0', check: () => columnExists('Classe', 'isDelete') },
    { sql: 'ALTER TABLE Classe ADD COLUMN titulaire INT NULL', check: () => columnExists('Classe', 'titulaire') },
    { sql: 'ALTER TABLE Classe ADD COLUMN specialite VARCHAR(255) NULL', check: () => columnExists('Classe', 'specialite') },
    { sql: 'ALTER TABLE Classe ADD COLUMN idAdmin INT NULL', check: () => columnExists('Classe', 'idAdmin') },
    { sql: 'ALTER TABLE Cycle ADD COLUMN isDelete TINYINT DEFAULT 0', check: () => columnExists('Cycle', 'isDelete') },
    { sql: 'ALTER TABLE Cycle ADD COLUMN description VARCHAR(255) NULL', check: () => columnExists('Cycle', 'description') },
    { sql: 'ALTER TABLE Cycle ADD COLUMN idAdmin INT NULL', check: () => columnExists('Cycle', 'idAdmin') },
    { sql: 'ALTER TABLE Salle ADD COLUMN actif TINYINT DEFAULT 1', check: () => columnExists('Salle', 'actif') },
    { sql: 'ALTER TABLE Salle ADD COLUMN capacite INT NULL', check: () => columnExists('Salle', 'capacite') },
    { sql: 'ALTER TABLE Salle ADD COLUMN idAdmin INT NULL', check: () => columnExists('Salle', 'idAdmin') },
    { sql: "ALTER TABLE Salle MODIFY COLUMN surface VARCHAR(100) NULL" },
    { sql: 'ALTER TABLE Cours ADD COLUMN idEnseignant INT NULL', check: () => columnExists('Cours', 'idEnseignant') },
    { sql: 'ALTER TABLE Cours ADD COLUMN actif TINYINT DEFAULT 1', check: () => columnExists('Cours', 'actif') },
    { sql: 'ALTER TABLE Cours ADD COLUMN isDelete TINYINT DEFAULT 0', check: () => columnExists('Cours', 'isDelete') },
    { sql: 'ALTER TABLE Cours ADD COLUMN description VARCHAR(255) NULL', check: () => columnExists('Cours', 'description') },
    { sql: 'ALTER TABLE Frequente MODIFY COLUMN matricule VARCHAR(255)' },
    { sql: 'ALTER TABLE Tranches ADD COLUMN actif TINYINT DEFAULT 1', check: () => columnExists('Tranches', 'actif') },
    { sql: 'ALTER TABLE Tranches ADD COLUMN libelle VARCHAR(255) NULL', check: () => columnExists('Tranches', 'libelle') },
    { sql: 'ALTER TABLE Tranches ADD COLUMN delai_mois VARCHAR(20) NULL', check: () => columnExists('Tranches', 'delai_mois') },
    { sql: 'ALTER TABLE Tranches ADD COLUMN delai_jour VARCHAR(20) NULL', check: () => columnExists('Tranches', 'delai_jour') },
    { sql: 'ALTER TABLE Tranches ADD COLUMN date_limite DATE NULL', check: () => columnExists('Tranches', 'date_limite') },
    { sql: 'ALTER TABLE Tranches ADD COLUMN idFondateur INT NULL', check: () => columnExists('Tranches', 'idFondateur') },
    { sql: 'ALTER TABLE Personne ADD COLUMN isDelete TINYINT DEFAULT 0', check: () => columnExists('Personne', 'isDelete') },
    { sql: 'ALTER TABLE Parents ADD COLUMN isDelete TINYINT DEFAULT 0', check: () => columnExists('Parents', 'isDelete') },
    { sql: 'ALTER TABLE Epreuve ADD COLUMN isDelete TINYINT DEFAULT 0', check: () => columnExists('Epreuve', 'isDelete') },
    { sql: 'ALTER TABLE eleves ADD COLUMN idCycle INT NULL', check: () => columnExists('eleves', 'idCycle') },
    { sql: "ALTER TABLE Parents MODIFY COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP" },
    { sql: 'ALTER TABLE EmploiDuTemps ADD COLUMN idEnseignant INT NULL', check: () => columnExists('EmploiDuTemps', 'idEnseignant') },
    { sql: 'ALTER TABLE EmploiDuTemps ADD COLUMN idSalle INT NULL', check: () => columnExists('EmploiDuTemps', 'idSalle') },
    { sql: "ALTER TABLE Cours ADD COLUMN couleur VARCHAR(7) DEFAULT NULL", check: () => columnExists('Cours', 'couleur') },
    { sql: 'CREATE TABLE IF NOT EXISTS PaiementTranche (id INTEGER PRIMARY KEY AUTO_INCREMENT, idPaie INTEGER NOT NULL, idTranche INTEGER NOT NULL, UNIQUE KEY uq_paie_tranche (idPaie, idTranche))' },
    { sql: 'ALTER TABLE Rapport ADD COLUMN idDiscipline INT NULL', check: () => columnExists('Rapport', 'idDiscipline') },
    { sql: "ALTER TABLE Discipline MODIFY COLUMN points INT NOT NULL DEFAULT 0" },
    { sql: 'ALTER TABLE AnneeAcademique ADD COLUMN isDelete TINYINT(1) DEFAULT 0', check: () => columnExists('AnneeAcademique', 'isDelete') },
    { sql: 'ALTER TABLE AnneeAcademique ADD COLUMN actif TINYINT(1) DEFAULT 0', check: () => columnExists('AnneeAcademique', 'actif') },
    { sql: 'ALTER TABLE AnneeAcademique ADD COLUMN periode VARCHAR(50) NULL', check: () => columnExists('AnneeAcademique', 'periode') },
    { sql: 'ALTER TABLE Trimestre ADD COLUMN clos TINYINT(1) DEFAULT 0', check: () => columnExists('Trimestre', 'clos') },
    { sql: 'ALTER TABLE Trimestre ADD COLUMN periode VARCHAR(100) NULL', check: () => columnExists('Trimestre', 'periode') },
    { sql: 'ALTER TABLE Messages MODIFY COLUMN idParent INT UNSIGNED NULL' },
    { sql: 'ALTER TABLE Messages ADD COLUMN idExp_Pers INT NOT NULL AFTER idMessages', check: () => columnExists('Messages', 'idExp_Pers') },
    { sql: "ALTER TABLE Messages CHANGE COLUMN contenu information TEXT NULL", check: () => columnExists('Messages', 'information') },
    { sql: 'ALTER TABLE Messages ADD COLUMN AnneeAcade INT NULL AFTER information', check: () => columnExists('Messages', 'AnneeAcade') },
    { sql: 'ALTER TABLE Messages ADD COLUMN receiverRole VARCHAR(20) NULL AFTER AnneeAcade', check: () => columnExists('Messages', 'receiverRole') },
    { sql: 'ALTER TABLE Messages ADD COLUMN receiverId INT NULL AFTER receiverRole', check: () => columnExists('Messages', 'receiverId') },
    { sql: 'ALTER TABLE Messages ADD COLUMN receiverLabel VARCHAR(100) NULL AFTER receiverId', check: () => columnExists('Messages', 'receiverLabel') },
    { sql: "ALTER TABLE Rapport ADD COLUMN commentaire TEXT NULL AFTER idDiscipline", check: () => columnExists('Rapport', 'commentaire') },
  ]
  for (const entry of alters) {
    if (entry.check && await entry.check()) continue
    try { await pool.query(entry.sql) } catch (e) { /* already applied */ }
  }
}

// ─── Start server ──────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err)
  process.exit(1)
})
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err)
})

async function start() {
  await migrate()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  }).on('error', (err) => {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  })
}
start()
