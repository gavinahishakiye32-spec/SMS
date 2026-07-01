import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';
import {
  LayoutDashboard,
  GraduationCap,
  Presentation,
  Users,
  School,
  Ruler,
  BookOpen,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  FileText,
  BarChart3,
  Lightbulb,
  Settings,
  UserCog,
} from 'lucide-react';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#3B82F6', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/users', label: 'Users', icon: UserCog, color: '#EF4444', roles: ['superadmin'] },
  { to: '/admin/students', label: 'Students', icon: GraduationCap, color: '#10B981', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/teachers', label: 'Teachers', icon: Presentation, color: '#8B5CF6', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/parents', label: 'Parents', icon: Users, color: '#EC4899', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/classes', label: 'Classes', icon: School, color: '#F59E0B', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/sections', label: 'Sections', icon: Ruler, color: '#14B8A6', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/subjects', label: 'Subjects', icon: BookOpen, color: '#EF4444', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/academic-years', label: 'Academic Years', icon: CalendarDays, color: '#06B6D4', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/terms', label: 'Terms', icon: CalendarRange, color: '#6366F1', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/marks', label: 'Marks', icon: CheckSquare, color: '#84CC16', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/reports', label: 'Reports', icon: FileText, color: '#64748B', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, color: '#A855F7', roles: ['superadmin', 'schooladmin'] },
  { to: '/admin/suggestions', label: 'Suggestions', icon: Lightbulb, color: '#FBBF24', roles: ['superadmin', 'schooladmin', 'teacher'] },
  { to: '/admin/settings', label: 'Settings', icon: Settings, color: '#6B7280', roles: ['superadmin', 'schooladmin'] },
];

const teacherLinks = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#3B82F6' },
  { to: '/teacher/subjects', label: 'My Subjects', icon: BookOpen, color: '#EF4444' },
  { to: '/admin/students', label: 'Students', icon: GraduationCap, color: '#10B981' },
  { to: '/teacher/marks', label: 'Marks Entry', icon: CheckSquare, color: '#84CC16' },
  { to: '/admin/suggestions', label: 'Suggestions', icon: Lightbulb, color: '#FBBF24' },
];

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#3B82F6' },
  { to: '/student/report', label: 'Report Card', icon: FileText, color: '#64748B' },
  { to: '/student/performance', label: 'Performance', icon: BarChart3, color: '#A855F7' },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  let baseLinks;
  if (user?.role === 'superadmin' || user?.role === 'schooladmin') {
    baseLinks = adminLinks;
  } else if (user?.role === 'teacher') {
    baseLinks = teacherLinks;
  } else {
    baseLinks = studentLinks;
  }
  const links = baseLinks.filter((l) => !l.roles || l.roles.includes(user?.role));

  const { data: unreadData } = useQuery({
    queryKey: ['suggestions-unread'],
    queryFn: () => API.get('/suggestions/unread-count').then((r) => r.data),
    enabled: !!user && user.role !== 'student',
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const unreadCount = unreadData?.data?.count || 0;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-[#0F172A] border-r border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white transform transition-[transform,background-color] duration-200 ease-in-out lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
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
              <link.icon className="w-5 h-5 icon-color" style={{ '--icon-clr': link.color }} />
              <span>{link.label}</span>
              {link.label === 'Suggestions' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
