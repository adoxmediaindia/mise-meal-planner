import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { IMealPlan, IUserPreferences, IShoppingList } from '../types';
import { mobileApi } from '../services/api';
import { offlineSyncQueue } from '../services/offlineSync';
import { useAuth } from './AuthContext';

interface PlanContextType {
  plan: IMealPlan | null;
  preferences: IUserPreferences | null;
  shoppingList: IShoppingList | null;
  planHistory: IMealPlan[];
  isLoading: boolean;
  offlinePendingCount: number;
  fetchPlan: () => Promise<void>;
  regeneratePlan: () => Promise<void>;
  swapMeal: (day: string, targetRecipeId?: string) => Promise<void>;
  addMealSlot: (day: string, mealType: string, recipeId: string, servings?: number) => Promise<void>;
  removeMealSlot: (slotId: string) => Promise<void>;
  editMealSlot: (slotId: string, updates: any) => Promise<void>;
  updateHouseholdSize: (householdSize: number) => Promise<void>;
  archivePlan: () => Promise<void>;
  fetchPlanHistory: () => Promise<void>;
  toggleDinnerCooked: (day: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<IUserPreferences>, autoRegenerate?: boolean) => Promise<void>;
  fetchShoppingList: () => Promise<void>;
  toggleShoppingItem: (itemId: string) => Promise<void>;
  resetShoppingList: () => Promise<void>;
  addCustomShoppingItem: (payload: any) => Promise<void>;
  editShoppingItem: (itemId: string, updates: any) => Promise<void>;
  deleteShoppingItem: (itemId: string) => Promise<void>;
  syncOfflineChanges: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [plan, setPlan] = useState<IMealPlan | null>(null);
  const [preferences, setPreferences] = useState<IUserPreferences | null>(null);
  const [shoppingList, setShoppingList] = useState<IShoppingList | null>(null);
  const [planHistory, setPlanHistory] = useState<IMealPlan[]>([]);
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
    let targetState: boolean | undefined = undefined;
    // Optimistic local state update
    if (shoppingList) {
      const current = shoppingList.items.find((i) => i.id === itemId);
      targetState = current ? !current.isBought : true;
      const nextItems = shoppingList.items.map((item) =>
        item.id === itemId ? { ...item, isBought: targetState! } : item
      );
      const nextBought = nextItems.filter((i) => i.isBought).length;
      setShoppingList({
        ...shoppingList,
        items: nextItems,
        itemsBoughtCount: nextBought,
      });
    }

    try {
      const res = await mobileApi.toggleShoppingItem(itemId, targetState);
      if (res.success && res.data) {
        setShoppingList(res.data);
      }
    } catch (err) {
      // If offline, mutation is already queued in offlineSyncQueue by mobileApi.toggleShoppingItem with explicit target state
      console.log('[PlanContext] Toggle queued offline for item:', itemId, 'targetState:', targetState);
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

  const addMealSlot = async (
    day: string,
    mealType: string,
    recipeId: string,
    servings?: number
  ) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.addMealSlot({ day, mealType, recipeId, servings });
      if (res.success && res.data) {
        setPlan(res.data);
        await fetchShoppingList();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeMealSlot = async (slotId: string) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.removeMealSlot(slotId);
      if (res.success && res.data) {
        setPlan(res.data);
        await fetchShoppingList();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const editMealSlot = async (slotId: string, updates: any) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.editMealSlot(slotId, updates);
      if (res.success && res.data) {
        setPlan(res.data);
        await fetchShoppingList();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateHouseholdSize = async (householdSize: number) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.updateHouseholdSize(householdSize);
      if (res.success && res.data) {
        setPlan(res.data);
        if (preferences) setPreferences({ ...preferences, householdSize });
        await fetchShoppingList();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const archivePlan = async () => {
    setIsLoading(true);
    try {
      const res = await mobileApi.archivePlan();
      if (res.success && res.data) {
        setPlan(res.data);
        await fetchShoppingList();
        await fetchPlanHistory();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlanHistory = async () => {
    try {
      const res = await mobileApi.getPlanHistory();
      if (res.success && res.data) {
        setPlanHistory(res.data);
      }
    } catch (err) {
      console.warn('[PlanContext] fetchPlanHistory error:', err);
    }
  };

  const addCustomShoppingItem = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.addCustomShoppingItem(payload);
      if (res.success && res.data) {
        setShoppingList(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const editShoppingItem = async (itemId: string, updates: any) => {
    try {
      const res = await mobileApi.editShoppingItem(itemId, updates);
      if (res.success && res.data) {
        setShoppingList(res.data);
      }
    } catch (err) {
      console.warn('[PlanContext] editShoppingItem error:', err);
    }
  };

  const deleteShoppingItem = async (itemId: string) => {
    try {
      const res = await mobileApi.deleteShoppingItem(itemId);
      if (res.success && res.data) {
        setShoppingList(res.data);
      }
    } catch (err) {
      console.warn('[PlanContext] deleteShoppingItem error:', err);
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
      setPlanHistory([]);
    }
  }, [isAuthenticated, fetchPlan, fetchPreferences, fetchShoppingList]);

  return (
    <PlanContext.Provider
      value={{
        plan,
        preferences,
        shoppingList,
        planHistory,
        isLoading,
        offlinePendingCount,
        fetchPlan,
        regeneratePlan,
        swapMeal,
        addMealSlot,
        removeMealSlot,
        editMealSlot,
        updateHouseholdSize,
        archivePlan,
        fetchPlanHistory,
        toggleDinnerCooked,
        fetchPreferences,
        updatePreferences,
        fetchShoppingList,
        toggleShoppingItem,
        resetShoppingList,
        addCustomShoppingItem,
        editShoppingItem,
        deleteShoppingItem,
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
