// SentinelFusion AI - Authentication & Resilience Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getToken, setToken, removeToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBackendReachable: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  checkHealth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendReachable, setIsBackendReachable] = useState<boolean>(true);

  const checkHealth = async (): Promise<boolean> => {
    try {
      await api.health.checkLiveness();
      setIsBackendReachable(true);
      return true;
    } catch {
      setIsBackendReachable(false);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = getToken();
      if (savedToken) {
        try {
          const profile = await api.auth.getMe();
          setUser(profile);
          setIsBackendReachable(true);
        } catch (err: any) {
          if (err.status === 0) {
            setIsBackendReachable(false);
          } else {
            removeToken();
            setTokenState(null);
            setUser(null);
          }
        }
      } else {
        await checkHealth();
      }
      setIsLoading(false);
    };

    initAuth();

    // Periodic heartbeat to verify backend connectivity (every 30 seconds)
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ username_or_email: usernameOrEmail, password });
      setToken(res.access_token);
      setTokenState(res.access_token);
      const profile = await api.auth.getMe();
      setUser(profile);
      setIsBackendReachable(true);
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (getToken()) {
        await api.auth.logout();
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      removeToken();
      setTokenState(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isBackendReachable,
        login,
        logout,
        hasRole,
        checkHealth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
