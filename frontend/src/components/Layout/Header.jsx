import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <button className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onMenuClick}>
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300" title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {user?.name}
        </span>
        <button
          onClick={() => navigate('/profile')}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Account
        </button>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
