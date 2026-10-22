const API_BASE = '/api/v1';

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

  generatePlan: () =>
    request<{ success: boolean; data: any; message: string }>('/plan/generate', {
      method: 'POST',
    }),

  swapMeal: (payload: { day: string; targetRecipeId?: string }) =>
    request<{ success: boolean; data: any; message: string }>('/plan/swap-meal', {
      method: 'PUT',
      body: JSON.stringify(payload),
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

  // Subscriptions
  getSubscriptionStatus: () =>
    request<{ success: boolean; data: any }>('/subscriptions/status'),

  mockUpgradeSubscription: () =>
    request<{ success: boolean; data: any; message: string }>('/subscriptions/mock-upgrade', {
      method: 'POST',
    }),
};
