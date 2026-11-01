import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  guestUserId: string;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [guestUserId, setGuestUserId] = useState<string>('');

  useEffect(() => {
    let savedGuestId = localStorage.getItem('skillcheck_guest_id');
    if (!savedGuestId) {
      savedGuestId = 'guest_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('skillcheck_guest_id', savedGuestId);
    }
    setGuestUserId(savedGuestId);

    const savedToken = localStorage.getItem('skillcheck_token');
    const savedUser = localStorage.getItem('skillcheck_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('skillcheck_token', newToken);
    localStorage.setItem('skillcheck_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('skillcheck_token');
    localStorage.removeItem('skillcheck_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, guestUserId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
