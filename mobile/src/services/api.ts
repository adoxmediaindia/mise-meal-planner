import { API_V1_URL } from '../config/env';
import { secureStorage } from './secureStorage';
import { offlineSyncQueue } from './offlineSync';
import {
  IUser,
  IUserPreferences,
  IRecipe,
  IMealPlan,
  IShoppingList,
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await secureStorage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_V1_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      const errorMsg = data.error || (data.details ? data.details.map((d: any) => d.message).join(', ') : 'Request failed');
      throw new Error(errorMsg);
    }

    return data;
  } catch (err: any) {
    throw err;
  }
}

export const mobileApi = {
  // 1. Auth Endpoints
  register: (payload: { name: string; email: string; password: string }) =>
    request<ApiResponse<IUser & { token: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<ApiResponse<IUser & { token: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: async () => {
    try {
      await request<{ success: boolean }>('/auth/logout', { method: 'POST' });
    } finally {
      await secureStorage.clearAll();
      offlineSyncQueue.clear();
    }
  },

  getMe: () =>
    request<ApiResponse<IUser>>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // 2. Preferences Endpoints
  getPreferences: () =>
    request<ApiResponse<IUserPreferences>>('/preferences'),

  updatePreferences: (payload: Partial<IUserPreferences> & { autoRegenerate?: boolean }) =>
    request<ApiResponse<IUserPreferences>>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // 3. Recipes Endpoints
  getRecipes: (params?: Record<string, string>) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; data: IRecipe[] }>(`/recipes${qs ? `?${qs}` : ''}`);
  },

  getRecipeById: (id: string) =>
    request<ApiResponse<IRecipe>>(`/recipes/${id}`),

  toggleFavorite: (id: string) =>
    request<{ success: boolean; isFavorited: boolean; favorites: string[] }>(`/recipes/${id}/favorite`, {
      method: 'POST',
    }),

  submitReaction: (id: string, type: 'up' | 'down') =>
    request<{ success: boolean; upvotes: number; downvotes: number }>(`/recipes/${id}/reaction`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),

  // 4. Meal Plan Endpoints
  getCurrentPlan: () =>
    request<ApiResponse<IMealPlan>>('/plan/current'),

  generatePlan: () =>
    request<ApiResponse<IMealPlan>>('/plan/generate', {
      method: 'POST',
    }),

  swapMeal: (payload: { day: string; targetRecipeId?: string }) =>
    request<ApiResponse<IMealPlan>>('/plan/swap-meal', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  toggleDinnerCooked: (day: string) =>
    request<ApiResponse<IMealPlan>>(`/plan/dinners/${day}/cooked`, {
      method: 'PATCH',
    }),

  // 5. Shopping List Endpoints
  getShoppingList: () =>
    request<ApiResponse<IShoppingList>>('/shopping-list'),

  toggleShoppingItem: async (itemId: string): Promise<ApiResponse<IShoppingList>> => {
    try {
      return await request<ApiResponse<IShoppingList>>(`/shopping-list/item/${itemId}`, {
        method: 'PATCH',
      });
    } catch (err) {
      // If network fails, queue for offline sync
      offlineSyncQueue.queueItemToggle(itemId);
      throw err;
    }
  },

  resetShoppingList: () =>
    request<ApiResponse<IShoppingList>>('/shopping-list/reset', {
      method: 'POST',
    }),

  // Process any pending offline toggle actions
  flushOfflineCheckoffs: async () => {
    return await offlineSyncQueue.flush(async (mutation) => {
      try {
        await request(`/shopping-list/item/${mutation.itemId}`, {
          method: 'PATCH',
        });
        return true;
      } catch {
        return false;
      }
    });
  },

  // 6. Subscriptions Endpoints
  getSubscriptionStatus: () =>
    request<ApiResponse<any>>('/subscriptions/status'),

  mockUpgradeSubscription: () =>
    request<ApiResponse<any>>('/subscriptions/mock-upgrade', {
      method: 'POST',
    }),
};
