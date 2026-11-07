import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { IMealPlan, IUserPreferences, IShoppingList } from '../types';
import { mobileApi } from '../services/api';
import { offlineSyncQueue } from '../services/offlineSync';
import { useAuth } from './AuthContext';
import { isLocalDemoMode } from '../demo/demoMode';
import { runSingleFlight } from '../services/requestControl';

const INITIAL_PLAN_REQUEST_TIMEOUT_MS = 45_000;

interface PlanContextType {
  plan: IMealPlan | null;
  planError: string | null;
  preferences: IUserPreferences | null;
  shoppingList: IShoppingList | null;
  planHistory: IMealPlan[];
  isLoading: boolean;
  offlinePendingCount: number;
  fetchPlan: () => Promise<void>;
  regeneratePlan: () => Promise<void>;
  retryInitialPlan: () => Promise<void>;
  customizePlanWithIntent: (prompt: string) => Promise<{ summary: string; isAiGenerated: boolean; fallback: boolean }>;
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
  addMissingIngredientsToGrocery: (recipeId: string) => Promise<{ addedCount: number }>;
  syncOfflineChanges: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, retryOnboardingCompletion } = useAuth();
  const [plan, setPlan] = useState<IMealPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<IUserPreferences | null>(null);
  const [shoppingList, setShoppingList] = useState<IShoppingList | null>(null);
  const [planHistory, setPlanHistory] = useState<IMealPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(0);
  const initialPlanRetryRef = useRef<Promise<void> | null>(null);

  // Subscribe to offline queue changes
  useEffect(() => {
    if (isLocalDemoMode()) return;

    const unsubscribe = offlineSyncQueue.subscribe((count) => {
      setOfflinePendingCount(count);
    });
    return unsubscribe;
  }, []);

  const fetchPlan = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setPlanError(null);
    try {
      const res = await mobileApi.getCurrentPlan();
      if (res.success && res.data) {
        setPlan(res.data);
      } else {
        setPlan(null);
      }
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : 'Unable to load your meal plan.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const regeneratePlan = async () => {
    setIsLoading(true);
    setPlanError(null);
    try {
      const res = await mobileApi.generatePlan();
      if (res.success && res.data) {
        setPlan(res.data);
        await fetchShoppingList();
      } else {
        throw new Error('The meal plan could not be generated. Please try again.');
      }
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : 'Unable to generate your meal plan.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const retryInitialPlan = () => {
    return runSingleFlight(initialPlanRetryRef, async () => {
      setIsLoading(true);
      setPlanError(null);
      const requestTimeoutMs = INITIAL_PLAN_REQUEST_TIMEOUT_MS;
      try {
        await retryOnboardingCompletion();
        const res = await mobileApi.getCurrentPlan(requestTimeoutMs);
        if (!res.success || !res.data) {
          throw new Error('Your first meal plan is still being prepared. Please retry.');
        }
        setPlan(res.data);
        await Promise.all([
          fetchPreferences(requestTimeoutMs),
          fetchShoppingList(requestTimeoutMs),
        ]);
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'Your first meal plan could not be prepared. Please retry.';
        setPlanError(message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    });
  };

  const customizePlanWithIntent = async (prompt: string) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.customizePlanWithIntent(prompt);
      if (res.success && res.data) {
        setPlan(res.data);
        await fetchShoppingList();
      }
      return {
        summary: res.summary,
        isAiGenerated: res.isAiGenerated,
        fallback: res.fallback,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const addMissingIngredientsToGrocery = async (recipeId: string) => {
    const res = await mobileApi.addMissingIngredientsToGrocery(recipeId);
    if (res.success) {
      await fetchShoppingList();
      return { addedCount: res.data?.addedCount ?? 0 };
    }
    return { addedCount: 0 };
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

  const fetchPreferences = useCallback(async (timeoutMs?: number) => {
    if (!isAuthenticated) return;
    try {
      const res = await mobileApi.getPreferences(timeoutMs);
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

  const fetchShoppingList = useCallback(async (timeoutMs?: number) => {
    if (!isAuthenticated) return;
    try {
      const res = await mobileApi.getShoppingList(timeoutMs);
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

  // Load the saved planner or generate the first plan after onboarding.
  useEffect(() => {
    if (isAuthenticated) {
      let active = true;
      setIsLoading(true);
      setPlanError(null);

      const loadPlanner = async () => {
        try {
          const currentPlan = await mobileApi.getCurrentPlan(INITIAL_PLAN_REQUEST_TIMEOUT_MS);
          if (!active) return;
          if (currentPlan.success && currentPlan.data) {
            setPlan(currentPlan.data);
          } else {
            setPlan(null);
          }

          if (user?.onboardingStep === 25 && !user.onboardingCompleted) {
            await retryOnboardingCompletion();
            const finalizedPlan = await mobileApi.getCurrentPlan(INITIAL_PLAN_REQUEST_TIMEOUT_MS);
            if (!finalizedPlan.success || !finalizedPlan.data) {
              throw new Error('Your onboarding answers are saved, but your first meal plan is not ready yet.');
            }
            if (active) setPlan(finalizedPlan.data);
          }
          await Promise.all([
            fetchPreferences(INITIAL_PLAN_REQUEST_TIMEOUT_MS),
            fetchShoppingList(INITIAL_PLAN_REQUEST_TIMEOUT_MS),
          ]);
        } catch (error) {
          console.warn('[PlanContext] Initial planner setup failed:', error);
          if (active) {
            setPlanError(error instanceof Error ? error.message : 'Unable to load your meal plan.');
          }
        } finally {
          if (active) setIsLoading(false);
        }
      };

      void loadPlanner();
      return () => {
        active = false;
      };
    } else {
      setPlan(null);
      setPlanError(null);
      setPreferences(null);
      setShoppingList(null);
      setPlanHistory([]);
    }
  }, [isAuthenticated, user?.id, user?.onboardingStep, fetchPreferences, fetchShoppingList]);

  return (
    <PlanContext.Provider
      value={{
        plan,
        planError,
        preferences,
        shoppingList,
        planHistory,
        isLoading,
        offlinePendingCount,
        fetchPlan,
        regeneratePlan,
        retryInitialPlan,
        customizePlanWithIntent,
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
        addMissingIngredientsToGrocery,
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
