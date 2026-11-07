import {
  demoHousehold,
  demoMealPlan,
  demoPantryItems,
  demoPantrySuggestions,
  demoPreferences,
  demoRecipes,
  demoShoppingList,
  demoUser,
} from './demoData';

const ok = <T>(data: T) => ({ success: true, data });

export function getLocalDemoResponse<T>(endpoint: string, method = 'GET'): T {
  const [path, query = ''] = endpoint.split('?', 2);
  const params = new URLSearchParams(query);
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod === 'GET') {
    if (path === '/auth/me') return ok(demoUser) as T;
    if (path === '/preferences') return ok(demoPreferences) as T;
    if (path === '/plan/current') return ok(demoMealPlan) as T;
    if (path === '/plan/history') return ok([demoMealPlan]) as T;
    if (path === '/shopping-list') return ok(demoShoppingList) as T;

    if (path === '/recipes/favorites') {
      const favorites = demoRecipes.filter((recipe) => demoUser.favorites?.includes(recipe._id));
      return { success: true, data: favorites } as T;
    }

    if (path === '/recipes' || path.startsWith('/recipes/')) {
      const search = params.get('search')?.toLowerCase();
      const cuisine = params.get('cuisine');
      const vibe = params.get('vibe');
      const dietary = params.get('dietary');
      const maxCookTime = Number(params.get('maxCookTime'));
      const recipes = demoRecipes.filter((recipe) =>
        (!search || recipe.title.toLowerCase().includes(search)) &&
        (!cuisine || recipe.cuisine === cuisine) &&
        (!vibe || recipe.vibes.some((value) => value === vibe)) &&
        (!dietary || recipe.dietaryTags.some((value) => value === dietary)) &&
        (!maxCookTime || recipe.prepTimeMinutes + recipe.cookTimeMinutes <= maxCookTime)
      );
      if (path === '/recipes') return { success: true, count: recipes.length, data: recipes } as T;
      const recipeId = path.slice('/recipes/'.length);
      const recipe = demoRecipes.find((item) => item._id === recipeId);
      if (recipe) return ok(recipe) as T;
    }

    if (path === '/pantry') {
      const search = params.get('search')?.toLowerCase();
      const category = params.get('category');
      const status = params.get('status');
      const items = demoPantryItems.filter((item) =>
        (!search || item.name.toLowerCase().includes(search)) &&
        (!category || item.category === category) &&
        (!status || status === 'all' ||
          (status === 'expired' && item.isExpired) ||
          (status === 'expiring_soon' && item.isExpiringSoon) ||
          (status === 'fresh' && !item.isExpired && !item.isExpiringSoon))
      );
      return ok(items) as T;
    }

    if (path === '/pantry/recipes') return ok(demoPantrySuggestions) as T;
    if (path === '/household') return ok(demoHousehold) as T;
    if (path === '/household/invitations/pending') return ok([]) as T;
    if (path === '/subscriptions/usage') {
      return ok({ aiQuotaUsed: 2, aiQuotaLimit: 5 }) as T;
    }
    if (path === '/subscriptions/invoices') return ok([]) as T;
  }

  if (path.startsWith('/recipes/') && path.endsWith('/favorite')) {
    return {
      success: true,
      isFavorited: true,
      favorites: demoUser.favorites || [],
    } as T;
  }
  if (path.startsWith('/recipes/') && path.endsWith('/reaction')) {
    return { success: true, upvotes: 1, downvotes: 0 } as T;
  }
  if (path.startsWith('/pantry/recipes/') && path.endsWith('/add-missing-to-grocery')) {
    return ok({ addedCount: 1, shoppingList: demoShoppingList }) as T;
  }
  if (path.startsWith('/pantry/')) {
    const item = demoPantryItems.find((pantryItem) => path.includes(pantryItem._id || ''));
    return ok(item || demoPantryItems[0]) as T;
  }
  if (path.startsWith('/pantry')) return ok(demoPantryItems[0]) as T;
  if (path.startsWith('/shopping-list')) return ok(demoShoppingList) as T;
  if (path.startsWith('/plan')) return ok(demoMealPlan) as T;
  if (path.startsWith('/household')) return ok(demoHousehold) as T;
  if (path.startsWith('/subscriptions')) {
    return ok({ tier: 'free', aiQuotaUsed: 2, aiQuotaLimit: 5 }) as T;
  }
  if (path.startsWith('/ai/leftover-recipe')) {
    return {
      success: true,
      data: { recipe: demoRecipes[0], isAiGenerated: false, fallback: true },
      isAiGenerated: false,
      fallback: true,
    } as T;
  }
  if (path.startsWith('/ai/plan-intent')) {
    return {
      success: true,
      data: demoMealPlan,
      summary: 'Demo plan preview',
      isAiGenerated: false,
      fallback: true,
    } as T;
  }
  if (path.startsWith('/auth/')) return ok(demoUser) as T;

  throw new Error(`Local demo has no fixture for ${normalizedMethod} ${path}`);
}
