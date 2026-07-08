import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, '../../school_info.json')

const router = Router()

function read() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return { name: 'Groupe Scolaire Bilingue Les Anges', address: 'Yaoundé, Centre', region: 'Centre', phone: '677000000', email: 'contact@gsba.cm' }
  }
}

router.get('/school-info', (_req, res) => {
  res.json(read())
})

router.put('/school-info', (req, res) => {
  const { name, address, region, phone, email } = req.body
  const data = { name: name || '', address: address || '', region: region || '', phone: phone || '', email: email || '' }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  res.json(data)
})

export default router
