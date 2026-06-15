import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/auth/Login';

const ChangePassword = lazy(() => import('./pages/auth/ChangePassword'));
const Profile = lazy(() => import('./pages/auth/Profile'));
const SuperAdminDashboard = lazy(() => import('./pages/admin/SuperAdminDashboard'));
const SchoolAdminDashboard = lazy(() => import('./pages/admin/SchoolAdminDashboard'));
const StudentsPage = lazy(() => import('./pages/admin/StudentsPage'));
const TeachersPage = lazy(() => import('./pages/admin/TeachersPage'));
const ParentsPage = lazy(() => import('./pages/admin/ParentsPage'));
const ClassesPage = lazy(() => import('./pages/admin/ClassesPage'));
const SectionsPage = lazy(() => import('./pages/admin/SectionsPage'));
const SubjectsPage = lazy(() => import('./pages/admin/SubjectsPage'));
const AcademicYearsPage = lazy(() => import('./pages/admin/AcademicYearsPage'));
const TermsPage = lazy(() => import('./pages/admin/TermsPage'));
const MarksPage = lazy(() => import('./pages/admin/MarksPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage'));
const SuggestionsPage = lazy(() => import('./pages/admin/SuggestionsPage'));
const SchoolSettingsPage = lazy(() => import('./pages/admin/SchoolSettingsPage'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherMarks = lazy(() => import('./pages/teacher/TeacherMarks'));
const TeacherSubjects = lazy(() => import('./pages/teacher/TeacherSubjects'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentReport = lazy(() => import('./pages/student/StudentReport'));
const StudentPerformance = lazy(() => import('./pages/student/StudentPerformance'));

const Lazy = ({ children }) => <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>{children}</Suspense>;

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

const AdminDashboardSwitch = () => {
  const { user } = useAuth();
  return user?.role === 'superadmin' ? <SuperAdminDashboard /> : <SchoolAdminDashboard />;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'superadmin') return <Navigate to="/admin/dashboard" />;
  if (user.role === 'schooladmin') return <Navigate to="/admin/dashboard" />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" />;
  return <Navigate to="/login" />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<ProtectedRoute><Lazy><Profile /></Lazy></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><Lazy><ChangePassword /></Lazy></ProtectedRoute>} />
      <Route path="/" element={<DashboardRedirect />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="/admin" element={<ProtectedRoute roles={['superadmin', 'schooladmin', 'teacher']}><MainLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><AdminDashboardSwitch /></Lazy></ProtectedRoute>} />
        <Route path="students" element={<Lazy><StudentsPage /></Lazy>} />
        <Route path="teachers" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><TeachersPage /></Lazy></ProtectedRoute>} />
        <Route path="parents" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><ParentsPage /></Lazy></ProtectedRoute>} />
        <Route path="classes" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><ClassesPage /></Lazy></ProtectedRoute>} />
        <Route path="sections" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><SectionsPage /></Lazy></ProtectedRoute>} />
        <Route path="subjects" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><SubjectsPage /></Lazy></ProtectedRoute>} />
        <Route path="academic-years" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><AcademicYearsPage /></Lazy></ProtectedRoute>} />
        <Route path="terms" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><TermsPage /></Lazy></ProtectedRoute>} />
        <Route path="marks" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><MarksPage /></Lazy></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><ReportsPage /></Lazy></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><AnalyticsPage /></Lazy></ProtectedRoute>} />
        <Route path="suggestions" element={<ProtectedRoute roles={['superadmin', 'schooladmin', 'teacher']}><Lazy><SuggestionsPage /></Lazy></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><Lazy><SchoolSettingsPage /></Lazy></ProtectedRoute>} />
      </Route>
      <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><MainLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Lazy><TeacherDashboard /></Lazy>} />
        <Route path="marks" element={<Lazy><TeacherMarks /></Lazy>} />
        <Route path="subjects" element={<Lazy><TeacherSubjects /></Lazy>} />
      </Route>
      <Route path="/student" element={<ProtectedRoute roles={['student']}><MainLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Lazy><StudentDashboard /></Lazy>} />
        <Route path="report" element={<Lazy><StudentReport /></Lazy>} />
        <Route path="performance" element={<Lazy><StudentPerformance /></Lazy>} />
      </Route>
    </Routes>
  );
}
