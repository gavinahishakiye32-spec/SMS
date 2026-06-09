import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const superAdminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/students', label: 'Students', icon: '👨‍🎓' },
  { to: '/admin/teachers', label: 'Teachers', icon: '👨‍🏫' },
  { to: '/admin/parents', label: 'Parents', icon: '👪' },
  { to: '/admin/classes', label: 'Classes', icon: '🏫' },
  { to: '/admin/sections', label: 'Sections', icon: '📐' },
  { to: '/admin/subjects', label: 'Subjects', icon: '📚' },
  { to: '/admin/academic-years', label: 'Academic Years', icon: '📅' },
  { to: '/admin/terms', label: 'Terms', icon: '🗓️' },
  { to: '/admin/marks', label: 'Marks', icon: '✅' },
  { to: '/admin/reports', label: 'Reports', icon: '📄' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { to: '/admin/suggestions', label: 'Suggestions', icon: '💡' },
];

const teacherLinks = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/teacher/subjects', label: 'My Subjects', icon: '📚' },
  { to: '/teacher/students', label: 'Students', icon: '👨‍🎓' },
  { to: '/teacher/marks', label: 'Marks Entry', icon: '✅' },
];

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/student/report', label: 'Report Card', icon: '📄' },
  { to: '/student/performance', label: 'Performance', icon: '📈' },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const links = user?.role === 'superadmin' || user?.role === 'schooladmin'
    ? superAdminLinks
    : user?.role === 'teacher'
    ? teacherLinks
    : studentLinks;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-[#0F172A] border-r border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white transform transition-[transform,background-color] duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-bold">SMS</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace('admin', ' Admin')}</p>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-64px)]">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
