import { createContext, useState, useContext, useEffect } from 'react';
import API, { clearTokenCache } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      if (data.success) {
        clearTokenCache();
        setUser(data.data);
        return data.data;
      }
      throw new Error(data.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch {}
    clearTokenCache();
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    const { data } = await API.put('/auth/change-password', { currentPassword, newPassword });
    return data;
  };

  const updateProfile = async (profileData) => {
    const { data } = await API.put('/auth/profile', profileData);
    if (data.success) {
      setUser((prev) => ({ ...prev, ...data.data }));
    }
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
