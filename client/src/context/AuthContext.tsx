import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'REQUESTER' | 'IT_STAFF' | 'ADMIN' | string;
  isActive: boolean;
  mustChangePassword: boolean;
  department?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('toktickit_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('toktickit_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Validate current token on startup if present
    const verifyUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('toktickit_user', JSON.stringify(data.user));
        } else {
          // Token expired or invalid
          setUser(null);
          setToken(null);
          localStorage.removeItem('toktickit_token');
          localStorage.removeItem('toktickit_user');
        }
      } catch (_err) {
        // Keep cached user on offline/network blip
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.message || data.error || 'Authentication failed' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('toktickit_token', data.token);
      localStorage.setItem('toktickit_user', JSON.stringify(data.user));
      // Also sync requester ID for backward compatibility
      localStorage.setItem('toktickit_requester_id', data.user.id.toString());

      return {
        success: true,
        mustChangePassword: data.user.mustChangePassword,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error. Please try again.' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_e) {
        // Continue clearing client credentials
      }
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('toktickit_token');
    localStorage.removeItem('toktickit_user');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.message || data.error || 'Failed to change password' };
      }

      if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        setUser(updatedUser);
        localStorage.setItem('toktickit_user', JSON.stringify(updatedUser));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to change password' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        mustChangePassword: !!user?.mustChangePassword,
        loading,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
