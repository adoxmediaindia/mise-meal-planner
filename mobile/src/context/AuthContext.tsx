import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IUser } from '../types';
import { mobileApi } from '../services/api';
import { secureStorage } from '../services/secureStorage';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from hardware secure store on launch
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await secureStorage.getToken();
        if (storedToken) {
          setToken(storedToken);
          const meRes = await mobileApi.getMe();
          if (meRes.success && meRes.data) {
            setUser(meRes.data);
            await secureStorage.setUserData(meRes.data);
          }
        }
      } catch (err) {
        console.warn('[Mobile Auth] Session restoration failed:', err);
        await secureStorage.clearAll();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.login({ email, password });
      if (res.success && res.data) {
        const { token: receivedToken, ...userData } = res.data;
        setToken(receivedToken);
        setUser(userData);
        await secureStorage.setToken(receivedToken);
        await secureStorage.setUserData(userData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.register({ name, email, password });
      if (res.success && res.data) {
        const { token: receivedToken, ...userData } = res.data;
        setToken(receivedToken);
        setUser(userData);
        await secureStorage.setToken(receivedToken);
        await secureStorage.setUserData(userData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    return await mobileApi.forgotPassword(email);
  };

  const resetPassword = async (resetToken: string, newPassword: string) => {
    return await mobileApi.resetPassword({ token: resetToken, newPassword });
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await mobileApi.logout();
    } finally {
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await mobileApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        await secureStorage.setUserData(res.data);
      }
    } catch (err) {
      console.warn('[Mobile Auth] User refresh failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        refreshUser,
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
