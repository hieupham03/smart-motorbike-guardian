import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('currentUser', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session expired:', err);
          logout();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.data) {
      const { accessToken, refreshToken, user: userData } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    if (res.success && res.data) {
      const { accessToken, refreshToken, user: userData } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
  };

  const quickLogin = async (role) => {
    const accounts = {
      admin: { email: 'admin@guardian.iot', pass: 'Password@123' },
      owner: { email: 'owner@guardian.iot', pass: 'Password@123' },
      viewer: { email: 'viewer@guardian.iot', pass: 'Password@123' }
    };
    const target = accounts[role.toLowerCase()] || accounts.owner;
    return await login(target.email, target.pass);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role, isAuthenticated: !!user, loading, login, register, quickLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
