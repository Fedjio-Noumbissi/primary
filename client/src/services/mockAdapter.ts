import MockAdapter from 'axios-mock-adapter'
import api from './api'
import { getAppreciation } from '../utils/grading'
import * as data from './mockData'

let studentIdCounter = 2049
let teacherIdCounter = 4
let userIdCounter = 8
let parentIdCounter = 4
let classIdCounter = 7
let salleIdCounter = 7
let coursIdCounter = 11
let epreuveIdCounter = 3
let evalIdCounter = data.mockEvaluations.length + 1
let paieIdCounter = data.mockPaiements.length + 1
let livreIdCounter = data.mockLivres.length + 1
let messageIdCounter = data.mockMessages.length + 1

const mock = new MockAdapter(api, { delayResponse: 400 })

mock.onPost('/auth/login').reply((config) => {
  const { email, password } = JSON.parse(config.data || '{}')
  const user = data.mockUsers.find((u) => u.email === email && u.actif)
  if (user && user.password === password) {
    return [200, user]
  }
  return [401, { message: 'Invalid credentials' }]
})

mock.onGet('/dashboard/stats').reply(() => {
  const stats = {
    totalStudents: data.mockStudents.filter((s) => s.actif).length,
    totalTeachers: data.mockTeachers.length,
    totalPayments: data.mockPaiements.reduce((s, p) => s + p.montant, 0),
    pendingFees: 125000,
    classesCount: data.mockClasses.length,
    boysCount: data.mockStudents.filter((s) => s.sexe === 1).length,
    girlsCount: data.mockStudents.filter((s) => s.sexe === 2).length,
  }
  return [200, stats]
})

mock.onGet(/\/dashboard\/teacher\/\d+/).reply(() => [200, {
  classes: data.mockClasses.slice(0, 2),
  timetable: data.mockEmplois,
  recentGrades: data.mockEvaluations.slice(0, 5),
}])

mock.onGet(/\/dashboard\/parent\/\d+/).reply(() => [200, {
  child: data.mockStudents[0],
  grades: data.mockEvaluations.filter((e) => e.matricule === 2001),
  payments: data.mockPaiements.filter((p) => p.matricule === 2001),
  messages: data.mockMessages,
}])

mock.onGet('/students').reply(() => [200, data.mockStudents.filter((s) => s.actif)])

mock.onGet(/\/students\/\d+$/).reply((config) => {
  const id = parseInt(config.url!.split('/').pop()!)
  const s = data.mockStudents.find((st) => st.matricule === id)
  return s ? [200, s] : [404]
})

mock.onPost('/students').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const student = { ...body, matricule: studentIdCounter++, actif: true }
  data.mockStudents.push(student)
  return [201, student]
})

mock.onPut(/\/students\/\d+$/).reply((config) => {
  const id = parseInt(config.url!.split('/').pop()!)
  const body = JSON.parse(config.data || '{}')
  const idx = data.mockStudents.findIndex((s) => s.matricule === id)
  if (idx >= 0) {
    data.mockStudents[idx] = { ...data.mockStudents[idx], ...body }
    return [200, data.mockStudents[idx]]
  }
  return [404]
})

mock.onDelete(/\/students\/\d+$/).reply((config) => {
  const id = parseInt(config.url!.split('/').pop()!)
  const idx = data.mockStudents.findIndex((s) => s.matricule === id)
  if (idx >= 0) {
    data.mockStudents.splice(idx, 1)
    return [204]
  }
  return [404]
})

mock.onGet(/\/students\/\d+\/grades/).reply((config) => {
  const id = parseInt(config.url!.match(/\/students\/(\d+)\/grades/)![1])
  return [200, data.mockEvaluations.filter((e) => e.matricule === id)]
})

mock.onGet(/\/students\/\d+\/payments/).reply((config) => {
  const id = parseInt(config.url!.match(/\/students\/(\d+)\/payments/)![1])
  return [200, data.mockPaiements.filter((p) => p.matricule === id)]
})

mock.onPost('/students/enroll').reply(201, { success: true })

mock.onGet('/teachers').reply(() => [200, data.mockTeachers])
mock.onPost('/teachers').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const teacher = { ...body, idEnseignant: teacherIdCounter++, actif: true }
  data.mockTeachers.push(teacher)
  return [201, teacher]
})
mock.onPut(/\/teachers\/\d+/).reply((config) => {
  const id = parseInt(config.url!.match(/\/teachers\/(\d+)/)![1])
  const body = JSON.parse(config.data || '{}')
  const idx = data.mockTeachers.findIndex((t) => t.idEnseignant === id)
  if (idx >= 0) { data.mockTeachers[idx] = { ...data.mockTeachers[idx], ...body }; return [200, data.mockTeachers[idx]] }
  return [404]
})

mock.onGet('/users').reply(() => [200, data.mockUsers])

mock.onPost('/users').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const user = { ...body, idPers: userIdCounter++, token: `mock-jwt-${userIdCounter}`, actif: true }
  data.mockUsers.push(user)
  if (user.typePersonne === 3) {
    data.mockParents.push({ idParent: parentIdCounter++, idPers: user.idPers, nom: user.nom, prenom: user.prenom, email: user.email, mobile: user.mobile, actif: true })
  }
  return [201, user]
})

mock.onPut(/\/users\/\d+/).reply((config) => {
  const id = parseInt(config.url!.match(/\/users\/(\d+)/)![1])
  const body = JSON.parse(config.data || '{}')
  const idx = data.mockUsers.findIndex((u) => u.idPers === id)
  if (idx >= 0) {
    data.mockUsers[idx] = { ...data.mockUsers[idx], ...body }
    return [200, data.mockUsers[idx]]
  }
  return [404]
})

mock.onDelete(/\/users\/\d+/).reply((config) => {
  const id = parseInt(config.url!.match(/\/users\/(\d+)/)![1])
  const idx = data.mockUsers.findIndex((u) => u.idPers === id)
  if (idx >= 0) {
    data.mockUsers.splice(idx, 1)
    const parentIdx = data.mockParents.findIndex((p) => p.idPers === id)
    if (parentIdx >= 0) data.mockParents.splice(parentIdx, 1)
    return [204]
  }
  return [404]
})

mock.onPatch(/\/users\/\d+\/toggle-active/).reply((config) => {
  const id = parseInt(config.url!.match(/\/users\/(\d+)\/toggle-active/)![1])
  const idx = data.mockUsers.findIndex((u) => u.idPers === id)
  if (idx >= 0) {
    data.mockUsers[idx].actif = !data.mockUsers[idx].actif
    return [200, data.mockUsers[idx]]
  }
  return [404]
})

mock.onGet('/parents').reply(() => [200, data.mockParents])

mock.onPatch(/\/students\/\d+\/toggle-active/).reply((config) => {
  const id = parseInt(config.url!.match(/\/students\/(\d+)\/toggle-active/)![1])
  const idx = data.mockStudents.findIndex((s) => s.matricule === id)
  if (idx >= 0) {
    data.mockStudents[idx].actif = !data.mockStudents[idx].actif
    return [200, data.mockStudents[idx]]
  }
  return [404]
})

mock.onPatch(/\/teachers\/\d+\/toggle-active/).reply((config) => {
  const id = parseInt(config.url!.match(/\/teachers\/(\d+)\/toggle-active/)![1])
  const idx = data.mockTeachers.findIndex((t) => t.idEnseignant === id)
  if (idx >= 0) {
    data.mockTeachers[idx].actif = !data.mockTeachers[idx].actif
    return [200, data.mockTeachers[idx]]
  }
  return [404]
})

mock.onGet('/cycles').reply(() => [200, data.mockCycles])
mock.onPost('/cycles').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const cycle = { ...body, idCycle: data.mockCycles.length + 1 }
  data.mockCycles.push(cycle)
  return [201, cycle]
})
mock.onGet('/classes').reply(() => [200, data.mockClasses])
mock.onPost('/classes').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const cls = { ...body, idClasse: classIdCounter++ }
  data.mockClasses.push(cls)
  return [201, cls]
})
mock.onGet('/salles').reply(() => [200, data.mockSalles])
mock.onPost('/salles').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const s = { ...body, idSalle: salleIdCounter++, actif: true }
  data.mockSalles.push(s)
  return [201, s]
})

mock.onGet('/annees').reply(() => [200, data.mockAnnees])
mock.onPost('/annees').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const a = { ...body, idAnnee: data.mockAnnees.length + 1 }
  data.mockAnnees.push(a)
  return [201, a]
})
mock.onGet('/trimestres').reply((config) => {
  const idAca = config.params?.idAca
  let res = data.mockTrimestres
  if (idAca) res = res.filter((t) => t.idAca === idAca)
  return [200, res]
})
mock.onPost('/trimestres').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const t = { ...body, idTrimes: data.mockTrimestres.length + 1 }
  data.mockTrimestres.push(t)
  return [201, t]
})
mock.onGet('/sessions').reply((config) => {
  const idTrimestre = config.params?.idTrimestre
  let res = data.mockSessions
  if (idTrimestre) res = res.filter((s) => s.idTrimestre === idTrimestre)
  return [200, res]
})
mock.onPost('/sessions').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const s = { ...body, idSession: data.mockSessions.length + 1 }
  data.mockSessions.push(s)
  return [201, s]
})

mock.onGet('/courses').reply(() => [200, data.mockCourses])
mock.onPost('/courses').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const c = { ...body, idCours: coursIdCounter++, note: 20 }
  data.mockCourses.push(c)
  return [201, c]
})

mock.onGet('/timetable').reply((config) => {
  const idClasse = config.params?.idClasse
  let res = data.mockEmplois
  if (idClasse) res = res.filter((e) => e.idClasse === idClasse)
  return [200, res]
})
mock.onPost('/timetable').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const t = { ...body, idTemps: data.mockEmplois.length + 1 }
  data.mockEmplois.push(t)
  return [201, t]
})

mock.onGet('/natures').reply(() => [200, data.mockNatures])
mock.onGet('/epreuves').reply(() => [200, data.mockEpreuves])
mock.onPost('/epreuves').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const e = { ...body, idEpreuve: epreuveIdCounter++ }
  data.mockEpreuves.push(e)
  return [201, e]
})
mock.onGet('/evaluations').reply((config) => {
  let res = data.mockEvaluations
  if (config.params?.idSession) res = res.filter((e) => e.idSession === config.params.idSession)
  if (config.params?.idCours) res = res.filter((e) => e.idCours === config.params.idCours)
  return [200, res]
})
mock.onPost('/evaluations').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const ev = { ...body, idEval: evalIdCounter++ }
  ev.appreciation = getAppreciation(ev.note)
  data.mockEvaluations.push(ev)
  return [201, ev]
})
mock.onPost('/evaluations/bulk').reply((config) => {
  const body = JSON.parse(config.data || '[]')
  body.forEach((ev: any) => {
    ev.idEval = evalIdCounter++
    ev.appreciation = getAppreciation(ev.note)
    data.mockEvaluations.push(ev)
  })
  return [201, body]
})

mock.onGet(/\/reports\/(\d+)\/(\d+)/).reply((config) => {
  const [, mat, trim] = config.url!.match(/\/reports\/(\d+)\/(\d+)/)!
  const student = data.mockStudents.find((s) => s.matricule === parseInt(mat))
  const evaluations = data.mockEvaluations.filter((e) => e.matricule === parseInt(mat))
  return [200, { student, evaluations, trimester: data.mockTrimestres.find((t) => t.idTrimes === parseInt(trim)) }]
})

mock.onGet('/scolarites').reply(() => [200, data.mockScolarites])
mock.onPost('/scolarites').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const s = { ...body, idScolante: data.mockScolarites.length + 1 }
  data.mockScolarites.push(s)
  return [201, s]
})
mock.onGet('/tranches').reply((config) => {
  let res = data.mockTranches
  if (config.params?.idScolante) res = res.filter((t) => t.idScolante === config.params.idScolante)
  return [200, res]
})
mock.onPost('/tranches').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const t = { ...body, idTranche: data.mockTranches.length + 1 }
  data.mockTranches.push(t)
  return [201, t]
})
mock.onGet('/modes').reply(() => [200, data.mockModes])
mock.onPost('/modes').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const m = { ...body, idMode: data.mockModes.length + 1, actif: true }
  data.mockModes.push(m)
  return [201, m]
})
mock.onGet('/paiements').reply(() => [200, data.mockPaiements])
mock.onPost('/paiements').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const p = { ...body, idPaie: paieIdCounter++, created_at: new Date().toISOString() }
  data.mockPaiements.push(p)
  return [201, p]
})

mock.onGet('/specialites').reply(() => [200, data.mockSpecialites])
mock.onGet('/livres').reply(() => [200, data.mockLivres])
mock.onPost('/livres').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const l = { ...body, idLivre: livreIdCounter++ }
  data.mockLivres.push(l)
  return [201, l]
})

mock.onGet('/messages').reply(() => [200, data.mockMessages])
mock.onPost('/messages').reply((config) => {
  const body = JSON.parse(config.data || '{}')
  const m = { ...body, idMessages: messageIdCounter++, created_at: new Date().toISOString(), valider: true }
  data.mockMessages.push(m)
  return [201, m]
})

export default mock
