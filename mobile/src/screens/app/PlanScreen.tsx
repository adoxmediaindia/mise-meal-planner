import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePlan } from '../../context/PlanContext';
import { useAuth } from '../../context/AuthContext';
import { SwapModal } from '../../components/plan/SwapModal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { mobileApi } from '../../services/api';
import {
  DayOfWeek,
  IMealSlot,
  IRecipe,
  MealType,
} from '../../types';

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const MEAL_TYPES: { key: MealType | 'all'; label: string }[] = [
  { key: 'all', label: 'All Meals' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'snack', label: 'Snack' },
];

const AI_PRESETS = [
  'Make my dinners vegetarian, quick, and ready in under 25 minutes',
  'High protein Mediterranean week',
  'Quick 20-min weeknights',
  'Healthy comfort food and fakeaway',
  'Light dinners and low calorie',
];

interface PlanScreenProps {
  onSelectRecipe: (recipe: IRecipe) => void;
  onNavigateToPreferences: () => void;
  onNavigateToGrocery?: () => void;
  onNavigateToPantry?: () => void;
}

export const PlanScreen: React.FC<PlanScreenProps> = ({
  onSelectRecipe,
  onNavigateToPreferences,
  onNavigateToGrocery,
  onNavigateToPantry,
}) => {
  const {
    plan,
    planError,
    retryInitialPlan,
    planHistory,
    preferences,
    shoppingList,
    isLoading,
    fetchPlan,
    regeneratePlan,
    customizePlanWithIntent,
    swapMeal,
    addMealSlot,
    removeMealSlot,
    editMealSlot,
    updateHouseholdSize,
    archivePlan,
    fetchPlanHistory,
    toggleDinnerCooked,
  } = usePlan();

  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [activeMealTypeFilter, setActiveMealTypeFilter] = useState<MealType | 'all'>('all');

  // AI Customize Drawer / Modal State
  const [isAiCustomizeOpen, setIsAiCustomizeOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSubmittingAiPrompt, setIsSubmittingAiPrompt] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isUpgradeRequired, setIsUpgradeRequired] = useState(false);

  // Swap Modal State
  const [activeSwapSlot, setActiveSwapSlot] = useState<{ day: string; slotId?: string } | null>(null);

  // Add Meal Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addDay, setAddDay] = useState<DayOfWeek>('Monday');
  const [addMealType, setAddMealType] = useState<MealType>('dinner');
  const [addServings, setAddServings] = useState<number>(plan?.householdSize || 2);
  const [addSearch, setAddSearch] = useState('');
  const [addRecipes, setAddRecipes] = useState<IRecipe[]>([]);
  const [loadingAddRecipes, setLoadingAddRecipes] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPlan();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetryPlan = async () => {
    try {
      if (user?.onboardingStep === 25 && !user.onboardingCompleted) {
        await retryInitialPlan();
      } else {
        await fetchPlan();
      }
    } catch (error) {
      console.warn('[PlanScreen] Meal plan retry failed:', error);
    }
  };

  const handleSelectPreset = (preset: string) => {
    setAiPrompt(preset);
    setAiError(null);
  };

  const handleAiCustomizeSubmit = async () => {
    const trimmed = aiPrompt.trim();
    if (!trimmed) {
      setAiError('Please enter a description for your meal plan preferences.');
      return;
    }
    if (trimmed.length < 3) {
      setAiError('Please describe your preferences in at least 3 characters.');
      return;
    }
    if (trimmed.length > 1000) {
      setAiError(`Meal plan prompt cannot exceed 1,000 characters (currently ${trimmed.length} characters).`);
      return;
    }
    setAiError(null);
    setIsUpgradeRequired(false);
    setIsSubmittingAiPrompt(true);
    try {
      const res = await customizePlanWithIntent(trimmed);
      setAiSummary(res?.summary || 'Plan successfully updated with your preferences!');
      setAiPrompt('');
      setIsAiCustomizeOpen(false);
    } catch (err: any) {
      if (err.status === 403 || err.code === 'UPGRADE_REQUIRED' || err.response?.data?.code === 'UPGRADE_REQUIRED') {
        setIsUpgradeRequired(true);
        setAiError(err.message || err.response?.data?.error || 'Weekly AI generation quota reached. Upgrade to Pro for 50 AI queries/week.');
      } else {
        setAiError(err.message || 'Failed to customize plan with AI.');
      }
    } finally {
      setIsSubmittingAiPrompt(false);
    }
  };

  const handleConfirmRegenerate = () => {
    Alert.alert(
      'Regenerate Meal Plan?',
      "Regenerate this week's meals? Your shopping list will automatically update.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', style: 'destructive', onPress: regeneratePlan },
      ]
    );
  };

  const handleConfirmArchive = () => {
    Alert.alert(
      'Archive Current Week?',
      'Archive this week to history and generate a fresh weekly meal plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive Week', onPress: archivePlan },
      ]
    );
  };

  const handleOpenAddModal = async (defaultDay?: DayOfWeek) => {
    if (defaultDay) setAddDay(defaultDay);
    setAddServings(plan?.householdSize || 2);
    setIsAddModalOpen(true);
    setLoadingAddRecipes(true);
    try {
      const res = await mobileApi.getRecipes();
      if (res.data) {
        setAddRecipes(res.data);
      }
    } catch {
      setAddRecipes([]);
    } finally {
      setLoadingAddRecipes(false);
    }
  };

  const handleAddMealSubmit = async (recipeId: string) => {
    setIsSubmittingAdd(true);
    try {
      await addMealSlot(addDay, addMealType, recipeId, addServings);
      setIsAddModalOpen(false);
      Alert.alert('Meal Added', `Added to ${addDay} ${addMealType}!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add meal');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleOpenHistory = async () => {
    setIsHistoryOpen(true);
    setLoadingHistory(true);
    try {
      await fetchPlanHistory();
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleConfirmSwap = async (day: string, targetRecipeId?: string) => {
    if (activeSwapSlot?.slotId && targetRecipeId) {
      await editMealSlot(activeSwapSlot.slotId, { recipeId: targetRecipeId });
    } else {
      await swapMeal(day, targetRecipeId);
    }
    setActiveSwapSlot(null);
  };

  if (isLoading && !plan) {
    return <LoadingState message="Generating your personalized meal plan..." />;
  }

  if (
    planError &&
    (!plan || (user?.onboardingStep === 25 && !user.onboardingCompleted))
  ) {
    return <ErrorState message={planError} onRetry={handleRetryPlan} loading={isLoading} />;
  }

  if (!plan || (!plan.dinners?.length && !plan.meals?.length)) {
    return (
      <EmptyState
        icon="🍳"
        title="No meal plan found"
        description="Set up your household preferences to generate your personalized weekly dinner plan."
        actionTitle="Configure Preferences"
        onAction={onNavigateToPreferences}
      />
    );
  }

  const isUnderBudget = plan.estimatedCost <= plan.budgetLimit;
  const currencySymbol =
    preferences?.currencyCode === 'INR' || user?.currencyCode === 'INR' ? '₹'
    : preferences?.currencyCode === 'GBP' || user?.currencyCode === 'GBP' ? '£'
    : preferences?.currencyCode === 'EUR' || user?.currencyCode === 'EUR' ? '€'
    : preferences?.currencyCode === 'BRL' || user?.currencyCode === 'BRL' ? 'R$'
    : '$';
  const supermarketName = preferences?.supermarket || 'Aldi';

  // Prepare meal slots list
  const hasMeals = Boolean(plan.meals && plan.meals.length > 0);
  const slots: IMealSlot[] = hasMeals
    ? (plan.meals || [])
    : (plan.dinners || []).map((d) => ({
        id: `dinner-${d.day}`,
        day: d.day,
        mealType: 'dinner' as MealType,
        recipe: d.recipe,
        isCooked: d.isCooked,
        servings: plan.householdSize || 2,
      }));

  const filteredSlots = activeMealTypeFilter === 'all'
    ? slots
    : slots.filter((s) => s.mealType === activeMealTypeFilter);

  // Group slots by day
  const slotsByDay: Record<DayOfWeek, IMealSlot[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };

  filteredSlots.forEach((slot) => {
    if (slotsByDay[slot.day]) {
      slotsByDay[slot.day].push(slot);
    }
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0D5C3A']}
          />
        }
      >
        {/* Header Action Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>this week's plan</Text>
            <View style={styles.supermarketPill}>
              <Text style={styles.supermarketPillText}>planned for {supermarketName}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.aiCustomBtn}
              onPress={() => setIsAiCustomizeOpen(true)}
            >
              <Text style={styles.aiCustomBtnText}>✨ AI Customize</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={handleOpenHistory}
            >
              <Text style={styles.iconActionText}>📜</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={handleConfirmArchive}
            >
              <Text style={styles.iconActionText}>📦</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={handleConfirmRegenerate}
            >
              <Text style={styles.iconActionText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Notification Summary Banner if present */}
        {aiSummary && (
          <View style={styles.aiSummaryBanner}>
            <View style={styles.aiSummaryHeader}>
              <Text style={styles.aiSummaryTitle}>✨ Chef Meltto AI Updated Your Plan</Text>
              <TouchableOpacity onPress={() => setAiSummary(null)}>
                <Text style={styles.aiSummaryClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.aiSummaryText}>{aiSummary}</Text>
          </View>
        )}

        {/* Budget & Household Size Tracker */}
        <View style={styles.summaryCard}>
          <View style={styles.budgetRow}>
            <View style={styles.costBox}>
              <Text style={styles.costLabel}>plan cost</Text>
              <Text style={styles.costValue}>{currencySymbol}{plan.estimatedCost.toFixed(2)}</Text>
            </View>

            <View style={styles.costBox}>
              <Text style={styles.costLabel}>weekly budget</Text>
              <Text style={styles.costValue}>{currencySymbol}{plan.budgetLimit.toFixed(2)}</Text>
            </View>

            <View
              style={[
                styles.budgetStatusPill,
                isUnderBudget ? styles.pillUnder : styles.pillOver,
              ]}
            >
              <Text
                style={[
                  styles.budgetStatusText,
                  isUnderBudget ? styles.textUnder : styles.textOver,
                ]}
              >
                {isUnderBudget
                  ? `✓ ${currencySymbol}${(plan.budgetLimit - plan.estimatedCost).toFixed(2)} under`
                  : `⚠️ ${currencySymbol}${(plan.estimatedCost - plan.budgetLimit).toFixed(2)} over`}
              </Text>
            </View>
          </View>

          {/* Budget progress meter */}
          <View style={styles.budgetProgressBar}>
            <View
              style={[
                styles.budgetProgressFill,
                {
                  width: `${Math.min(100, Math.round((plan.estimatedCost / Math.max(1, plan.budgetLimit)) * 100))}%`,
                  backgroundColor: isUnderBudget ? '#9ED034' : '#EF4444',
                },
              ]}
            />
          </View>

          {/* Household Size Stepper */}
          <View style={styles.householdRow}>
            <Text style={styles.householdLabel}>Household Servings:</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => updateHouseholdSize(Math.max(1, (plan.householdSize || 2) - 1))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{plan.householdSize} persons</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => updateHouseholdSize(Math.min(12, (plan.householdSize || 2) + 1))}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* TAP TO VIEW Grocery List Banner */}
        <TouchableOpacity
          style={styles.groceryCard}
          onPress={() => onNavigateToGrocery ? onNavigateToGrocery() : undefined}
          activeOpacity={0.8}
        >
          <View style={styles.groceryCardLeft}>
            <Text style={styles.groceryCardOverline}>TAP TO VIEW</Text>
            <Text style={styles.groceryCardTitle}>Grocery list</Text>
            <Text style={styles.groceryCardSubtitle}>
              {shoppingList ? `${shoppingList.itemsBoughtCount}/${shoppingList.totalItemsCount}` : '0/22'} items bought
            </Text>
          </View>
          <View style={styles.groceryCardIconCircle}>
            <Text style={styles.groceryCardIconText}>🛍️</Text>
          </View>
        </TouchableOpacity>

        {/* Meal Type Filter Chips & Add Meal Button */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
          >
            {MEAL_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.filterPill,
                  activeMealTypeFilter === t.key && styles.filterPillActive,
                ]}
                onPress={() => setActiveMealTypeFilter(t.key)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeMealTypeFilter === t.key && styles.filterPillTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.addMealButton}
            onPress={() => handleOpenAddModal()}
          >
            <Text style={styles.addMealButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Meal Cards */}
        {DAYS.map((day) => {
          const daySlots = slotsByDay[day] || [];
          if (activeMealTypeFilter !== 'all' && daySlots.length === 0) {
            return null;
          }

          return (
            <View key={day} style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day}</Text>
                <TouchableOpacity onPress={() => handleOpenAddModal(day)}>
                  <Text style={styles.dayAddText}>+ Add to {day}</Text>
                </TouchableOpacity>
              </View>

              {daySlots.length === 0 ? (
                <View style={styles.emptyDayBox}>
                  <Text style={styles.emptyDayText}>No meals planned for {day}.</Text>
                </View>
              ) : (
                daySlots.map((slot) => {
                  const recipe = slot.recipe;
                  if (!recipe) return null;
                  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

                  return (
                    <View key={slot.id} style={styles.mealCard}>
                      <TouchableOpacity
                        style={styles.mealCardContent}
                        onPress={() => onSelectRecipe(recipe)}
                        activeOpacity={0.7}
                      >
                        {recipe.image ? (
                          <Image source={{ uri: recipe.image }} style={styles.mealThumb} />
                        ) : (
                          <View style={[styles.mealThumb, styles.mealThumbPlaceholder]}>
                            <Text style={styles.thumbPlaceholderText}>🍲</Text>
                          </View>
                        )}

                        <View style={styles.mealDetails}>
                          <View style={styles.mealMetaTop}>
                            <View style={styles.mealTypeBadge}>
                              <Text style={styles.mealTypeBadgeText}>
                                {slot.mealType.toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.timeMeta}>⏱️ {totalTime} min</Text>
                          </View>

                          <Text style={styles.mealTitle} numberOfLines={2}>
                            {recipe.title}
                          </Text>

                          <Text style={styles.mealSubtitle} numberOfLines={1}>
                            👤 {slot.servings || plan.householdSize || 2} servings • {recipe.cuisine} • {recipe.calories} kcal
                            {recipe.vibes?.[0] ? ` • ${recipe.vibes[0]}` : ''}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Slot Controls Bottom Bar */}
                      <View style={styles.cardBottomBar}>
                        {/* Cooked Toggle */}
                        <TouchableOpacity
                          style={styles.cookedToggle}
                          onPress={async () => {
                            if (slot.id.startsWith('dinner-')) {
                              await toggleDinnerCooked(slot.day);
                            } else {
                              await editMealSlot(slot.id, { isCooked: !slot.isCooked });
                            }
                          }}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              slot.isCooked && styles.checkboxChecked,
                            ]}
                          >
                            {slot.isCooked && <Text style={styles.checkIcon}>✓</Text>}
                          </View>
                          <Text
                            style={[
                              styles.cookedLabel,
                              slot.isCooked && styles.cookedLabelChecked,
                            ]}
                          >
                            {slot.isCooked ? 'Cooked' : 'Mark cooked'}
                          </Text>
                        </TouchableOpacity>

                        {/* Servings Stepper */}
                        <View style={styles.slotServingsStepper}>
                          <TouchableOpacity
                            style={styles.slotStepBtn}
                            onPress={() => {
                              const cur = slot.servings || plan.householdSize || 2;
                              if (cur > 1) {
                                editMealSlot(slot.id, { servings: cur - 1 });
                              }
                            }}
                          >
                            <Text style={styles.slotStepBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.slotServingsVal}>
                            {slot.servings || plan.householdSize || 2} serv
                          </Text>
                          <TouchableOpacity
                            style={styles.slotStepBtn}
                            onPress={() => {
                              const cur = slot.servings || plan.householdSize || 2;
                              editMealSlot(slot.id, { servings: cur + 1 });
                            }}
                          >
                            <Text style={styles.slotStepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Actions: Swap & Remove */}
                        <View style={styles.slotActionsGroup}>
                          <TouchableOpacity
                            style={styles.swapBtn}
                            onPress={() =>
                              setActiveSwapSlot({
                                day: slot.day,
                                slotId: slot.id.startsWith('dinner-') ? undefined : slot.id,
                              })
                            }
                          >
                            <Text style={styles.swapBtnText}>Swap</Text>
                          </TouchableOpacity>

                          {!slot.id.startsWith('dinner-') && (
                            <TouchableOpacity
                              style={styles.removeBtn}
                              onPress={() => removeMealSlot(slot.id)}
                            >
                              <Text style={styles.removeBtnText}>✕</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* ======================================================= */}
      {/* CHEF MELTTO AI CUSTOMIZE MODAL                          */}
      {/* ======================================================= */}
      <Modal
        visible={isAiCustomizeOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isSubmittingAiPrompt) setIsAiCustomizeOpen(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => {
              if (!isSubmittingAiPrompt) setIsAiCustomizeOpen(false);
            }}
          />
          <View style={styles.aiModalSheet}>
            <View style={styles.sheetHandleBar} />
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.aiModalScrollContent}
            >
              <View style={styles.aiModalHeader}>
                <View style={styles.aiModalTitleRow}>
                  <View style={styles.aiModalBadge}>
                    <Text style={styles.aiModalSparkle}>✨</Text>
                  </View>
                  <View style={styles.aiModalHeaderTextCol}>
                    <Text style={styles.aiModalTitle}>Tailor with Chef Meltto AI</Text>
                    <Text style={styles.aiModalSub}>
                      Describe your week in plain English. We'll pick safe catalog recipes and update your grocery list.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (!isSubmittingAiPrompt) setIsAiCustomizeOpen(false);
                  }}
                  style={styles.modalCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Close"
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Presets */}
              <Text style={styles.presetHeading}>TRY A POPULAR PROMPT</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.presetScroll}
                contentContainerStyle={styles.presetScrollContent}
              >
                {AI_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={styles.presetChip}
                    onPress={() => handleSelectPreset(preset)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.presetChipText}>{preset}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* AI Prompt Input Container */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.aiTextInput}
                  placeholder="E.g., Make my dinners vegetarian, quick, and ready in under 25 minutes..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={Platform.OS === 'ios' ? 4 : 3}
                  value={aiPrompt}
                  onChangeText={(text) => {
                    setAiPrompt(text);
                    if (aiError && text.trim().length >= 3) {
                      setAiError(null);
                    }
                  }}
                  maxLength={1000}
                  editable={!isSubmittingAiPrompt}
                />
                <View style={styles.charCounterRow}>
                  <Text style={styles.strictNoteText}>Strict allergy & dietary filters always apply.</Text>
                  <Text
                    style={[
                      styles.charCounterText,
                      aiPrompt.length > 900 && styles.charCounterWarning,
                      aiPrompt.length >= 1000 && styles.charCounterLimit,
                    ]}
                  >
                    {aiPrompt.length}/1000
                  </Text>
                </View>
              </View>

              {/* AI Error / Upgrade Banner */}
              {aiError && (
                <View style={styles.aiErrorBanner}>
                  <View style={styles.aiErrorHeader}>
                    <Text style={styles.aiErrorIcon}>⚠️</Text>
                    <Text style={styles.aiErrorTitle}>Unable to customize with AI</Text>
                  </View>
                  <Text style={styles.aiErrorBody}>{aiError}</Text>
                  {isUpgradeRequired && (
                    <TouchableOpacity
                      onPress={() => {
                        setIsAiCustomizeOpen(false);
                        onNavigateToPreferences();
                      }}
                      style={styles.upgradeNoticeBtn}
                    >
                      <Text style={styles.upgradeNoticeText}>
                        Upgrade to Meltto Pro in Settings for 50 AI queries / week →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.aiModalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsAiCustomizeOpen(false)}
                  disabled={isSubmittingAiPrompt}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.aiSubmitBtn,
                    (!aiPrompt.trim() || isSubmittingAiPrompt) && styles.aiSubmitBtnDisabled,
                  ]}
                  onPress={handleAiCustomizeSubmit}
                  disabled={!aiPrompt.trim() || isSubmittingAiPrompt}
                >
                  {isSubmittingAiPrompt ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.aiSubmitBtnText}> Crafting Plan...</Text>
                    </View>
                  ) : (
                    <View style={styles.loadingRow}>
                      <Text style={styles.aiSubmitBtnSparkle}>✨</Text>
                      <Text style={styles.aiSubmitBtnText}>Generate with AI</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ======================================================= */}
      {/* ADD MEAL MODAL                                          */}
      {/* ======================================================= */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.addModalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSheetTitle}>Add Meal to Planner</Text>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Day Selector */}
            <Text style={styles.fieldLabel}>Day of Week</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelectorScroll}>
              {DAYS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.smallPill, addDay === d && styles.smallPillActive]}
                  onPress={() => setAddDay(d)}
                >
                  <Text
                    style={[styles.smallPillText, addDay === d && styles.smallPillTextActive]}
                  >
                    {d.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Meal Type Selector */}
            <Text style={styles.fieldLabel}>Meal Type</Text>
            <View style={styles.typeSelectorRow}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.typePill, addMealType === m && styles.typePillActive]}
                  onPress={() => setAddMealType(m)}
                >
                  <Text style={[styles.typePillText, addMealType === m && styles.typePillTextActive]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search Recipe */}
            <Text style={styles.fieldLabel}>Select Recipe</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              placeholderTextColor="#9CA3AF"
              value={addSearch}
              onChangeText={setAddSearch}
            />

            {loadingAddRecipes ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator color="#0D5C3A" />
                <Text style={styles.modalLoadingText}>Loading recipes...</Text>
              </View>
            ) : (
              <ScrollView style={styles.recipePickList} showsVerticalScrollIndicator={false}>
                {addRecipes
                  .filter((r) =>
                    addSearch.trim()
                      ? r.title.toLowerCase().includes(addSearch.toLowerCase())
                      : true
                  )
                  .map((rec) => (
                    <TouchableOpacity
                      key={rec._id}
                      style={styles.recipePickRow}
                      onPress={() => handleAddMealSubmit(rec._id)}
                      disabled={isSubmittingAdd}
                    >
                      <Image source={{ uri: rec.image }} style={styles.recipePickThumb} />
                      <View style={styles.recipePickInfo}>
                        <Text style={styles.recipePickTitle} numberOfLines={1}>
                          {rec.title}
                        </Text>
                        <Text style={styles.recipePickMeta}>
                          {rec.cuisine} • {rec.cookTimeMinutes} min • {rec.calories} kcal
                        </Text>
                      </View>
                      <Text style={styles.recipePickAddBtn}>+ Select</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ======================================================= */}
      {/* PLAN HISTORY MODAL                                      */}
      {/* ======================================================= */}
      <Modal visible={isHistoryOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSheetTitle}>Plan History</Text>
              <TouchableOpacity
                onPress={() => setIsHistoryOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingHistory ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator color="#0D5C3A" />
                <Text style={styles.modalLoadingText}>Loading archived plans...</Text>
              </View>
            ) : planHistory.length === 0 ? (
              <View style={styles.emptyHistoryBox}>
                <Text style={styles.emptyHistoryText}>
                  No archived weekly meal plans found. As you complete weeks, they will appear here.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.historyList}>
                {planHistory.map((hist, idx) => (
                  <View key={hist._id || idx} style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <Text style={styles.historyDate}>
                        Week of {hist.weekStartDate ? new Date(hist.weekStartDate).toLocaleDateString() : `Week ${idx + 1}`}
                      </Text>
                      <Text style={styles.historyCost}>${(hist.estimatedCost || 0).toFixed(2)}</Text>
                    </View>
                    <Text style={styles.historySub}>
                      {hist.dinners?.length || 0} dinners • Household size: {hist.householdSize}
                    </Text>
                    <View style={styles.historyMealsList}>
                      {hist.dinners?.slice(0, 4).map((d) => (
                        <Text key={d.day} style={styles.historyMealItem}>
                          • {d.day}: {d.recipe?.title || 'Dinner'}
                        </Text>
                      ))}
                      {(hist.dinners?.length || 0) > 4 && (
                        <Text style={styles.historyMoreText}>
                          + {(hist.dinners?.length || 0) - 4} more meals
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Instant Swap Modal */}
      {activeSwapSlot && (
        <SwapModal
          visible={!!activeSwapSlot}
          day={activeSwapSlot.day}
          onClose={() => setActiveSwapSlot(null)}
          onConfirmSwap={handleConfirmSwap}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 8,
    marginBottom: 16,
  },
  headerTextContainer: {
    minWidth: 140,
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  aiCustomBtn: {
    backgroundColor: '#E0D4FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  aiCustomBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4C1D95',
  },
  supermarketPill: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  supermarketPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D5C3A',
  },
  budgetProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  groceryCard: {
    backgroundColor: '#9ED034',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  groceryCardLeft: {
    flex: 1,
  },
  groceryCardOverline: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1F2A06',
    letterSpacing: 1,
    opacity: 0.8,
  },
  groceryCardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2A06',
    marginTop: 1,
  },
  groceryCardSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2A06',
    marginTop: 2,
    opacity: 0.85,
  },
  groceryCardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groceryCardIconText: {
    fontSize: 22,
  },
  iconActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActionText: {
    fontSize: 14,
  },
  aiSummaryBanner: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiSummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#581C87',
  },
  aiSummaryClose: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7E22CE',
    padding: 2,
  },
  aiSummaryText: {
    fontSize: 12,
    color: '#6B21A8',
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: '#0D5C3A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  costBox: {
    flex: 1,
  },
  costLabel: {
    color: '#A7F3D0',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  costValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  budgetStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pillUnder: {
    backgroundColor: '#10B981',
  },
  pillOver: {
    backgroundColor: '#EF4444',
  },
  budgetStatusText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  textUnder: {
    color: '#FFFFFF',
  },
  textOver: {
    color: '#FFFFFF',
  },
  householdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 12,
  },
  householdLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  filterScroll: {
    flex: 1,
    minWidth: 0,
  },
  filterScrollContent: {
    alignItems: 'center',
    paddingRight: 4,
  },
  filterPill: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexShrink: 0,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    flexShrink: 0,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addMealButton: {
    backgroundColor: '#9ED034',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexShrink: 0,
  },
  addMealButtonText: {
    color: '#1F2A06',
    fontWeight: '800',
    fontSize: 12,
  },
  dayGroup: {
    marginBottom: 18,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  dayAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D5C3A',
  },
  emptyDayBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  mealCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  mealThumb: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  mealThumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbPlaceholderText: {
    fontSize: 28,
  },
  mealDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  mealMetaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTypeBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mealTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  timeMeta: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  mealSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  cardBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFAF9',
  },
  cookedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  cookedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  cookedLabelChecked: {
    color: '#10B981',
    fontWeight: '700',
  },
  slotServingsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  slotStepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  slotStepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  slotServingsVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 4,
  },
  slotActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swapBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  swapBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Modal Common Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouchable: {
    flex: 1,
  },
  sheetHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  aiModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  aiModalScrollContent: {
    paddingBottom: 8,
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  aiModalTitleRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  aiModalBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiModalSparkle: {
    fontSize: 18,
  },
  aiModalHeaderTextCol: {
    flex: 1,
  },
  aiModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4C1D95',
  },
  aiModalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
    lineHeight: 18,
  },
  presetHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  presetScroll: {
    marginBottom: 14,
  },
  presetScrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B21A8',
  },
  inputContainer: {
    marginBottom: 12,
  },
  aiTextInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    padding: 12,
    fontSize: 13,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 88,
    maxHeight: 130,
    lineHeight: 19,
  },
  charCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  strictNoteText: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
    marginRight: 8,
  },
  charCounterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  charCounterWarning: {
    color: '#D97706',
    fontWeight: '700',
  },
  charCounterLimit: {
    color: '#DC2626',
    fontWeight: '800',
  },
  aiErrorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  aiErrorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  aiErrorIcon: {
    fontSize: 13,
  },
  aiErrorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  aiErrorBody: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2,
    lineHeight: 16,
  },
  upgradeNoticeBtn: {
    marginTop: 6,
  },
  upgradeNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D5C3A',
  },
  aiModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  aiSubmitBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSubmitBtnDisabled: {
    opacity: 0.5,
  },
  aiSubmitBtnSparkle: {
    fontSize: 13,
    marginRight: 4,
  },
  aiSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Add Meal Sheet
  addModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 6,
  },
  daySelectorScroll: {
    marginBottom: 6,
  },
  smallPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
  },
  smallPillActive: {
    backgroundColor: '#0D5C3A',
  },
  smallPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  smallPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  typePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  typePillActive: {
    backgroundColor: '#0D5C3A',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  typePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  recipePickList: {
    maxHeight: 260,
  },
  recipePickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recipePickThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  recipePickInfo: {
    flex: 1,
    marginLeft: 10,
  },
  recipePickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  recipePickMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  recipePickAddBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D5C3A',
    paddingHorizontal: 8,
  },
  modalLoadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  modalLoadingText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },

  // History Sheet
  historyModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  emptyHistoryBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyList: {
    marginTop: 10,
  },
  historyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  historyCost: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  historySub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  historyMealsList: {
    gap: 3,
  },
  historyMealItem: {
    fontSize: 11,
    color: '#4B5563',
  },
  historyMoreText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
