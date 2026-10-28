import { API_V1_URL } from '../config/env';
import { secureStorage } from './secureStorage';
import { offlineSyncQueue } from './offlineSync';
import {
  IUser,
  IUserPreferences,
  IRecipe,
  IMealPlan,
  IShoppingList,
  IPantryItem,
  IHousehold,
  IHouseholdInvitation,
  IPantryRecipeMatch,
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export function toQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'null') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
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
    const qs = toQueryString(params);
    return request<{ success: boolean; count: number; data: IRecipe[] }>(`/recipes${qs}`);
  },

  getRecipeById: (id: string) =>
    request<ApiResponse<IRecipe>>(`/recipes/${id}`),

  getFavorites: () =>
    request<{ success: boolean; data: IRecipe[] }>('/recipes/favorites'),

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

  getPlanHistory: () =>
    request<ApiResponse<IMealPlan[]>>('/plan/history'),

  archivePlan: () =>
    request<ApiResponse<IMealPlan>>('/plan/archive', {
      method: 'POST',
    }),

  generatePlan: () =>
    request<ApiResponse<IMealPlan>>('/plan/generate', {
      method: 'POST',
    }),

  swapMeal: (payload: { day: string; targetRecipeId?: string }) =>
    request<ApiResponse<IMealPlan>>('/plan/swap-meal', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  addMealSlot: (payload: { day: string; mealType: string; recipeId: string; servings?: number }) =>
    request<ApiResponse<IMealPlan>>('/plan/meals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  removeMealSlot: (slotId: string) =>
    request<ApiResponse<IMealPlan>>(`/plan/meals/${slotId}`, {
      method: 'DELETE',
    }),

  editMealSlot: (slotId: string, updates: any) =>
    request<ApiResponse<IMealPlan>>(`/plan/meals/${slotId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  updateHouseholdSize: (householdSize: number) =>
    request<ApiResponse<IMealPlan>>('/plan/household-size', {
      method: 'PATCH',
      body: JSON.stringify({ householdSize }),
    }),

  toggleDinnerCooked: (day: string) =>
    request<ApiResponse<IMealPlan>>(`/plan/dinners/${day}/cooked`, {
      method: 'PATCH',
    }),

  // 5. Shopping List Endpoints
  getShoppingList: () =>
    request<ApiResponse<IShoppingList>>('/shopping-list'),

  addCustomShoppingItem: (payload: {
    name: string;
    totalQuantity?: number;
    unit?: string;
    aisle?: string;
    estimatedCost?: number;
    icon?: string;
  }) =>
    request<ApiResponse<IShoppingList>>('/shopping-list/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  editShoppingItem: (itemId: string, updates: any) =>
    request<ApiResponse<IShoppingList>>(`/shopping-list/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteShoppingItem: (itemId: string) =>
    request<ApiResponse<IShoppingList>>(`/shopping-list/items/${itemId}`, {
      method: 'DELETE',
    }),

  toggleShoppingItem: async (itemId: string, targetState?: boolean): Promise<ApiResponse<IShoppingList>> => {
    try {
      return await request<ApiResponse<IShoppingList>>(`/shopping-list/item/${itemId}`, {
        method: 'PATCH',
        body: targetState !== undefined ? JSON.stringify({ isBought: targetState }) : undefined,
      });
    } catch (err) {
      // If network fails, queue for offline sync with intended target state
      offlineSyncQueue.queueItemToggle(itemId, targetState);
      throw err;
    }
  },

  resetShoppingList: () =>
    request<ApiResponse<IShoppingList>>('/shopping-list/reset', {
      method: 'POST',
    }),

  // Process any pending offline toggle actions with idempotent target state
  flushOfflineCheckoffs: async () => {
    return await offlineSyncQueue.flush(async (mutation) => {
      try {
        await request(`/shopping-list/item/${mutation.itemId}`, {
          method: 'PATCH',
          body: mutation.targetState !== undefined ? JSON.stringify({ isBought: mutation.targetState }) : undefined,
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

  getUsageStats: () =>
    request<ApiResponse<any>>('/subscriptions/usage'),

  upgradeSubscription: (planId: 'mise_pro_monthly' | 'mise_pro_yearly') =>
    request<ApiResponse<any>>('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),

  cancelSubscription: () =>
    request<ApiResponse<any>>('/subscriptions/cancel', {
      method: 'POST',
    }),

  reactivateSubscription: () =>
    request<ApiResponse<any>>('/subscriptions/reactivate', {
      method: 'POST',
    }),

  getInvoices: () =>
    request<ApiResponse<any[]>>('/subscriptions/invoices'),

  mockUpgradeSubscription: () =>
    request<ApiResponse<any>>('/subscriptions/mock-upgrade', {
      method: 'POST',
    }),

  // 7. Pantry Endpoints
  getPantryItems: (params?: { search?: string; category?: string; status?: string }) => {
    const qs = toQueryString(params);
    return request<ApiResponse<IPantryItem[]>>(`/pantry${qs}`);
  },

  addPantryItem: (payload: {
    name: string;
    quantity: number;
    unit?: string;
    category?: string;
    expiryDate?: string | null;
    icon?: string;
    notes?: string;
  }) =>
    request<ApiResponse<IPantryItem>>('/pantry', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePantryItem: (id: string, updates: any) =>
    request<ApiResponse<IPantryItem>>(`/pantry/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deletePantryItem: (id: string) =>
    request<ApiResponse<void>>(`/pantry/${id}`, {
      method: 'DELETE',
    }),

  consumePantryItem: (id: string, amount: number) =>
    request<ApiResponse<any>>(`/pantry/${id}/consume`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  getPantryRecipeSuggestions: (params?: {
    maxMissing?: number;
    cuisine?: string;
    dietary?: string;
    limit?: number;
  }) => {
    const qs = toQueryString(params);
    return request<ApiResponse<IPantryRecipeMatch[]>>(`/pantry/recipes${qs}`);
  },

  addMissingIngredientsToGrocery: (recipeId: string) =>
    request<ApiResponse<{ addedCount: number; shoppingList: IShoppingList }>>(
      `/pantry/recipes/${recipeId}/add-missing-to-grocery`,
      { method: 'POST' }
    ),

  // 8. Household Endpoints
  getMyHousehold: () =>
    request<ApiResponse<IHousehold>>('/household'),

  createHousehold: (name: string) =>
    request<ApiResponse<IHousehold>>('/household', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  inviteHouseholdMember: (payload: { email: string; role?: 'admin' | 'member' }) =>
    request<ApiResponse<IHouseholdInvitation> & { inviteLink: string }>('/household/invitations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPendingHouseholdInvitations: () =>
    request<ApiResponse<IHouseholdInvitation[]>>('/household/invitations/pending'),

  acceptHouseholdInvitation: (token: string) =>
    request<ApiResponse<IHousehold>>('/household/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  rejectHouseholdInvitation: (token: string) =>
    request<ApiResponse<void>>('/household/invitations/reject', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  revokeHouseholdInvitation: (id: string) =>
    request<ApiResponse<void>>(`/household/invitations/${id}`, {
      method: 'DELETE',
    }),

  removeHouseholdMember: (memberId: string) =>
    request<ApiResponse<IHousehold>>(`/household/members/${memberId}`, {
      method: 'DELETE',
    }),

  leaveHousehold: () =>
    request<ApiResponse<void>>('/household/leave', {
      method: 'POST',
    }),
};
