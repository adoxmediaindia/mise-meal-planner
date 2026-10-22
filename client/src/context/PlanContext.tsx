import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IMealPlan, IShoppingList, IUserPreferences, DayOfWeek } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.js';

interface PlanContextType {
  plan: IMealPlan | null;
  shoppingList: IShoppingList | null;
  preferences: IUserPreferences | null;
  isLoading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  generatePlan: () => Promise<void>;
  swapMeal: (day: DayOfWeek, targetRecipeId?: string) => Promise<void>;
  toggleDinnerCooked: (day: DayOfWeek) => Promise<void>;
  toggleShoppingItem: (itemId: string) => Promise<void>;
  resetShoppingList: () => Promise<void>;
  updatePreferences: (updates: Partial<IUserPreferences>, autoRegenerate?: boolean) => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [plan, setPlan] = useState<IMealPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<IShoppingList | null>(null);
  const [preferences, setPreferences] = useState<IUserPreferences | null>(null);
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

  return (
    <PlanContext.Provider
      value={{
        plan,
        shoppingList,
        preferences,
        isLoading,
        error,
        refreshAll,
        generatePlan,
        swapMeal,
        toggleDinnerCooked,
        toggleShoppingItem,
        resetShoppingList,
        updatePreferences,
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
