import React, { createContext, useContext, useState, useEffect } from 'react';

const accounts = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'user', password: 'user', role: 'student' },
];

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('codecoin_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('codecoin_user');
      }
    }
  }, []);

  const login = (username, password) => {
    const found = accounts.find(
      (a) => a.username === username && a.password === password
    );
    if (found) {
      const session = { username: found.username, role: found.role };
      setUser(session);
      localStorage.setItem('codecoin_user', JSON.stringify(session));
      return { success: true };
    }
    return { success: false, message: 'Неверный логин или пароль' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('codecoin_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
