import axios from 'axios'
import { User, Student, Teacher, Cycle, Classe, Salle, AnneeAcademique, Trimestre, Session, Course, EmploiDuTemps, NatureEpreuve, Epreuve, Evaluation, Scolarite, Tranche, Mode, Paiement, Livre, Specialite, Message, DashboardStats, Parent } from '../types'

const api = axios.create({ baseURL: '/api', timeout: 10000 })

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('user')
  if (stored) {
    const user: User = JSON.parse(stored)
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: (email: string, password: string) => api.post<User>('/auth/login', { email, password }),
}

export const dashboardAPI = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats'),
  getTeacherData: (idPers: number) => api.get(`/dashboard/teacher/${idPers}`),
  getParentData: (idPers: number) => api.get(`/dashboard/parent/${idPers}`),
  getStudentsPerClass: () => api.get<{ libelle: string; effectif: number }[]>('/dashboard/students-per-class'),
  getPaymentTrend: () => api.get<{ month: string; total: number }[]>('/dashboard/payment-trend'),
  getRecentPayments: () => api.get('/dashboard/recent-payments'),
  getRecentStudents: () => api.get('/dashboard/recent-students'),
}

export const classAPI = {
  getCycles: () => api.get<Cycle[]>('/cycles'),
  createCycle: (data: Partial<Cycle>) => api.post<Cycle>('/cycles', data),
  getClasses: () => api.get<Classe[]>('/classes'),
  createClass: (data: Partial<Classe>) => api.post<Classe>('/classes', data),
  getSalles: () => api.get<Salle[]>('/salles'),
  createSalle: (data: Partial<Salle>) => api.post<Salle>('/salles', data),
}

export const academicAPI = {
  getAnnees: () => api.get<AnneeAcademique[]>('/annees'),
  createAnnee: (data: Partial<AnneeAcademique>) => api.post<AnneeAcademique>('/annees', data),
  getTrimestres: (idAca?: number) => api.get<Trimestre[]>('/trimestres', { params: { idAca } }),
  createTrimestre: (data: Partial<Trimestre>) => api.post<Trimestre>('/trimestres', data),
  getSessions: (idTrimestre?: number) => api.get<Session[]>('/sessions', { params: { idTrimestre } }),
  createSession: (data: Partial<Session>) => api.post<Session>('/sessions', data),
}

export const courseAPI = {
  getAll: () => api.get<Course[]>('/courses'),
  create: (data: Partial<Course>) => api.post<Course>('/courses', data),
  getTimetable: (idClasse?: number) => api.get<EmploiDuTemps[]>('/timetable', { params: { idClasse } }),
  addTimetableEntry: (data: Partial<EmploiDuTemps>) => api.post<EmploiDuTemps>('/timetable', data),
}

export const examAPI = {
  getNatures: () => api.get<NatureEpreuve[]>('/natures'),
  getEpreuves: () => api.get<Epreuve[]>('/epreuves'),
  createEpreuve: (data: Partial<Epreuve>) => api.post<Epreuve>('/epreuves', data),
  getEvaluations: (params?: { idSession?: number; idCours?: number }) => api.get<Evaluation[]>('/evaluations', { params }),
  createEvaluation: (data: Partial<Evaluation>) => api.post<Evaluation>('/evaluations', data),
  bulkCreateEvaluations: (data: Partial<Evaluation>[]) => api.post('/evaluations/bulk', data),
}

export const reportAPI = {
  generate: (matricule: number, idTrimes: number) => api.get(`/reports/${matricule}/${idTrimes}`),
}

export const paymentAPI = {
  getScolarites: () => api.get<Scolarite[]>('/scolarites'),
  createScolarite: (data: Partial<Scolarite>) => api.post<Scolarite>('/scolarites', data),
  getTranches: (idScolante?: number) => api.get<Tranche[]>('/tranches', { params: { idScolante } }),
  createTranche: (data: Partial<Tranche>) => api.post<Tranche>('/tranches', data),
  getModes: () => api.get<Mode[]>('/modes'),
  createMode: (data: Partial<Mode>) => api.post<Mode>('/modes', data),
  getPaiements: () => api.get<Paiement[]>('/paiements'),
  createPaiement: (data: Partial<Paiement>) => api.post<Paiement>('/paiements', data),
}

export const libraryAPI = {
  getSpecialites: () => api.get<Specialite[]>('/specialites'),
  getLivres: () => api.get<Livre[]>('/livres'),
  createLivre: (data: Partial<Livre>) => api.post<Livre>('/livres', data),
}

export const messageAPI = {
  getAll: () => api.get<Message[]>('/messages'),
  send: (data: Partial<Message>) => api.post<Message>('/messages', data),
}

export const userAPI = {
  getAll: () => api.get<User[]>('/users'),
  create: (data: Partial<User>) => api.post<User>('/users', data),
  update: (id: number, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  toggleActive: (id: number) => api.patch<User>(`/users/${id}/toggle-active`),
}

export const parentAPI = {
  getAll: () => api.get<Parent[]>('/parents'),
}

export const studentAPI = {
  getAll: () => api.get<Student[]>('/students'),
  getById: (id: number) => api.get<Student>(`/students/${id}`),
  create: (data: Partial<Student>) => api.post<Student>('/students', data),
  update: (id: number, data: Partial<Student>) => api.put<Student>(`/students/${id}`, data),
  delete: (id: number) => api.delete(`/students/${id}`),
  toggleActive: (id: number) => api.patch<Student>(`/students/${id}/toggle-active`),
  getGrades: (id: number) => api.get<Evaluation[]>(`/students/${id}/grades`),
  getPayments: (id: number) => api.get<Paiement[]>(`/students/${id}/payments`),
  enroll: (data: { matricule: number; idSalle: number; idAcademi: number }) => api.post('/students/enroll', data),
}

export const teacherAPI = {
  getAll: () => api.get<Teacher[]>('/teachers'),
  create: (data: Partial<Teacher>) => api.post<Teacher>('/teachers', data),
  update: (id: number, data: Partial<Teacher>) => api.put<Teacher>(`/teachers/${id}`, data),
  toggleActive: (id: number) => api.patch<Teacher>(`/teachers/${id}/toggle-active`),
  assignCourses: (id: number, courseIds: number[]) => api.patch<{ cours: Course[] }>(`/teachers/${id}/courses`, { courseIds }),
  assignClass: (id: number, idClasse: number | null) => api.patch(`/teachers/${id}/class`, { idClasse }),
}

export default api
