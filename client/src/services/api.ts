import axios from 'axios'
import { User, Student, Teacher, Cycle, Classe, Salle, AnneeAcademique, Trimestre, Session, Course, EmploiDuTemps, NatureEpreuve, Epreuve, Evaluation, Scolarite, Tranche, Mode, Paiement, Livre, Specialite, Message, DashboardStats, Parent, SearchResult } from '../types'

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
  getArchivedCycles: () => api.get<Cycle[]>('/cycles/archived'),
  createCycle: (data: Partial<Cycle>) => api.post<Cycle>('/cycles', data),
  toggleArchiveCycle: (id: number) => api.patch<Cycle>(`/cycles/${id}/toggle-archive`),
  getClasses: () => api.get<Classe[]>('/classes'),
  getArchivedClasses: () => api.get<Classe[]>('/classes/archived'),
  createClass: (data: Partial<Classe>) => api.post<Classe>('/classes', data),
  toggleArchiveClass: (id: number) => api.patch<Classe>(`/classes/${id}/toggle-archive`),
  deleteClass: (id: number) => api.delete(`/classes/${id}`),
  setClassTeacher: (id: number, titulaire: number | null) => api.patch<Classe>(`/classes/${id}/titulaire`, { titulaire }),
  getClassStudentCount: (id: number) => api.get<{ count: number }>(`/classes/${id}/students`),
  getClassPDF: (id: number) => `/api/classes/${id}/pdf`,
  getSalles: () => api.get<(Salle & { occupancy: number })[]>('/salles'),
  createSalle: (data: Partial<Salle & { capacite?: number }>) => api.post<Salle>('/salles', data),
  toggleActiveSalle: (id: number) => api.patch<Salle>(`/salles/${id}/toggle-active`),
  updateSalle: (id: number, data: Partial<Salle & { capacite?: number }>) => api.put<Salle>(`/salles/${id}`, data),
  deleteSalle: (id: number) => api.delete(`/salles/${id}`),
}

export const academicAPI = {
  getAnnees: () => api.get<AnneeAcademique[]>('/annees'),
  createAnnee: (data: Partial<AnneeAcademique>) => api.post<AnneeAcademique>('/annees', data),
  setActiveAnnee: (id: number) => api.patch<AnneeAcademique>(`/annees/${id}/set-active`),
  closeTrimestre: (id: number) => api.patch<Trimestre>(`/trimestres/${id}/close`),
  getTrimestres: (idAca?: number) => api.get<Trimestre[]>('/trimestres', { params: { idAca } }),
  createTrimestre: (data: Partial<Trimestre>) => api.post<Trimestre>('/trimestres', data),
  getSessions: (idTrimestre?: number) => api.get<Session[]>('/sessions', { params: { idTrimestre } }),
  createSession: (data: Partial<Session>) => api.post<Session>('/sessions', data),
}

export const courseAPI = {
  getAll: () => api.get<Course[]>('/courses'),
  create: (data: Partial<Course>) => api.post<Course>('/courses', data),
  getTimetable: (idClasse?: number) => api.get<EmploiDuTemps[]>('/timetable', { params: { idClasse } }),
  getTimetableByTeacher: (idEnseignant: number) => api.get<EmploiDuTemps[]>('/timetable', { params: { idEnseignant } }),
  getTimetableBySalle: (idSalle: number) => api.get<EmploiDuTemps[]>('/timetable', { params: { idSalle } }),
  checkConflicts: (data: { jour: string; heure: string; idEnseignant?: number; idSalle?: number; excludeId?: number }) =>
    api.get<{ conflict: boolean; entries: EmploiDuTemps[] }>('/timetable/check-conflicts', { params: data }),
  addTimetableEntry: (data: Partial<EmploiDuTemps>) => api.post<EmploiDuTemps>('/timetable', data),
  updateTimetableEntry: (id: number, data: Partial<EmploiDuTemps>) => api.put<EmploiDuTemps>(`/timetable/${id}`, data),
  deleteTimetableEntry: (id: number) => api.delete(`/timetable/${id}`),
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
  getScolariteByClasse: (idClasse: number) => api.get<{ scolarite: Scolarite | null; tranches: Tranche[] }>(`/scolarite/by-classe/${idClasse}`),
  updateScolarite: (id: number, data: Partial<Scolarite>) => api.put<Scolarite>(`/scolarite/${id}`, data),
  deleteScolarite: (id: number) => api.delete(`/scolarites/${id}`),
  getTranches: (idScolarite?: number) => api.get<Tranche[]>('/tranches', { params: { idScolarite } }),
  createTranche: (data: Partial<Tranche>) => api.post<Tranche>('/tranches', data),
  updateTranche: (id: number, data: Partial<Tranche>) => api.put<Tranche>(`/tranches/${id}`, data),
  deleteTranche: (id: number) => api.delete(`/tranches/${id}`),
  getModes: () => api.get<Mode[]>('/modes'),
  createMode: (data: Partial<Mode>) => api.post<Mode>('/modes', data),
  updateMode: (id: number, data: Partial<Mode>) => api.put<Mode>(`/modes/${id}`, data),
  deleteMode: (id: number) => api.delete(`/modes/${id}`),
  getPaiements: () => api.get<Paiement[]>('/paiements'),
  createPaiement: (data: Partial<Paiement>) => api.post<Paiement>('/paiements', data),
  createScolariteWithTranches: (data: {
    inscription: number;
    pension: number;
    nbreTranche: number;
    idCycle: number;
    tranches: { libelle: string; montant: number; date_limite: string }[];
  }) => api.post('/scolarites-with-tranches', data),
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
  search: (q: string) => api.get<Parent[]>('/parents/search', { params: { q } }),
}

export const studentAPI = {
  getAll: () => api.get<Student[]>('/students'),
  getById: (id: number) => api.get<Student>(`/students/${id}`),
  create: (data: Partial<Student>) => api.post<Student>('/students', data),
  update: (id: number, data: Partial<Student>) => api.put<Student>(`/students/${id}`, data),
  delete: (id: number) => api.delete(`/students/${id}`),
  toggleActive: (id: number) => api.patch<Student>(`/students/${id}/toggle-active`),
  batchToggleActive: (matricules: number[]) => api.patch<{ updated: number }>('/students/batch/toggle-active', { matricules }),
  batchChangeClass: (matricules: number[], idSalle: number) => api.patch<{ updated: number }>('/students/batch/class', { matricules, idSalle }),
  getGrades: (id: number) => api.get<Evaluation[]>(`/students/${id}/grades`),
  getPayments: (id: number) => api.get<Paiement[]>(`/students/${id}/payments`),
  enroll: (data: { matricule: number; idSalle?: number; idAcademi?: number; idScolarite?: number; parent?: { nom: string; prenom: string; email: string; password: string; mobile: string } }) => api.post('/students/enroll', data),
}

export const teacherAPI = {
  getAll: () => api.get<Teacher[]>('/teachers'),
  create: (data: Partial<Teacher>) => api.post<Teacher>('/teachers', data),
  update: (id: number, data: Partial<Teacher>) => api.put<Teacher>(`/teachers/${id}`, data),
  toggleActive: (id: number) => api.patch<Teacher>(`/teachers/${id}/toggle-active`),
  assignCourses: (id: number, courseIds: number[]) => api.patch<{ cours: Course[] }>(`/teachers/${id}/courses`, { courseIds }),
  assignClass: (id: number, idClasse: number | null) => api.patch(`/teachers/${id}/class`, { idClasse }),
}

export const searchAPI = {
  global: (q: string) => api.get<SearchResult>('/search', { params: { q } }),
}

export const auditAPI = {
  getLogs: (params?: { userId?: number; action?: string; entity?: string; page?: number; limit?: number }) =>
    api.get<{ data: AuditLog[]; total: number; page: number; limit: number }>('/audit-logs', { params }),
}

export const uploadAPI = {
  photo: (file: File) => {
    const fd = new FormData()
    fd.append('photo', file)
    return api.post<{ url: string }>('/upload/photo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default api
