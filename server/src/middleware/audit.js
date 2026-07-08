import pool from '../db.js'

const ENTITY_MAP = {
  students: 'Élève',
  teachers: 'Enseignant',
  courses: 'Cours',
  timetable: 'Emploi du temps',
  paiements: 'Paiement',
  users: 'Utilisateur',
  classes: 'Classe',
  salles: 'Salle',
  cycles: 'Cycle',
  annees: 'Année académique',
  trimestres: 'Trimestre',
  sessions: 'Session',
  natures: 'Nature épreuve',
  epreuves: 'Épreuve',
  evaluations: 'Évaluation',
  scolarites: 'Scolarité',
  tranches: 'Tranche',
  modes: 'Mode',
  livres: 'Livre',
  specialites: 'Spécialité',
  messages: 'Message',
  parents: 'Parent',
  discipline: 'Discipline',
}

pool.query(`CREATE TABLE IF NOT EXISTS AuditLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NULL,
  userType VARCHAR(20) DEFAULT 'admin',
  role VARCHAR(50) DEFAULT 'admin',
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resourceId VARCHAR(50) NULL,
  ip VARCHAR(45) NULL,
  meta JSON NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`).catch(() => {})

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body
  const sanitized = { ...body }
  delete sanitized.password
  delete sanitized.token
  return sanitized
}

function extractId(body) {
  if (!body || typeof body !== 'object') return null
  if (body.id != null) return parseInt(body.id)
  if (body.idCours != null) return parseInt(body.idCours)
  if (body.idPaie != null) return parseInt(body.idPaie)
  if (body.idTemps != null) return parseInt(body.idTemps)
  if (body.idEnseignant != null) return parseInt(body.idEnseignant)
  if (body.idSalle != null) return parseInt(body.idSalle)
  if (body.idClasse != null) return parseInt(body.idClasse)
  if (body.insertId != null) return body.insertId
  if (body.matricule != null) return parseInt(body.matricule)
  return null
}

export function auditMiddleware(req, res, next) {
  if (req.method === 'GET') return next()

  const _end = res.end.bind(res)
  res.end = function (data, encoding, callback) {
    const parts = req.path.split('/').filter(Boolean)
    const entityKey = parts[0] || 'unknown'
    const resource = ENTITY_MAP[entityKey] || entityKey
    const actionMap = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' }
    const action = actionMap[req.method] || req.method

    if (res.statusCode < 400) {
      let resourceId = null
      if (req.params.id) resourceId = req.params.id
      else if (req.body) resourceId = String(extractId(req.body) ?? '')

      const details = {
        body: sanitizeBody(req.body),
        params: req.params,
        query: req.query,
      }

      pool.query(
        'INSERT INTO AuditLogs (userId, userType, role, action, resource, resourceId, ip, meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user?.id || null, 'admin', 'admin', action, resource, resourceId, req.ip || req.socket?.remoteAddress || null, JSON.stringify(details)]
      ).catch(() => {})
    }

    return _end(data, encoding, callback)
  }

  next()
}
