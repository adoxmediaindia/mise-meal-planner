import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavoriteInState: (recipeId: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.data) {
        setUser({
          id: res.data._id || res.data.id,
          name: res.data.name,
          email: res.data.email,
          subscriptionTier: res.data.subscriptionTier,
          subscriptionStatus: res.data.subscriptionStatus,
          favorites: res.data.favorites?.map((f: any) => (typeof f === 'string' ? f : f._id)) || [],
        });
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.data) {
      setUser({
        id: res.data.id || res.data._id,
        name: res.data.name,
        email: res.data.email,
        subscriptionTier: res.data.subscriptionTier,
        subscriptionStatus: res.data.subscriptionStatus,
        favorites: res.data.favorites || [],
      });
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register({ name, email, password });
    if (res.data) {
      setUser({
        id: res.data.id || res.data._id,
        name: res.data.name,
        email: res.data.email,
        subscriptionTier: res.data.subscriptionTier,
        subscriptionStatus: res.data.subscriptionStatus,
        favorites: [],
      });
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const toggleFavoriteInState = (recipeId: string) => {
    if (!user) return;
    const currentFavs = user.favorites || [];
    const exists = currentFavs.includes(recipeId);
    const updated = exists ? currentFavs.filter((id) => id !== recipeId) : [...currentFavs, recipeId];
    setUser({ ...user, favorites: updated });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        toggleFavoriteInState,
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
