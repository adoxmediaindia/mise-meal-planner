import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { IMealPlan, IUserPreferences, IShoppingList } from '../types';
import { mobileApi } from '../services/api';
import { offlineSyncQueue } from '../services/offlineSync';
import { useAuth } from './AuthContext';

interface PlanContextType {
  plan: IMealPlan | null;
  preferences: IUserPreferences | null;
  shoppingList: IShoppingList | null;
  isLoading: boolean;
  offlinePendingCount: number;
  fetchPlan: () => Promise<void>;
  regeneratePlan: () => Promise<void>;
  swapMeal: (day: string, targetRecipeId?: string) => Promise<void>;
  toggleDinnerCooked: (day: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<IUserPreferences>, autoRegenerate?: boolean) => Promise<void>;
  fetchShoppingList: () => Promise<void>;
  toggleShoppingItem: (itemId: string) => Promise<void>;
  resetShoppingList: () => Promise<void>;
  syncOfflineChanges: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [plan, setPlan] = useState<IMealPlan | null>(null);
  const [preferences, setPreferences] = useState<IUserPreferences | null>(null);
  const [shoppingList, setShoppingList] = useState<IShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(0);

  // Subscribe to offline queue changes
  useEffect(() => {
    const unsubscribe = offlineSyncQueue.subscribe((count) => {
      setOfflinePendingCount(count);
    });
    return unsubscribe;
  }, []);

  const fetchPlan = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await mobileApi.getCurrentPlan();
      if (res.success && res.data) {
        setPlan(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const regeneratePlan = async () => {
    setIsLoading(true);
    try {
      const res = await mobileApi.generatePlan();
      if (res.success && res.data) {
        setPlan(res.data);
        await fetchShoppingList();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const swapMeal = async (day: string, targetRecipeId?: string) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.swapMeal({ day, targetRecipeId });
      if (res.success && res.data) {
        setPlan(res.data);
        await fetchShoppingList();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDinnerCooked = async (day: string) => {
    try {
      const res = await mobileApi.toggleDinnerCooked(day);
      if (res.success && res.data) {
        setPlan(res.data);
      }
    } catch (err) {
      console.warn('[PlanContext] toggleDinnerCooked error:', err);
    }
  };

  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await mobileApi.getPreferences();
      if (res.success && res.data) {
        setPreferences(res.data);
      }
    } catch (err) {
      console.warn('[PlanContext] fetchPreferences error:', err);
    }
  }, [isAuthenticated]);

  const updatePreferences = async (
    updates: Partial<IUserPreferences>,
    autoRegenerate: boolean = true
  ) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.updatePreferences({ ...updates, autoRegenerate });
      if (res.success && res.data) {
        setPreferences(res.data);
        if (autoRegenerate) {
          await fetchPlan();
          await fetchShoppingList();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShoppingList = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await mobileApi.getShoppingList();
      if (res.success && res.data) {
        setShoppingList(res.data);
      }
    } catch (err) {
      console.warn('[PlanContext] fetchShoppingList error:', err);
    }
  }, [isAuthenticated]);

  const toggleShoppingItem = async (itemId: string) => {
    // Optimistic local state update
    if (shoppingList) {
      const nextItems = shoppingList.items.map((item) =>
        item.id === itemId ? { ...item, isBought: !item.isBought } : item
      );
      const nextBought = nextItems.filter((i) => i.isBought).length;
      setShoppingList({
        ...shoppingList,
        items: nextItems,
        itemsBoughtCount: nextBought,
      });
    }

    try {
      const res = await mobileApi.toggleShoppingItem(itemId);
      if (res.success && res.data) {
        setShoppingList(res.data);
      }
    } catch (err) {
      // If offline, mutation is already queued in offlineSyncQueue by mobileApi.toggleShoppingItem
      console.log('[PlanContext] Toggle queued offline for item:', itemId);
    }
  };

  const resetShoppingList = async () => {
    setIsLoading(true);
    try {
      const res = await mobileApi.resetShoppingList();
      if (res.success && res.data) {
        setShoppingList(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const syncOfflineChanges = async () => {
    const result = await mobileApi.flushOfflineCheckoffs();
    if (result.synced > 0) {
      await fetchShoppingList();
    }
  };

  // Load plan, preferences and shopping list when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPlan();
      fetchPreferences();
      fetchShoppingList();
    } else {
      setPlan(null);
      setPreferences(null);
      setShoppingList(null);
    }
  }, [isAuthenticated, fetchPlan, fetchPreferences, fetchShoppingList]);

  return (
    <PlanContext.Provider
      value={{
        plan,
        preferences,
        shoppingList,
        isLoading,
        offlinePendingCount,
        fetchPlan,
        regeneratePlan,
        swapMeal,
        toggleDinnerCooked,
        fetchPreferences,
        updatePreferences,
        fetchShoppingList,
        toggleShoppingItem,
        resetShoppingList,
        syncOfflineChanges,
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
