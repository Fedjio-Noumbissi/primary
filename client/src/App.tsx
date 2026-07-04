import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import TeacherDashboard from './pages/dashboard/TeacherDashboard'
import ParentDashboard from './pages/dashboard/ParentDashboard'
import StudentList from './pages/students/StudentList'
import StudentForm from './pages/students/StudentForm'
import StudentProfile from './pages/students/StudentProfile'
import EnrollmentForm from './pages/students/EnrollmentForm'
import TeacherList from './pages/teachers/TeacherList'
import ClassList from './pages/classes/ClassList'
import AcademicPage from './pages/academic/AcademicPage'
import CoursesPage from './pages/courses/CoursesPage'
import ExamsPage from './pages/exams/ExamsPage'
import ReportPage from './pages/reports/ReportPage'
import PaymentsPage from './pages/payments/PaymentsPage'
import LibraryPage from './pages/library/LibraryPage'
import MessagePage from './pages/messages/MessagePage'
import DisciplinePage from './pages/discipline/DisciplinePage'
import SettingsPage from './pages/settings/SettingsPage'
import UserManagement from './pages/users/UserManagement'

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: number[] }) {
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={[1]}><AppLayout><Outlet /></AppLayout></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<StudentList />} />
        <Route path="students/new" element={<StudentForm />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="students/:id/edit" element={<StudentForm />} />
        <Route path="students/enroll" element={<EnrollmentForm />} />
        <Route path="teachers" element={<TeacherList />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="classes" element={<ClassList />} />
        <Route path="academic" element={<AcademicPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="reports" element={<ReportPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="messages" element={<MessagePage />} />
        <Route path="discipline" element={<DisciplinePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/teacher" element={<ProtectedRoute allowedRoles={[2]}><AppLayout><Outlet /></AppLayout></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="grades" element={<ExamsPage />} />
        <Route path="timetable" element={<CoursesPage />} />
        <Route path="messages" element={<MessagePage />} />
      </Route>

      <Route path="/parent" element={<ProtectedRoute allowedRoles={[3]}><AppLayout><Outlet /></AppLayout></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="grades" element={<ParentDashboard />} />
        <Route path="payments" element={<ParentDashboard />} />
        <Route path="messages" element={<MessagePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: '14px' } }} />
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
