import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IUser, IOnboardingData } from '../types';
import { mobileApi } from '../services/api';
import { secureStorage } from '../services/secureStorage';
import { demoUser } from '../demo/demoData';
import { isLocalDemoMode } from '../demo/demoMode';

const ONBOARDING_FINALIZATION_TIMEOUT_MS = 45_000;

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
  toggleFavoriteInState: (recipeId: string) => void;
  toggleFavorite: (recipeId: string) => Promise<boolean>;
  updateOnboarding: (data: Partial<IOnboardingData>) => Promise<void>;
  retryOnboardingCompletion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  async function preservePendingGuestOnboarding(baseUser: IUser): Promise<IUser> {
    const guestData = await secureStorage.getGuestOnboarding();
    if (!guestData || guestData.onboardingStep !== 25 || baseUser.onboardingCompleted) {
      return baseUser;
    }
    return {
      ...baseUser,
      ...guestData,
      onboardingStep: 25,
      onboardingCompleted: false,
    };
  }

  async function syncGuestOnboarding(): Promise<IUser | null> {
    try {
      const guestData = await secureStorage.getGuestOnboarding();
      if (!guestData) return null;

      const payload: Partial<IOnboardingData> = {};
      for (const [key, val] of Object.entries(guestData)) {
        if (val !== null && val !== undefined && val !== '') {
          (payload as any)[key] = val;
        }
      }
      if (Object.keys(payload).length === 0) {
        await secureStorage.clearGuestOnboarding();
        await secureStorage.clearOnboardingProgress();
        return null;
      }

      if (guestData.onboardingStep === 25) {
        payload.onboardingCompleted = true;
      }

      const res = await mobileApi.updateOnboarding(
        payload,
        guestData.onboardingStep === 25
          ? { timeoutMs: ONBOARDING_FINALIZATION_TIMEOUT_MS }
          : undefined
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Could not save your onboarding answers.');
      }

      await secureStorage.clearGuestOnboarding();
      await secureStorage.clearOnboardingProgress();
      return res.data;
    } catch (error) {
      console.warn('[Mobile Auth] Failed to sync guest onboarding (persisting for retry):', error);
      throw error;
    }
  }

  // Restore session from hardware secure store on launch
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isLocalDemoMode()) {
          setToken('local-demo-session');
          setUser(demoUser);
          return;
        }

        const storedToken = await secureStorage.getToken();
        if (storedToken) {
          const meRes = await mobileApi.getMe();
          if (meRes.success && meRes.data) {
            let syncedUser: IUser | null = null;
            try {
              syncedUser = await syncGuestOnboarding();
            } catch (error) {
              console.warn('[Mobile Auth] Keeping session active for onboarding retry:', error);
            }
            const restoredUser = syncedUser || await preservePendingGuestOnboarding(meRes.data);
            setUser(restoredUser);
            setToken(storedToken);
            await secureStorage.setUserData(restoredUser);
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
        await secureStorage.setToken(receivedToken);
        let authenticatedUser: IUser;
        try {
          const syncedUser = await syncGuestOnboarding();
          authenticatedUser = syncedUser || userData;
        } catch (error) {
          console.warn('[Mobile Auth] Keeping new session active for onboarding retry:', error);
          authenticatedUser = await preservePendingGuestOnboarding(userData);
        }
        await secureStorage.setUserData(authenticatedUser);
        setUser(authenticatedUser);
        setToken(receivedToken);
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
        await secureStorage.setToken(receivedToken);
        let authenticatedUser: IUser;
        try {
          const syncedUser = await syncGuestOnboarding();
          authenticatedUser = syncedUser || userData;
        } catch (error) {
          console.warn('[Mobile Auth] Keeping new session active for onboarding retry:', error);
          authenticatedUser = await preservePendingGuestOnboarding(userData);
        }
        await secureStorage.setUserData(authenticatedUser);
        setUser(authenticatedUser);
        setToken(receivedToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateOnboarding = async (data: Partial<IOnboardingData>) => {
    if (isLocalDemoMode()) {
      setUser((current) => current ? { ...current, ...data } : current);
      return;
    }

    if (user && token) {
      const res = await mobileApi.updateOnboarding(data);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Could not save your onboarding answers.');
      }
      const updated = { ...user, ...res.data };
      setUser(updated);
      await secureStorage.setUserData(updated);
    } else {
      const existing = (await secureStorage.getGuestOnboarding()) || {};
      const updated = { ...existing, ...data };
      await secureStorage.setGuestOnboarding(updated);
    }
  };

  const retryOnboardingCompletion = async () => {
    if (isLocalDemoMode()) return;
    if (!user || !token) throw new Error('Sign in to finish setting up your meal plan.');

    const syncedUser = await syncGuestOnboarding();
    let updatedUser = syncedUser;
    if (!updatedUser && user.onboardingStep === 25 && !user.onboardingCompleted) {
      const res = await mobileApi.updateOnboarding(
        { onboardingStep: 25, onboardingCompleted: true },
        { timeoutMs: ONBOARDING_FINALIZATION_TIMEOUT_MS }
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Your first meal plan could not be prepared. Please retry.');
      }
      updatedUser = res.data;
    }

    if (!updatedUser?.onboardingCompleted) {
      throw new Error('Your onboarding answers are saved, but your first meal plan is still pending.');
    }
    setUser(updatedUser);
    await secureStorage.setUserData(updatedUser);
  };

  const forgotPassword = async (email: string) => {
    return await mobileApi.forgotPassword(email);
  };

  const resetPassword = async (resetToken: string, newPassword: string) => {
    return await mobileApi.resetPassword({ token: resetToken, newPassword });
  };

  const logout = async () => {
    if (isLocalDemoMode()) {
      setToken('local-demo-session');
      setUser(demoUser);
      return;
    }

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
    if (isLocalDemoMode()) {
      setUser(demoUser);
      return;
    }

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

  const toggleFavoriteInState = (recipeId: string) => {
    if (!user) return;
    const currentFavs = user.favorites || [];
    const exists = currentFavs.includes(recipeId);
    const updatedFavs = exists
      ? currentFavs.filter((id) => id !== recipeId)
      : [...currentFavs, recipeId];

    const updatedUser = { ...user, favorites: updatedFavs };
    setUser(updatedUser);
    if (!isLocalDemoMode()) {
      secureStorage.setUserData(updatedUser).catch(() => {});
    }
  };

  const toggleFavorite = async (recipeId: string): Promise<boolean> => {
    if (isLocalDemoMode()) {
      const isFavorited = !user?.favorites?.includes(recipeId);
      toggleFavoriteInState(recipeId);
      return isFavorited;
    }

    toggleFavoriteInState(recipeId);
    try {
      const res = await mobileApi.toggleFavorite(recipeId);
      if (res.success && res.favorites && user) {
        const updatedUser = { ...user, favorites: res.favorites };
        setUser(updatedUser);
        await secureStorage.setUserData(updatedUser);
        return res.isFavorited;
      }
      return !user?.favorites?.includes(recipeId);
    } catch (err) {
      console.warn('[Mobile Auth] toggleFavorite API failed, reverting:', err);
      toggleFavoriteInState(recipeId);
      throw err;
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
        toggleFavoriteInState,
        toggleFavorite,
        updateOnboarding,
        retryOnboardingCompletion,
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
