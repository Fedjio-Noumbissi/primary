import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

import { auditMiddleware } from './middleware/audit.js'
import auditRoutes from './routes/audit.js'
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

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)

app.use('/api/audit-logs', auditRoutes)

app.use(auditMiddleware)

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

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

const clientDist = path.join(__dirname, '../../client/dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
