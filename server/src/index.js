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

app.use(cors())
app.use(express.json())

async function migrate() {
  const alters = [
    'ALTER TABLE Scolarite ADD COLUMN idClasse INT NULL',
    'ALTER TABLE Scolarite ADD COLUMN inscription DOUBLE DEFAULT 0',
    'ALTER TABLE Scolarite ADD COLUMN nbreTranche INT DEFAULT 3',
    'ALTER TABLE Scolarite ADD COLUMN description VARCHAR(255) NULL',
    'ALTER TABLE Scolarite ADD COLUMN idFondateur INT NULL',
    'ALTER TABLE Classe ADD COLUMN isDelete TINYINT DEFAULT 0',
    'ALTER TABLE Classe ADD COLUMN titulaire INT NULL',
    'ALTER TABLE Classe ADD COLUMN specialite VARCHAR(255) NULL',
    'ALTER TABLE Classe ADD COLUMN idAdmin INT NULL',
    'ALTER TABLE Cycle ADD COLUMN isDelete TINYINT DEFAULT 0',
    'ALTER TABLE Cycle ADD COLUMN description VARCHAR(255) NULL',
    'ALTER TABLE Cycle ADD COLUMN idAdmin INT NULL',
    'ALTER TABLE Salle ADD COLUMN actif TINYINT DEFAULT 1',
    'ALTER TABLE Salle ADD COLUMN capacite INT NULL',
    'ALTER TABLE Salle ADD COLUMN idAdmin INT NULL',
    "ALTER TABLE Salle MODIFY COLUMN surface VARCHAR(100) NULL",
    'ALTER TABLE Cours ADD COLUMN idEnseignant INT NULL',
    'ALTER TABLE Cours ADD COLUMN actif TINYINT DEFAULT 1',
    'ALTER TABLE Cours ADD COLUMN isDelete TINYINT DEFAULT 0',
    'ALTER TABLE Cours ADD COLUMN description VARCHAR(255) NULL',
    'ALTER TABLE Frequente MODIFY COLUMN matricule VARCHAR(255)',
    'ALTER TABLE Tranches ADD COLUMN actif TINYINT DEFAULT 1',
    'ALTER TABLE Tranches ADD COLUMN libelle VARCHAR(255) NULL',
    'ALTER TABLE Tranches ADD COLUMN delai_mois VARCHAR(20) NULL',
    'ALTER TABLE Tranches ADD COLUMN delai_jour VARCHAR(20) NULL',
    'ALTER TABLE Tranches ADD COLUMN date_limite DATE NULL',
    'ALTER TABLE Tranches ADD COLUMN idFondateur INT NULL',
    'ALTER TABLE Personne ADD COLUMN isDelete TINYINT DEFAULT 0',
    'ALTER TABLE Parents ADD COLUMN isDelete TINYINT DEFAULT 0',
    'ALTER TABLE Epreuve ADD COLUMN isDelete TINYINT DEFAULT 0',
    'ALTER TABLE eleves ADD COLUMN idCycle INT NULL',
    "ALTER TABLE Parents MODIFY COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP",
    'ALTER TABLE EmploiDuTemps ADD COLUMN idEnseignant INT NULL',
    'ALTER TABLE EmploiDuTemps ADD COLUMN idSalle INT NULL',
    "ALTER TABLE Cours ADD COLUMN couleur VARCHAR(7) DEFAULT NULL",
    'CREATE TABLE IF NOT EXISTS PaiementTranche (id INTEGER PRIMARY KEY AUTO_INCREMENT, idPaie INTEGER NOT NULL, idTranche INTEGER NOT NULL, UNIQUE KEY uq_paie_tranche (idPaie, idTranche))',
    'ALTER TABLE Rapport ADD COLUMN idDiscipline INT NULL',
    "ALTER TABLE Discipline MODIFY COLUMN points INT NOT NULL DEFAULT 0",
    'ALTER TABLE AnneeAcademique ADD COLUMN isDelete TINYINT(1) DEFAULT 0',
    'ALTER TABLE AnneeAcademique ADD COLUMN actif TINYINT(1) DEFAULT 0',
    'ALTER TABLE Trimestre ADD COLUMN clos TINYINT(1) DEFAULT 0',
  ]
  for (const sql of alters) {
    try { await pool.query(sql) } catch (e) { /* column may already exist */ }
  }
}

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
