import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import Profile from './pages/auth/Profile';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import SchoolAdminDashboard from './pages/admin/SchoolAdminDashboard';
import StudentsPage from './pages/admin/StudentsPage';
import TeachersPage from './pages/admin/TeachersPage';
import ParentsPage from './pages/admin/ParentsPage';
import ClassesPage from './pages/admin/ClassesPage';
import SectionsPage from './pages/admin/SectionsPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import AcademicYearsPage from './pages/admin/AcademicYearsPage';
import TermsPage from './pages/admin/TermsPage';
import MarksPage from './pages/admin/MarksPage';
import ReportsPage from './pages/admin/ReportsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import SuggestionsPage from './pages/admin/SuggestionsPage';
import SchoolSettingsPage from './pages/admin/SchoolSettingsPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherMarks from './pages/teacher/TeacherMarks';
import TeacherSubjects from './pages/teacher/TeacherSubjects';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentReport from './pages/student/StudentReport';
import StudentPerformance from './pages/student/StudentPerformance';

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
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="/" element={<DashboardRedirect />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="/admin" element={<ProtectedRoute roles={['superadmin', 'schooladmin', 'teacher']}><MainLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><AdminDashboardSwitch /></ProtectedRoute>} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="teachers" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><TeachersPage /></ProtectedRoute>} />
        <Route path="parents" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><ParentsPage /></ProtectedRoute>} />
        <Route path="classes" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><ClassesPage /></ProtectedRoute>} />
        <Route path="sections" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><SectionsPage /></ProtectedRoute>} />
        <Route path="subjects" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><SubjectsPage /></ProtectedRoute>} />
        <Route path="academic-years" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><AcademicYearsPage /></ProtectedRoute>} />
        <Route path="terms" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><TermsPage /></ProtectedRoute>} />
        <Route path="marks" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><MarksPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><ReportsPage /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="suggestions" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><SuggestionsPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute roles={['superadmin', 'schooladmin']}><SchoolSettingsPage /></ProtectedRoute>} />
      </Route>
      <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><MainLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="marks" element={<TeacherMarks />} />
        <Route path="subjects" element={<TeacherSubjects />} />
      </Route>
      <Route path="/student" element={<ProtectedRoute roles={['student']}><MainLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="report" element={<StudentReport />} />
        <Route path="performance" element={<StudentPerformance />} />
      </Route>
    </Routes>
  );
}
