const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${API_URL}/api/v1`;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends HTTP-only auth cookies
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errorMsg = data.error || (data.details ? data.details.map((d: any) => d.message).join(', ') : 'Request failed');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string }) =>
    request<{ success: boolean; data: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ success: boolean; data: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{ success: boolean; data: any }>('/auth/me'),

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

  // Preferences
  getPreferences: () =>
    request<{ success: boolean; data: any }>('/preferences'),

  updatePreferences: (payload: any) =>
    request<{ success: boolean; data: any }>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Recipes
  getRecipes: (params?: Record<string, string>) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; data: any[] }>(`/recipes${qs ? `?${qs}` : ''}`);
  },

  getRecipeById: (id: string) =>
    request<{ success: boolean; data: any }>(`/recipes/${id}`),

  getFavorites: () =>
    request<{ success: boolean; data: any[] }>('/recipes/favorites'),

  toggleFavorite: (id: string) =>
    request<{ success: boolean; isFavorited: boolean; favorites: string[] }>(`/recipes/${id}/favorite`, {
      method: 'POST',
    }),

  submitReaction: (id: string, type: 'up' | 'down') =>
    request<{ success: boolean; upvotes: number; downvotes: number }>(`/recipes/${id}/reaction`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),

  // Meal Plan
  getCurrentPlan: () =>
    request<{ success: boolean; data: any }>('/plan/current'),

  getPlanHistory: () =>
    request<{ success: boolean; data: any[] }>('/plan/history'),

  archivePlan: () =>
    request<{ success: boolean; data: any; message: string }>('/plan/archive', {
      method: 'POST',
    }),

  generatePlan: () =>
    request<{ success: boolean; data: any; message: string }>('/plan/generate', {
      method: 'POST',
    }),

  swapMeal: (payload: { day: string; targetRecipeId?: string }) =>
    request<{ success: boolean; data: any; message: string }>('/plan/swap-meal', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  addMealSlot: (payload: { day: string; mealType: string; recipeId: string; servings?: number }) =>
    request<{ success: boolean; data: any; message: string }>('/plan/meals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  removeMealSlot: (slotId: string) =>
    request<{ success: boolean; data: any; message: string }>(`/plan/meals/${slotId}`, {
      method: 'DELETE',
    }),

  editMealSlot: (slotId: string, updates: { servings?: number; isCooked?: boolean; recipeId?: string }) =>
    request<{ success: boolean; data: any; message: string }>(`/plan/meals/${slotId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  updateHouseholdSize: (householdSize: number) =>
    request<{ success: boolean; data: any; message: string }>('/plan/household-size', {
      method: 'PATCH',
      body: JSON.stringify({ householdSize }),
    }),

  toggleDinnerCooked: (day: string) =>
    request<{ success: boolean; data: any }>(`/plan/dinners/${day}/cooked`, {
      method: 'PATCH',
    }),

  // Shopping List
  getShoppingList: () =>
    request<{ success: boolean; data: any }>('/shopping-list'),

  toggleShoppingItem: (itemId: string) =>
    request<{ success: boolean; data: any }>(`/shopping-list/item/${itemId}`, {
      method: 'PATCH',
    }),

  resetShoppingList: () =>
    request<{ success: boolean; data: any }>('/shopping-list/reset', {
      method: 'POST',
    }),

  addCustomShoppingItem: (payload: {
    name: string;
    totalQuantity?: number;
    unit?: string;
    aisle?: string;
    estimatedCost?: number;
    icon?: string;
  }) =>
    request<{ success: boolean; data: any; message: string }>('/shopping-list/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  editShoppingItem: (
    itemId: string,
    updates: {
      name?: string;
      totalQuantity?: number;
      unit?: string;
      aisle?: string;
      estimatedCost?: number;
      isBought?: boolean;
      icon?: string;
    }
  ) =>
    request<{ success: boolean; data: any; message: string }>(`/shopping-list/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteShoppingItem: (itemId: string) =>
    request<{ success: boolean; data: any; message: string }>(`/shopping-list/items/${itemId}`, {
      method: 'DELETE',
    }),

  // Subscriptions
  getSubscriptionStatus: () =>
    request<{ success: boolean; data: any }>('/subscriptions/status'),

  getUsageStats: () =>
    request<{ success: boolean; data: any }>('/subscriptions/usage'),

  upgradeSubscription: (planId: 'mise_pro_monthly' | 'mise_pro_yearly') =>
    request<{ success: boolean; data: any; message: string }>('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),

  cancelSubscription: () =>
    request<{ success: boolean; data: any; message: string }>('/subscriptions/cancel', {
      method: 'POST',
    }),

  reactivateSubscription: () =>
    request<{ success: boolean; data: any; message: string }>('/subscriptions/reactivate', {
      method: 'POST',
    }),

  getInvoices: () =>
    request<{ success: boolean; count: number; data: any[] }>('/subscriptions/invoices'),

  mockUpgradeSubscription: () =>
    request<{ success: boolean; data: any; message: string }>('/subscriptions/mock-upgrade', {
      method: 'POST',
    }),

  // Pantry
  getPantryItems: (params?: { search?: string; category?: string; status?: string }) => {
    const qs = params ? new URLSearchParams(params as any).toString() : '';
    return request<{ success: boolean; count: number; data: any[] }>(`/pantry${qs ? `?${qs}` : ''}`);
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
    request<{ success: boolean; data: any; message: string }>('/pantry', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePantryItem: (
    id: string,
    updates: {
      name?: string;
      quantity?: number;
      unit?: string;
      category?: string;
      expiryDate?: string | null;
      icon?: string;
      notes?: string;
    }
  ) =>
    request<{ success: boolean; data: any; message: string }>(`/pantry/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deletePantryItem: (id: string) =>
    request<{ success: boolean; message: string }>(`/pantry/${id}`, {
      method: 'DELETE',
    }),

  consumePantryItem: (id: string, amount: number) =>
    request<{ success: boolean; data: any; message: string }>(`/pantry/${id}/consume`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  getPantryRecipeSuggestions: (params?: {
    maxMissing?: number;
    cuisine?: string;
    dietary?: string;
    limit?: number;
  }) => {
    const qs = params ? new URLSearchParams(params as any).toString() : '';
    return request<{ success: boolean; count: number; data: any[] }>(`/pantry/recipes${qs ? `?${qs}` : ''}`);
  },

  addMissingIngredientsToGrocery: (recipeId: string) =>
    request<{ success: boolean; data: { addedCount: number; shoppingList: any }; message: string }>(
      `/pantry/recipes/${recipeId}/add-missing-to-grocery`,
      { method: 'POST' }
    ),

  // Household
  getMyHousehold: () =>
    request<{ success: boolean; data: any }>('/household'),

  createHousehold: (name: string) =>
    request<{ success: boolean; data: any; message: string }>('/household', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  inviteHouseholdMember: (payload: { email: string; role?: 'admin' | 'member' }) =>
    request<{
      success: boolean;
      data: any;
      inviteLink: string;
      message: string;
    }>('/household/invitations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPendingHouseholdInvitations: () =>
    request<{ success: boolean; count: number; data: any[] }>('/household/invitations/pending'),

  acceptHouseholdInvitation: (token: string) =>
    request<{ success: boolean; data: any; message: string }>('/household/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  rejectHouseholdInvitation: (token: string) =>
    request<{ success: boolean; message: string }>('/household/invitations/reject', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  revokeHouseholdInvitation: (id: string) =>
    request<{ success: boolean; message: string }>(`/household/invitations/${id}`, {
      method: 'DELETE',
    }),

  removeHouseholdMember: (memberId: string) =>
    request<{ success: boolean; data: any; message: string }>(`/household/members/${memberId}`, {
      method: 'DELETE',
    }),

  leaveHousehold: () =>
    request<{ success: boolean; message: string }>('/household/leave', {
      method: 'POST',
    }),

  // Admin Portal
  getAdminMetrics: () =>
    request<{ success: boolean; data: any }>('/admin/metrics'),

  getAdminUsers: (params?: { search?: string; page?: number; limit?: number; tier?: string }) => {
    const qs = params ? new URLSearchParams(params as any).toString() : '';
    return request<{ success: boolean; data: any[]; pagination: any }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  getAdminUserDetails: (id: string) =>
    request<{ success: boolean; data: any }>(`/admin/users/${id}`),

  updateAdminUserTier: (id: string, tier: 'free' | 'pro') =>
    request<{ success: boolean; data: any; message: string }>(`/admin/users/${id}/tier`, {
      method: 'PATCH',
      body: JSON.stringify({ tier }),
    }),

  getAdminRecipes: (params?: { search?: string; page?: number; limit?: number }) => {
    const qs = params ? new URLSearchParams(params as any).toString() : '';
    return request<{ success: boolean; data: any[]; pagination: any }>(`/admin/recipes${qs ? `?${qs}` : ''}`);
  },

  createAdminRecipe: (recipeData: any) =>
    request<{ success: boolean; data: any; message: string }>('/admin/recipes', {
      method: 'POST',
      body: JSON.stringify(recipeData),
    }),

  updateAdminRecipe: (id: string, updates: any) =>
    request<{ success: boolean; data: any; message: string }>(`/admin/recipes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // AI Assistant
  generateLeftoverRecipe: (payload: {
    ingredients: string[];
    cuisine?: string;
    maxCookTimeMinutes?: number;
    equipment?: string;
    servings?: number;
    additionalNotes?: string;
  }) =>
    request<{ success: boolean; data: any; isAiGenerated: boolean; fallback: boolean; note?: string }>(
      '/ai/leftover-recipe',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  customizePlanWithIntent: (prompt: string) =>
    request<{ success: boolean; data: any; summary: string; isAiGenerated: boolean; fallback: boolean }>(
      '/ai/plan-intent',
      {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      }
    ),
};
