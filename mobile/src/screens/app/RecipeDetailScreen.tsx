import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { IRecipe, DayOfWeek, MealType } from '../../types';
import { mobileApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';
import { Badge } from '../../components/common/Badge';

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const MEAL_TYPES: MealType[] = ['dinner', 'lunch', 'breakfast', 'snack'];

interface RecipeDetailScreenProps {
  recipe: IRecipe;
  onBack: () => void;
}

export const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({
  recipe,
  onBack,
}) => {
  const { user, toggleFavorite } = useAuth();
  const { addMealSlot, swapMeal, plan } = usePlan();

  const isFavorited = user?.favorites?.includes(recipe._id) || false;
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [upvotes, setUpvotes] = useState(recipe.upvotes || 0);
  const [downvotes, setDownvotes] = useState(recipe.downvotes || 0);
  const [userReaction, setUserReaction] = useState<'up' | 'down' | null>(null);
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  // Add / Swap to Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner');
  const [selectedServings, setSelectedServings] = useState<number>(plan?.householdSize || 2);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  const handleVote = async (type: 'up' | 'down') => {
    setUserReaction(type);
    try {
      const res = await mobileApi.submitReaction(recipe._id, type);
      if (res.success) {
        setUpvotes(res.upvotes);
        setDownvotes(res.downvotes);
      }
    } catch (err) {
      console.warn('Reaction error:', err);
    }
  };

  const handleToggleFavorite = async () => {
    setIsTogglingFav(true);
    try {
      await toggleFavorite(recipe._id);
    } catch (err) {
      console.warn('Favorite error:', err);
    } finally {
      setIsTogglingFav(false);
    }
  };

  const toggleIngredientCheck = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleStepCheck = (index: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleAddToPlan = async () => {
    setIsSubmittingPlan(true);
    try {
      await addMealSlot(selectedDay, selectedMealType, recipe._id, selectedServings);
      setIsPlanModalOpen(false);
      Alert.alert('Meal Added', `Added to ${selectedDay} ${selectedMealType}!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add meal to planner');
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const handleSwapIntoPlan = async () => {
    setIsSubmittingPlan(true);
    try {
      await swapMeal(selectedDay, recipe._id);
      setIsPlanModalOpen(false);
      Alert.alert('Meal Swapped', `Swapped ${selectedDay} dinner for ${recipe.title}!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to swap meal');
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
  const baseServings = recipe.servings || 2;
  const scaledServings = Math.round(baseServings * servingsMultiplier);
  const scaledCalories = Math.round(recipe.calories * servingsMultiplier);
  const scaledProtein = Math.round((recipe.proteinGrams || 0) * servingsMultiplier);
  const scaledCarbs = Math.round((recipe.carbsGrams || 0) * servingsMultiplier);
  const scaledFat = Math.round((recipe.fatGrams || 0) * servingsMultiplier);

  return (
    <View style={styles.container}>
      {/* Top Floating Back Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.favButton, isFavorited && styles.favButtonActive]}
          onPress={handleToggleFavorite}
          disabled={isTogglingFav}
        >
          {isTogglingFav ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text style={[styles.favText, isFavorited && styles.favTextActive]}>
              {isFavorited ? '❤️ Saved' : '🤍 Save'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cover Photo */}
        <View style={styles.heroContainer}>
          {recipe.image ? (
            <Image source={{ uri: recipe.image }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.placeholderEmoji}>🍲</Text>
            </View>
          )}
        </View>

        {/* Content Container */}
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <Badge label={recipe.cuisine} variant="neutral" />
            {recipe.vibes?.map((v) => (
              <Badge key={v} label={v} variant="green" />
            ))}
          </View>

          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.description}>{recipe.description}</Text>

          {/* Quick Metrics */}
          <View style={styles.metricsCard}>
            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>⏱️</Text>
              <Text style={styles.metricValue}>{totalTime}m</Text>
              <Text style={styles.metricLabel}>Total Time</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>🔥</Text>
              <Text style={styles.metricValue}>{scaledCalories}</Text>
              <Text style={styles.metricLabel}>Calories</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>🍗</Text>
              <Text style={styles.metricValue}>{scaledProtein}g</Text>
              <Text style={styles.metricLabel}>Protein</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>🥑</Text>
              <Text style={styles.metricValue}>{scaledFat}g</Text>
              <Text style={styles.metricLabel}>Fats</Text>
            </View>
          </View>

          {/* Servings Multiplier Bar */}
          <View style={styles.multiplierBar}>
            <View>
              <Text style={styles.multiplierTitle}>Portion &amp; Servings Scale</Text>
              <Text style={styles.multiplierSub}>
                Scaling dynamically adjusts ingredient quantities
              </Text>
            </View>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  setServingsMultiplier((prev) => Math.max(0.5, prev - 0.5))
                }
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValText}>
                {servingsMultiplier}x ({scaledServings} serv)
              </Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setServingsMultiplier((prev) => prev + 0.5)}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Community Feedback Reactions */}
          <View style={styles.reactionsRow}>
            <Text style={styles.communityText}>Rate this recipe:</Text>
            <View style={styles.voteButtonGroup}>
              <TouchableOpacity
                style={[
                  styles.voteBtn,
                  userReaction === 'up' && styles.voteBtnUpActive,
                ]}
                onPress={() => handleVote('up')}
              >
                <Text style={styles.voteBtnText}>👍 {upvotes}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.voteBtn,
                  userReaction === 'down' && styles.voteBtnDownActive,
                ]}
                onPress={() => handleVote('down')}
              >
                <Text style={styles.voteBtnText}>👎 {downvotes}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Bar: Add or Swap into Meal Plan */}
          <View style={styles.planActionRow}>
            <TouchableOpacity
              style={styles.addToPlanBtn}
              onPress={() => setIsPlanModalOpen(true)}
            >
              <Text style={styles.addToPlanBtnText}>🗓️ Add / Swap into Meal Plan</Text>
            </TouchableOpacity>
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Ingredients ({recipe.ingredients.length})
              </Text>
              <Text style={styles.scaledNoteText}>Scaled for {scaledServings} servings</Text>
            </View>

            <View style={styles.ingredientsBox}>
              {recipe.ingredients.map((ing, idx) => {
                const checked = checkedIngredients[idx];
                const scaledQty =
                  Math.round(ing.quantity * servingsMultiplier * 10) / 10;

                return (
                  <TouchableOpacity
                    key={`${ing.name}_${idx}`}
                    style={[styles.ingredientRow, checked && styles.ingredientChecked]}
                    onPress={() => toggleIngredientCheck(idx)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                      {checked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.ingredientIcon}>{ing.icon || '🥘'}</Text>
                    <Text
                      style={[styles.ingredientName, checked && styles.strikethrough]}
                    >
                      {ing.name}
                    </Text>
                    <Text style={styles.ingredientQty}>
                      {scaledQty} {ing.unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Step-by-Step Instructions</Text>
            <View style={styles.stepsBox}>
              {recipe.instructions.map((step, idx) => {
                const checked = checkedSteps[idx];
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.stepRow, checked && styles.stepRowChecked]}
                    onPress={() => toggleStepCheck(idx)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.stepNumberBadge,
                        checked && styles.stepNumberBadgeChecked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNumberText,
                          checked && styles.stepNumberTextChecked,
                        ]}
                      >
                        {checked ? '✓' : idx + 1}
                      </Text>
                    </View>
                    <Text
                      style={[styles.stepText, checked && styles.stepTextChecked]}
                    >
                      {step}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ==================================================== */}
      {/* ADD / SWAP TO PLAN MODAL                             */}
      {/* ==================================================== */}
      <Modal visible={isPlanModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.planModalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSheetTitle}>Add to Meal Plan</Text>
              <TouchableOpacity
                onPress={() => setIsPlanModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Day Selector */}
            <Text style={styles.fieldLabel}>Day of Week</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {DAYS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.smallPill, selectedDay === d && styles.smallPillActive]}
                  onPress={() => setSelectedDay(d)}
                >
                  <Text
                    style={[
                      styles.smallPillText,
                      selectedDay === d && styles.smallPillTextActive,
                    ]}
                  >
                    {d.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Meal Type Selector */}
            <Text style={styles.fieldLabel}>Meal Type</Text>
            <View style={styles.typeRow}>
              {MEAL_TYPES.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.typePill,
                    selectedMealType === m && styles.typePillActive,
                  ]}
                  onPress={() => setSelectedMealType(m)}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      selectedMealType === m && styles.typePillTextActive,
                    ]}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Servings Stepper */}
            <Text style={styles.fieldLabel}>Servings: {selectedServings}</Text>
            <View style={styles.modalStepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setSelectedServings((prev) => Math.max(1, prev - 1))}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValText}>{selectedServings} persons</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setSelectedServings((prev) => prev + 1)}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Actions: Add as meal or Swap dinner */}
            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.swapDinnerBtn}
                onPress={handleSwapIntoPlan}
                disabled={isSubmittingPlan}
              >
                <Text style={styles.swapDinnerBtnText}>Swap Dinner</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addSlotBtn}
                onPress={handleAddToPlan}
                disabled={isSubmittingPlan}
              >
                {isSubmittingPlan ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.addSlotBtnText}>+ Add as Meal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FAF9F5',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D5C3A',
  },
  favButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  favButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  favText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  favTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  scroll: {
    paddingBottom: 40,
  },
  heroContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#F3F4F6',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  content: {
    padding: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  multiplierBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    marginBottom: 16,
  },
  multiplierTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  multiplierSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  stepperValText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D5C3A',
    paddingHorizontal: 4,
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    marginBottom: 16,
  },
  communityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  voteButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  voteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  voteBtnUpActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#10B981',
  },
  voteBtnDownActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  voteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  planActionRow: {
    marginBottom: 20,
  },
  addToPlanBtn: {
    backgroundColor: '#0D5C3A',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addToPlanBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  scaledNoteText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  ingredientsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    overflow: 'hidden',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ingredientChecked: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  ingredientIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  ingredientName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  ingredientQty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  stepsBox: {
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0ECE4',
  },
  stepRowChecked: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumberBadgeChecked: {
    backgroundColor: '#10B981',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  stepNumberTextChecked: {
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
  stepTextChecked: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  planModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
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
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#6B7280',
    marginTop: 10,
    marginBottom: 6,
  },
  pillScroll: {
    marginBottom: 8,
  },
  smallPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
  typeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  typePill: {
    flex: 1,
    paddingVertical: 8,
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
  modalStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  swapDinnerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0D5C3A',
    alignItems: 'center',
  },
  swapDinnerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D5C3A',
  },
  addSlotBtn: {
    flex: 1,
    backgroundColor: '#0D5C3A',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  addSlotBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
