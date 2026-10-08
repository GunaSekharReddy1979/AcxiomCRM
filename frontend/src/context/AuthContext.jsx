import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('crm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('crm_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
          localStorage.setItem('crm_user', JSON.stringify(res.data.data));
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('crm_token', newToken);
    localStorage.setItem('crm_user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    try {
      if (token) await api.post('/auth/logout');
    } catch (err) {
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
    }
  };

  const hasRole = (...allowedRoles) => {
    if (!user || !user.roleName) return false;
    return allowedRoles.includes(user.roleName);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
