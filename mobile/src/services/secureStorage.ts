import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'meltto_auth_token_secure';
const LEGACY_AUTH_TOKEN_KEY = 'mise_auth_token_secure';
const USER_KEY = 'meltto_user_data_secure';
const LEGACY_USER_KEY = 'mise_user_data_secure';
const OFFLINE_QUEUE_KEY = 'meltto_offline_queue';
const LEGACY_OFFLINE_QUEUE_KEY = 'mise_offline_queue';
const ONBOARDING_GUEST_KEY = 'meltto_guest_onboarding';
const ONBOARDING_PROGRESS_KEY = 'meltto_onboarding_progress_v2';

// Fallback in-memory map for testing or web preview
const memoryStorage = new Map<string, string>();

export const secureStorage = {
  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        memoryStorage.set(AUTH_TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      }
    } catch {
      memoryStorage.set(AUTH_TOKEN_KEY, token);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return memoryStorage.get(AUTH_TOKEN_KEY) || memoryStorage.get(LEGACY_AUTH_TOKEN_KEY) || null;
      }
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) return token;
      return await SecureStore.getItemAsync(LEGACY_AUTH_TOKEN_KEY);
    } catch {
      return memoryStorage.get(AUTH_TOKEN_KEY) || memoryStorage.get(LEGACY_AUTH_TOKEN_KEY) || null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        memoryStorage.delete(AUTH_TOKEN_KEY);
        memoryStorage.delete(LEGACY_AUTH_TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        try { await SecureStore.deleteItemAsync(LEGACY_AUTH_TOKEN_KEY); } catch {}
      }
    } catch {
      memoryStorage.delete(AUTH_TOKEN_KEY);
      memoryStorage.delete(LEGACY_AUTH_TOKEN_KEY);
    }
  },

  async setUserData(userData: any): Promise<void> {
    try {
      const serialized = JSON.stringify(userData);
      if (Platform.OS === 'web') {
        memoryStorage.set(USER_KEY, serialized);
      } else {
        await SecureStore.setItemAsync(USER_KEY, serialized);
      }
    } catch {
      memoryStorage.set(USER_KEY, JSON.stringify(userData));
    }
  },

  async getUserData(): Promise<any | null> {
    try {
      let serialized: string | null = null;
      if (Platform.OS === 'web') {
        serialized = memoryStorage.get(USER_KEY) || memoryStorage.get(LEGACY_USER_KEY) || null;
      } else {
        serialized = (await SecureStore.getItemAsync(USER_KEY)) || (await SecureStore.getItemAsync(LEGACY_USER_KEY));
      }
      return serialized ? JSON.parse(serialized) : null;
    } catch {
      const fallback = memoryStorage.get(USER_KEY) || memoryStorage.get(LEGACY_USER_KEY);
      return fallback ? JSON.parse(fallback) : null;
    }
  },

  async getQueue(): Promise<any[]> {
    try {
      const raw =
        Platform.OS === 'web'
          ? memoryStorage.get(OFFLINE_QUEUE_KEY) || memoryStorage.get(LEGACY_OFFLINE_QUEUE_KEY)
          : (await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY)) || (await SecureStore.getItemAsync(LEGACY_OFFLINE_QUEUE_KEY));
      return raw ? JSON.parse(raw) : [];
    } catch {
      const raw = memoryStorage.get(OFFLINE_QUEUE_KEY) || memoryStorage.get(LEGACY_OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
  },

  async setQueue(queue: any[]): Promise<void> {
    try {
      const serialized = JSON.stringify(queue);
      if (Platform.OS === 'web') {
        memoryStorage.set(OFFLINE_QUEUE_KEY, serialized);
      } else {
        await SecureStore.setItemAsync(OFFLINE_QUEUE_KEY, serialized);
      }
    } catch {
      memoryStorage.set(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    }
  },

  async setGuestOnboarding(data: any): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      if (Platform.OS === 'web') {
        memoryStorage.set(ONBOARDING_GUEST_KEY, serialized);
      } else {
        await SecureStore.setItemAsync(ONBOARDING_GUEST_KEY, serialized);
      }
    } catch {
      memoryStorage.set(ONBOARDING_GUEST_KEY, JSON.stringify(data));
    }
  },

  async getGuestOnboarding(): Promise<any | null> {
    try {
      const raw =
        Platform.OS === 'web'
          ? memoryStorage.get(ONBOARDING_GUEST_KEY)
          : await SecureStore.getItemAsync(ONBOARDING_GUEST_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      const raw = memoryStorage.get(ONBOARDING_GUEST_KEY);
      return raw ? JSON.parse(raw) : null;
    }
  },

  async clearGuestOnboarding(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        memoryStorage.delete(ONBOARDING_GUEST_KEY);
      } else {
        await SecureStore.deleteItemAsync(ONBOARDING_GUEST_KEY);
      }
    } catch {
      memoryStorage.delete(ONBOARDING_GUEST_KEY);
    }
  },

  async setOnboardingProgress(step: number): Promise<void> {
    const value = String(step);
    try {
      if (Platform.OS === 'web') {
        memoryStorage.set(ONBOARDING_PROGRESS_KEY, value);
      } else {
        await SecureStore.setItemAsync(ONBOARDING_PROGRESS_KEY, value);
      }
    } catch {
      memoryStorage.set(ONBOARDING_PROGRESS_KEY, value);
    }
  },

  async getOnboardingProgress(): Promise<number | null> {
    try {
      const value =
        Platform.OS === 'web'
          ? memoryStorage.get(ONBOARDING_PROGRESS_KEY)
          : await SecureStore.getItemAsync(ONBOARDING_PROGRESS_KEY);
      const step = value ? Number(value) : NaN;
      return Number.isInteger(step) && step >= 0 ? step : null;
    } catch {
      const value = memoryStorage.get(ONBOARDING_PROGRESS_KEY);
      const step = value ? Number(value) : NaN;
      return Number.isInteger(step) && step >= 0 ? step : null;
    }
  },

  async clearOnboardingProgress(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        memoryStorage.delete(ONBOARDING_PROGRESS_KEY);
      } else {
        await SecureStore.deleteItemAsync(ONBOARDING_PROGRESS_KEY);
      }
    } catch {
      memoryStorage.delete(ONBOARDING_PROGRESS_KEY);
    }
  },

  async clearAll(): Promise<void> {
    await this.removeToken();
    try {
      if (Platform.OS === 'web') {
        memoryStorage.delete(USER_KEY);
        memoryStorage.delete(LEGACY_USER_KEY);
        memoryStorage.delete(OFFLINE_QUEUE_KEY);
        memoryStorage.delete(LEGACY_OFFLINE_QUEUE_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
        try { await SecureStore.deleteItemAsync(LEGACY_USER_KEY); } catch {}
        await SecureStore.deleteItemAsync(OFFLINE_QUEUE_KEY);
        try { await SecureStore.deleteItemAsync(LEGACY_OFFLINE_QUEUE_KEY); } catch {}
      }
    } catch {
      memoryStorage.delete(USER_KEY);
      memoryStorage.delete(LEGACY_USER_KEY);
      memoryStorage.delete(OFFLINE_QUEUE_KEY);
      memoryStorage.delete(LEGACY_OFFLINE_QUEUE_KEY);
    }
  },
};
