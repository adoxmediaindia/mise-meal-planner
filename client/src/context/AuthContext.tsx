import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types/index.js';
import { api, setStoredToken } from '../services/api.js';

interface AuthContextType {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavoriteInState: (recipeId: string) => void;
  refreshUser: () => Promise<void>;
  updateOnboarding?: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncGuestOnboarding = async () => {
    try {
      const guestRaw = localStorage.getItem('meltto_onboarding_guest');
      if (guestRaw) {
        const guestData = JSON.parse(guestRaw);
        // Ensure empty/null/undefined guest fields do NOT overwrite existing user data
        const payload: Record<string, any> = {};
        for (const [key, val] of Object.entries(guestData)) {
          if (val !== null && val !== undefined && val !== '') {
            payload[key] = val;
          }
        }
        if (Object.keys(payload).length > 0) {
          const res = await api.updateOnboarding(payload);
          // Only clear guest data AFTER successful server sync
          if (res && (res.success || res.data)) {
            localStorage.removeItem('meltto_onboarding_guest');
          }
        } else {
          localStorage.removeItem('meltto_onboarding_guest');
        }
      }
    } catch (e) {
      console.warn('Failed to sync guest onboarding (persisting for retry):', e);
      // Retain guest data in localStorage so sync can be retried
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.data) {
        setUser({
          ...res.data,
          id: res.data._id || res.data.id,
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
      if (res.data.token) {
        setStoredToken(res.data.token);
      }
      setUser({
        ...res.data,
        id: res.data.id || res.data._id,
        favorites: res.data.favorites || [],
      });
      await syncGuestOnboarding();
      await refreshUser();
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register({ name, email, password });
    if (res.data) {
      if (res.data.token) {
        setStoredToken(res.data.token);
      }
      setUser({
        ...res.data,
        id: res.data.id || res.data._id,
        favorites: [],
      });
      await syncGuestOnboarding();
      await refreshUser();
    }
  };

  const updateOnboarding = async (data: any) => {
    if (user) {
      const res = await api.updateOnboarding(data);
      if (res.data) {
        setUser((prev) => (prev ? { ...prev, ...res.data } : null));
      }
    } else {
      const existing = localStorage.getItem('meltto_onboarding_guest');
      const parsed = existing ? JSON.parse(existing) : {};
      const updated = { ...parsed, ...data };
      localStorage.setItem('meltto_onboarding_guest', JSON.stringify(updated));
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setStoredToken(null);
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
        updateOnboarding,
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
