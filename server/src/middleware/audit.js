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
  idAdmin INT NULL,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entityId INT NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    const entity = ENTITY_MAP[entityKey] || entityKey
    const actionMap = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' }
    const action = actionMap[req.method] || req.method

    if (res.statusCode < 400) {
      let entityId = null
      if (req.params.id) entityId = parseInt(req.params.id)
      else if (req.body) entityId = extractId(req.body)

      const details = {
        body: sanitizeBody(req.body),
        params: req.params,
        query: req.query,
      }

      pool.query(
        'INSERT INTO AuditLogs (idAdmin, action, entity, entityId, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user?.id || null, action, entity, entityId, JSON.stringify(details), req.ip || req.socket?.remoteAddress || null]
      ).catch((err) => console.error('Audit log error:', err.message))
    }

    return _end(data, encoding, callback)
  }

  next()
}
