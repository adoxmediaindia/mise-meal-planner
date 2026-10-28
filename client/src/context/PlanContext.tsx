import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IMealPlan, IShoppingList, IUserPreferences, DayOfWeek, MealType } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.js';

interface PlanContextType {
  plan: IMealPlan | null;
  shoppingList: IShoppingList | null;
  preferences: IUserPreferences | null;
  planHistory: IMealPlan[];
  isLoading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  generatePlan: () => Promise<void>;
  swapMeal: (day: DayOfWeek, targetRecipeId?: string) => Promise<void>;
  addMealSlot: (day: DayOfWeek, mealType: MealType, recipeId: string, servings?: number) => Promise<void>;
  removeMealSlot: (slotId: string) => Promise<void>;
  editMealSlot: (slotId: string, updates: { servings?: number; isCooked?: boolean; recipeId?: string }) => Promise<void>;
  updateHouseholdSize: (householdSize: number) => Promise<void>;
  archivePlan: () => Promise<void>;
  fetchPlanHistory: () => Promise<void>;
  toggleDinnerCooked: (day: DayOfWeek) => Promise<void>;
  toggleShoppingItem: (itemId: string) => Promise<void>;
  resetShoppingList: () => Promise<void>;
  addCustomShoppingItem: (payload: { name: string; totalQuantity?: number; unit?: string; aisle?: string; estimatedCost?: number; icon?: string }) => Promise<void>;
  editShoppingItem: (itemId: string, updates: any) => Promise<void>;
  deleteShoppingItem: (itemId: string) => Promise<void>;
  updatePreferences: (updates: Partial<IUserPreferences>, autoRegenerate?: boolean) => Promise<void>;
  customizePlanWithIntent: (prompt: string) => Promise<any>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [plan, setPlan] = useState<IMealPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<IShoppingList | null>(null);
  const [preferences, setPreferences] = useState<IUserPreferences | null>(null);
  const [planHistory, setPlanHistory] = useState<IMealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const [planRes, shopRes, prefRes] = await Promise.all([
        api.getCurrentPlan().catch(() => ({ data: null })),
        api.getShoppingList().catch(() => ({ data: null })),
        api.getPreferences().catch(() => ({ data: null })),
      ]);

      if (planRes.data) setPlan(planRes.data);
      if (shopRes.data) setShoppingList(shopRes.data);
      if (prefRes.data) setPreferences(prefRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch meal planning data');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    } else {
      setPlan(null);
      setShoppingList(null);
      setPreferences(null);
      setPlanHistory([]);
    }
  }, [isAuthenticated, refreshAll]);

  const generatePlan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.generatePlan();
      setPlan(res.data);
      // Fetch updated shopping list
      const shopRes = await api.getShoppingList();
      setShoppingList(shopRes.data);
    } catch (err: any) {
      setError(err.message || 'Could not generate plan');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const swapMeal = async (day: DayOfWeek, targetRecipeId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.swapMeal({ day, targetRecipeId });
      setPlan(res.data);
      const shopRes = await api.getShoppingList();
      setShoppingList(shopRes.data);
    } catch (err: any) {
      setError(err.message || 'Could not swap meal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addMealSlot = async (
    day: DayOfWeek,
    mealType: MealType,
    recipeId: string,
    servings?: number
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.addMealSlot({ day, mealType, recipeId, servings });
      setPlan(res.data);
      const shopRes = await api.getShoppingList();
      setShoppingList(shopRes.data);
    } catch (err: any) {
      setError(err.message || 'Could not add meal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeMealSlot = async (slotId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.removeMealSlot(slotId);
      setPlan(res.data);
      const shopRes = await api.getShoppingList();
      setShoppingList(shopRes.data);
    } catch (err: any) {
      setError(err.message || 'Could not remove meal slot');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const editMealSlot = async (
    slotId: string,
    updates: { servings?: number; isCooked?: boolean; recipeId?: string }
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.editMealSlot(slotId, updates);
      setPlan(res.data);
      const shopRes = await api.getShoppingList();
      setShoppingList(shopRes.data);
    } catch (err: any) {
      setError(err.message || 'Could not update meal slot');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateHouseholdSize = async (householdSize: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.updateHouseholdSize(householdSize);
      setPlan(res.data);
      if (preferences) {
        setPreferences({ ...preferences, householdSize });
      }
      const shopRes = await api.getShoppingList();
      setShoppingList(shopRes.data);
    } catch (err: any) {
      setError(err.message || 'Could not update household size');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const archivePlan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.archivePlan();
      setPlan(res.data);
      const shopRes = await api.getShoppingList();
      setShoppingList(shopRes.data);
      await fetchPlanHistory();
    } catch (err: any) {
      setError(err.message || 'Could not archive plan');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlanHistory = async () => {
    try {
      const res = await api.getPlanHistory();
      if (res.data) setPlanHistory(res.data);
    } catch (err: any) {
      console.warn('Failed to fetch plan history:', err);
    }
  };

  const toggleDinnerCooked = async (day: DayOfWeek) => {
    try {
      const res = await api.toggleDinnerCooked(day);
      setPlan(res.data);
    } catch (err: any) {
      setError(err.message || 'Could not update meal status');
    }
  };

  const toggleShoppingItem = async (itemId: string) => {
    // Optimistic UI update
    if (shoppingList) {
      const updatedItems = shoppingList.items.map((item) =>
        item.id === itemId ? { ...item, isBought: !item.isBought } : item
      );
      const boughtCount = updatedItems.filter((i) => i.isBought).length;
      setShoppingList({
        ...shoppingList,
        items: updatedItems,
        itemsBoughtCount: boughtCount,
      });
    }

    try {
      const res = await api.toggleShoppingItem(itemId);
      setShoppingList(res.data);
    } catch (err: any) {
      refreshAll(); // rollback on failure
      setError(err.message || 'Could not update shopping item');
    }
  };

  const resetShoppingList = async () => {
    try {
      const res = await api.resetShoppingList();
      setShoppingList(res.data);
    } catch (err: any) {
      setError(err.message || 'Could not reset shopping list');
    }
  };

  const addCustomShoppingItem = async (payload: {
    name: string;
    totalQuantity?: number;
    unit?: string;
    aisle?: string;
    estimatedCost?: number;
    icon?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.addCustomShoppingItem(payload);
      setShoppingList(res.data);
    } catch (err: any) {
      setError(err.message || 'Could not add custom item');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const editShoppingItem = async (itemId: string, updates: any) => {
    try {
      const res = await api.editShoppingItem(itemId, updates);
      setShoppingList(res.data);
    } catch (err: any) {
      setError(err.message || 'Could not edit item');
      throw err;
    }
  };

  const deleteShoppingItem = async (itemId: string) => {
    try {
      const res = await api.deleteShoppingItem(itemId);
      setShoppingList(res.data);
    } catch (err: any) {
      setError(err.message || 'Could not delete item');
      throw err;
    }
  };

  const updatePreferences = async (updates: Partial<IUserPreferences>, autoRegenerate?: boolean) => {
    setIsLoading(true);
    try {
      const res = await api.updatePreferences({ ...updates, autoRegenerate });
      setPreferences(res.data);
      if (autoRegenerate) {
        await refreshAll();
      }
    } catch (err: any) {
      setError(err.message || 'Could not update preferences');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const customizePlanWithIntent = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.customizePlanWithIntent(prompt);
      if (res.data?.plan) {
        setPlan(res.data.plan);
      }
      const shopRes = await api.getShoppingList();
      if (shopRes.data) {
        setShoppingList(shopRes.data);
      }
      return res.data;
    } catch (err: any) {
      setError(err.message || 'Failed to customize plan with AI');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PlanContext.Provider
      value={{
        plan,
        shoppingList,
        preferences,
        planHistory,
        isLoading,
        error,
        refreshAll,
        generatePlan,
        swapMeal,
        addMealSlot,
        removeMealSlot,
        editMealSlot,
        updateHouseholdSize,
        archivePlan,
        fetchPlanHistory,
        toggleDinnerCooked,
        toggleShoppingItem,
        resetShoppingList,
        addCustomShoppingItem,
        editShoppingItem,
        deleteShoppingItem,
        updatePreferences,
        customizePlanWithIntent,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};
