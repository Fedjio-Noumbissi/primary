import { Router } from 'express'
import pool from '../db.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, authorize(1), async (req, res) => {
  try {
    const { userId, action, entity, page = 1, limit = 50 } = req.query
    let where = []
    let params = []

    if (userId) {
      where.push('a.idAdmin = ?')
      params.push(Number(userId))
    }
    if (action) {
      where.push('a.action = ?')
      params.push(action)
    }
    if (entity) {
      where.push('a.entity = ?')
      params.push(entity)
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const offset = (Math.max(1, Number(page)) - 1) * Number(limit)

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM AuditLogs a ${whereClause}`,
      params
    )
    const total = countRows[0].total

    const [rows] = await pool.query(
      `SELECT a.*, u.name AS adminName
       FROM AuditLogs a
       LEFT JOIN users u ON u.id = a.idAdmin
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    )

    const mapped = rows.map((r) => ({
      id: r.id,
      idAdmin: r.idAdmin,
      adminName: r.adminName || 'N/A',
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details,
      ip_address: r.ip_address,
      created_at: r.created_at,
    }))

    res.json({ data: mapped, total, page: Number(page), limit: Number(limit) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
