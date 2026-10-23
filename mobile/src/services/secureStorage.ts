import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'mise_auth_token_secure';
const USER_KEY = 'mise_user_data_secure';

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
        return memoryStorage.get(AUTH_TOKEN_KEY) || null;
      }
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch {
      return memoryStorage.get(AUTH_TOKEN_KEY) || null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        memoryStorage.delete(AUTH_TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      }
    } catch {
      memoryStorage.delete(AUTH_TOKEN_KEY);
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
        serialized = memoryStorage.get(USER_KEY) || null;
      } else {
        serialized = await SecureStore.getItemAsync(USER_KEY);
      }
      return serialized ? JSON.parse(serialized) : null;
    } catch {
      const fallback = memoryStorage.get(USER_KEY);
      return fallback ? JSON.parse(fallback) : null;
    }
  },

  async clearAll(): Promise<void> {
    await this.removeToken();
    try {
      if (Platform.OS === 'web') {
        memoryStorage.delete(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch {
      memoryStorage.delete(USER_KEY);
    }
  },
};
