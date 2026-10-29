import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlan } from '../../context/PlanContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/common/Button.js';
import { AllergyBanner } from '../../components/common/AllergyBanner.js';
import { RecipeImage } from '../../components/common/RecipeImage.js';
import {
  Clock,
  Users,
  RefreshCw,
  ArrowLeftRight,
  Check,
  X,
  Plus,
  Trash2,
  Calendar,
  History,
  Archive,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { DayOfWeek, IRecipe, MealType, IMealSlot } from '../../types/index.js';
import { api } from '../../services/api.js';

export const PlanOverview: React.FC = () => {
  const {
    plan,
    shoppingList,
    preferences,
    planHistory,
    isLoading,
    swapMeal,
    addMealSlot,
    removeMealSlot,
    editMealSlot,
    updateHouseholdSize,
    archivePlan,
    fetchPlanHistory,
    generatePlan,
    toggleDinnerCooked,
    customizePlanWithIntent,
  } = usePlan();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeMealTypeFilter, setActiveMealTypeFilter] = useState<MealType | 'all'>('all');
  const [isSwappingSlot, setIsSwappingSlot] = useState<{ day: DayOfWeek; slotId?: string } | null>(null);
  const [candidateRecipes, setCandidateRecipes] = useState<IRecipe[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // AI Plan Intent State
  const [isAiCustomizeOpen, setIsAiCustomizeOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSubmittingAiPrompt, setIsSubmittingAiPrompt] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isUpgradeRequired, setIsUpgradeRequired] = useState(false);

  const handleAiCustomizeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim() || aiPrompt.trim().length < 5) {
      setAiError('Please enter at least 5 characters describing your weekly plan preferences.');
      return;
    }
    setAiError(null);
    setIsUpgradeRequired(false);
    setIsSubmittingAiPrompt(true);
    try {
      const res = await customizePlanWithIntent(aiPrompt.trim());
      setAiSummary(res?.summary || 'Plan updated with your preferences!');
      setAiPrompt('');
    } catch (err: any) {
      if (err.status === 403 || err.response?.data?.code === 'UPGRADE_REQUIRED') {
        setIsUpgradeRequired(true);
        setAiError(err.response?.data?.error || 'Weekly AI generation quota reached. Upgrade to Pro for 50 AI queries/week.');
      } else {
        setAiError(err.message || 'Failed to customize plan with AI.');
      }
    } finally {
      setIsSubmittingAiPrompt(false);
    }
  };

  // Add Meal Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addDay, setAddDay] = useState<DayOfWeek>('Monday');
  const [addMealType, setAddMealType] = useState<MealType>('dinner');
  const [addServings, setAddServings] = useState<number>(plan?.householdSize || 2);
  const [addSearch, setAddSearch] = useState('');
  const [addRecipes, setAddRecipes] = useState<IRecipe[]>([]);
  const [loadingAddRecipes, setLoadingAddRecipes] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Helper to filter recipes matching active dietary and allergen exclusions
  const filterSafeRecipes = (recipes: IRecipe[]): IRecipe[] => {
    return recipes.filter((r) => {
      if (preferences?.allergies && preferences.allergies.length > 0) {
        if (r.allergens && r.allergens.some((a) => preferences.allergies.includes(a as any))) {
          return false;
        }
      }
      if (preferences?.dietaryNeeds && preferences.dietaryNeeds.length > 0) {
        const active = preferences.dietaryNeeds.filter((d) => d !== 'None');
        if (active.includes('Vegan')) {
          if (!r.dietaryTags?.includes('Vegan')) return false;
        } else if (active.includes('Vegetarian')) {
          if (!r.dietaryTags?.includes('Vegetarian') && !r.dietaryTags?.includes('Vegan')) return false;
        } else if (active.includes('Pescatarian')) {
          if (!r.dietaryTags?.includes('Pescatarian') && !r.dietaryTags?.includes('Vegetarian') && !r.dietaryTags?.includes('Vegan')) return false;
        }
      }
      return true;
    });
  };

  // Open Swap Modal
  const handleOpenSwapModal = async (day: DayOfWeek, slotId?: string) => {
    setIsSwappingSlot({ day, slotId });
    setLoadingCandidates(true);
    try {
      const res = await api.getRecipes();
      if (res.data) {
        // Exclude recipes currently in the plan and unsafe recipes
        const currentRecipeIds = (plan?.meals && plan.meals.length > 0
          ? plan.meals.map((m) => m.recipe?._id)
          : plan?.dinners.map((d) => d.recipe?._id)) || [];
        const safe = filterSafeRecipes(res.data);
        const available = safe.filter((r) => !currentRecipeIds.includes(r._id));
        setCandidateRecipes(available.length > 0 ? available : safe);
      }
    } catch {
      setCandidateRecipes([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleSelectSwap = async (recipeId: string) => {
    if (!isSwappingSlot) return;
    try {
      if (isSwappingSlot.slotId) {
        await editMealSlot(isSwappingSlot.slotId, { recipeId });
      } else {
        await swapMeal(isSwappingSlot.day, recipeId);
      }
      setIsSwappingSlot(null);
    } catch (err: any) {
      alert(err.message || 'Failed to swap meal');
    }
  };

  // Open Add Meal Modal
  const handleOpenAddModal = async (defaultDay?: DayOfWeek) => {
    if (defaultDay) setAddDay(defaultDay);
    setAddServings(plan?.householdSize || 2);
    setAddError(null);
    setIsAddModalOpen(true);
    setLoadingAddRecipes(true);
    try {
      const res = await api.getRecipes();
      const safe = filterSafeRecipes(res.data || []);
      setAddRecipes(safe);
    } catch {
      setAddRecipes([]);
    } finally {
      setLoadingAddRecipes(false);
    }
  };

  const handleAddMealSubmit = async (recipeId: string) => {
    setAddError(null);
    try {
      await addMealSlot(addDay, addMealType, recipeId, addServings);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add meal to planner');
    }
  };

  const handleOpenHistory = async () => {
    setIsHistoryOpen(true);
    await fetchPlanHistory();
  };

  const handleArchiveWeek = async () => {
    if (!confirm('Archive current week and start fresh with a new meal plan?')) return;
    try {
      await archivePlan();
    } catch (err: any) {
      alert(err.message || 'Failed to archive plan');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("Regenerate this week's meal plan? Your shopping list will update automatically.")) return;
    setIsRegenerating(true);
    try {
      await generatePlan();
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate plan');
    } finally {
      setIsRegenerating(false);
    }
  };

  const cost = plan?.estimatedCost || 0;
  const budget = plan?.budgetLimit || 40;
  const costPercentage = Math.min(100, Math.round((cost / budget) * 100));

  const itemsBought = shoppingList?.itemsBoughtCount || 0;
  const totalItems = shoppingList?.totalItemsCount || 0;

  // Meal vibe pill colors matching reference design
  const getVibeChipStyle = (vibe?: string) => {
    switch (vibe) {
      case 'Speedy Meals':
        return 'bg-[#E0D4FF] text-[#3c2a68]';
      case 'Low Calorie':
        return 'bg-[#7DD3FC] text-[#0f3a52]';
      case 'Family Favs':
        return 'bg-[#FFE0BC] text-[#5c3710]';
      case 'Healthy Comfort':
        return 'bg-[#9BD88F] text-[#1b4412]';
      case 'Protein Packed':
        return 'bg-[#FFA8BC] text-[#541221]';
      case 'Fakeaway':
        return 'bg-[#FF9F68] text-[#541d04]';
      case 'Gut Friendly':
        return 'bg-[#5EEAD4] text-[#0b423a]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMealTypeBadge = (mealType?: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'lunch':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'snack':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  // Prepare list of display slots (using meals array if populated, falling back to dinners)
  const displaySlots = (plan?.meals && plan.meals.length > 0)
    ? plan.meals.filter((m) => activeMealTypeFilter === 'all' || m.mealType === activeMealTypeFilter)
    : (plan?.dinners || []).map((d, i) => ({
        id: `dinner_${i}_${d.day}`,
        day: d.day,
        mealType: 'dinner' as MealType,
        recipe: d.recipe,
        servings: plan?.householdSize || 2,
        isCooked: d.isCooked,
      })).filter(() => activeMealTypeFilter === 'all' || activeMealTypeFilter === 'dinner');

  const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-5 animate-fadeIn pb-6">
      {/* Greeting Header & History CTA */}
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-xs font-bold uppercase tracking-widest text-[#9a9a94]">
            Weekly Smart Planner
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#2a2a2a] mt-0.5">
            {user?.name ? `${user.name.split(' ')[0]}!` : 'Chef!'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAiCustomizeOpen(!isAiCustomizeOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E0D4FF] border border-[#cfbefb] text-xs font-bold text-[#3c2a68] hover:bg-[#d6c5fe] shadow-xs transition-all cursor-pointer"
            title="Tailor weekly plan with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#633bba]" />
            <span>AI Customize</span>
          </button>

          <button
            type="button"
            onClick={handleOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-[#6b6b6b] hover:text-[#2a2a2a] shadow-xs hover:border-[#8bc020] transition-all cursor-pointer"
            title="View previous weeks"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>

          <button
            type="button"
            onClick={handleArchiveWeek}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-[#6b6b6b] hover:text-[#2a2a2a] shadow-xs hover:border-[#8bc020] transition-all cursor-pointer"
            title="Archive current week & start new"
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Week</span>
          </button>
        </div>
      </div>

      {/* AI Customize Banner */}
      {isAiCustomizeOpen && (
        <div className="bg-gradient-to-r from-[#FAF5FF] to-[#F3E8FF] border border-[#E9D5FF] rounded-[22px] p-5 shadow-sm space-y-3.5 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#9333EA] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#4A154B]">Tailor Week with Chef Mise AI</h3>
                <p className="text-xs text-[#6B21A8]">Describe your week in plain English. We'll pick safe catalog recipes and update your shopping list.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAiCustomizeOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-gray-500 self-center">Try:</span>
            {[
              'High protein Mediterranean week',
              'Quick 20-min weeknights',
              'Healthy comfort food and fakeaway',
              'Light dinners and low calorie',
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAiPrompt(preset)}
                className="px-2.5 py-1 text-xs rounded-full bg-white/80 hover:bg-white text-[#581C87] border border-[#E9D5FF] font-medium transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          <form onSubmit={handleAiCustomizeSubmit} className="space-y-3">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g., High protein Mediterranean meals Monday to Wednesday, and quick comfort meals for the rest of the week..."
              rows={2}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-[#D8B4FE] focus:ring-2 focus:ring-[#9333EA] focus:outline-hidden bg-white resize-none"
              disabled={isSubmittingAiPrompt}
            />

            {aiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">Unable to customize with AI</p>
                  <p>{aiError}</p>
                  {isUpgradeRequired && (
                    <Link
                      to="/app/account"
                      className="inline-block mt-2 font-bold text-[#8bc020] hover:underline"
                    >
                      Upgrade to Mise Pro for 50 AI queries / week &rarr;
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-500 font-medium">
                Strict allergy & dietary filters always apply.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAiCustomizeOpen(false)}
                  disabled={isSubmittingAiPrompt}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#9333EA] hover:bg-[#7E22CE] text-white"
                  isLoading={isSubmittingAiPrompt}
                  disabled={!aiPrompt.trim()}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  {isSubmittingAiPrompt ? 'Crafting Plan...' : 'Generate with AI'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* AI Interpretation Success Banner */}
      {aiSummary && (
        <div className="p-4 bg-[#F5F3FF] border border-[#DDD6FE] rounded-[18px] text-xs text-[#5B21B6] flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0" />
            <span><strong className="font-bold">Chef Mise AI:</strong> {aiSummary}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiSummary(null)}
            className="text-[#7C3AED] hover:text-[#5B21B6] p-1 font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Cards Row: Est Cost + Grocery List */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Cost vs Budget Card */}
        <div className="bg-white rounded-[22px] p-4 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a94]">
              Est. Cost
            </span>
            {/* Household size stepper */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-0.5 text-xs font-bold">
              <span className="text-[#888] text-[10px]">Family:</span>
              <button
                type="button"
                onClick={() => updateHouseholdSize(Math.max(1, (plan?.householdSize || 2) - 1))}
                className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-black cursor-pointer"
              >
                -
              </button>
              <span className="text-[#2a2a2a] font-black">{plan?.householdSize || 2}</span>
              <button
                type="button"
                onClick={() => updateHouseholdSize(Math.min(12, (plan?.householdSize || 2) + 1))}
                className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-black cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
          <div className="my-1.5 font-sans">
            <span className="text-2xl font-black text-[#2a2a2a]">${cost.toFixed(2)}</span>
            <span className="text-sm font-bold text-[#9a9a94]"> / ${budget}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cost > budget ? 'bg-amber-500' : 'bg-[#9ed034]'
              }`}
              style={{ width: `${costPercentage}%` }}
            />
          </div>
        </div>

        {/* Grocery List Shortcut Card */}
        <Link
          to="/app/grocery-list"
          className="bg-[#ddf4ff] rounded-[22px] p-4 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#7dd3fc]/30 flex flex-col justify-between hover:bg-[#d0f0ff] transition-all cursor-pointer select-none group"
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0284c7]">
            Tap to view
          </span>
          <div>
            <h4 className="font-sans font-black text-lg text-[#0f3a52] leading-tight group-hover:text-[#0369a1] transition-colors">
              Grocery list
            </h4>
            <p className="text-xs font-bold text-[#0284c7] mt-0.5">
              {itemsBought}/{totalItems} items bought
            </p>
          </div>
        </Link>
      </div>

      {/* Pantry Inventory Shortcut Banner */}
      <div className="bg-white rounded-[20px] p-3 px-4 shadow-[0_2px_12px_rgba(42,42,42,0.04)] border border-[#2a2a2a]/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#9ed034]/20 flex items-center justify-center text-base">
            🥫
          </div>
          <div>
            <div className="text-xs font-bold text-[#2a2a2a]">Kitchen Pantry</div>
            <div className="text-[11px] text-[#6b6b6b]">Track inventory, expiry dates &amp; cook with what you have</div>
          </div>
        </div>
        <Link
          to="/app/pantry"
          className="text-xs font-bold text-[#1f2a06] bg-[#9ed034]/30 hover:bg-[#9ed034]/50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
        >
          <span>Pantry</span>
          <span>→</span>
        </Link>
      </div>

      {/* Filter Bar: Meal Types & Add Meal Button */}
      <div className="flex items-center justify-between gap-2 pt-1 overflow-x-auto pb-1 [scrollbar-width:none]">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-gray-200 shadow-xs">
          {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveMealTypeFilter(type)}
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                activeMealTypeFilter === type
                  ? 'bg-[#9ed034] text-[#1f2a06] shadow-xs'
                  : 'text-[#6b6b6b] hover:text-[#2a2a2a]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddModal()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1f2a06] text-white text-xs font-bold hover:bg-[#2e3e09] transition-all shadow-xs cursor-pointer flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Meal</span>
        </button>
      </div>

      {/* Meals List */}
      <div className="space-y-4 pt-1">
        {isLoading && !plan ? (
          <div className="text-center py-12 text-[#6b6b6b]">Loading your weekly meals...</div>
        ) : displaySlots.length > 0 ? (
          displaySlots.map((slot) => {
            const recipe = slot.recipe;
            if (!recipe) return null;
            const primaryVibe = recipe.vibes?.[0] || 'Family Favs';

            return (
              <div
                key={slot.id}
                className="relative bg-white rounded-[24px] pt-4 p-4 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 transition-all hover:shadow-[0_8px_24px_rgba(42,42,42,0.08)]"
              >
                {/* Attached Day & MealType Pill */}
                <div className="absolute -top-3 left-6 flex items-center gap-1.5">
                  <span className="bg-white border border-[#2a2a2a]/10 px-3 py-0.5 rounded-full shadow-xs text-[11px] font-extrabold uppercase tracking-wider text-[#6b6b6b]">
                    {slot.day}
                  </span>
                  <span
                    className={`border px-2.5 py-0.5 rounded-full shadow-xs text-[10px] font-extrabold uppercase tracking-wider ${getMealTypeBadge(
                      slot.mealType
                    )}`}
                  >
                    {slot.mealType}
                  </span>
                </div>

                <div className="flex gap-4 items-center">
                  {/* Recipe Image Thumbnail */}
                  <Link
                    to={`/app/recipes/${recipe._id}`}
                    className="flex-shrink-0 w-20 h-20 rounded-[18px] overflow-hidden bg-gray-100 shadow-xs"
                  >
                    <RecipeImage
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>

                  {/* Recipe Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/app/recipes/${recipe._id}`}
                      className="block font-sans font-black text-base text-[#2a2a2a] truncate hover:text-[#8bc020] transition-colors"
                    >
                      {recipe.title}
                    </Link>

                    {/* Vibe Chip */}
                    <div className="mt-1">
                      <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getVibeChipStyle(
                          primaryVibe
                        )}`}
                      >
                        {primaryVibe}
                      </span>
                    </div>

                    {/* Timing & Servings Stepper */}
                    <div className="flex items-center gap-3 text-xs font-semibold text-[#888] mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#888]" />
                        <span>{recipe.cookTimeMinutes}m</span>
                      </span>
                      <span>|</span>
                      {/* Per-slot serving size stepper */}
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#888]" />
                        <span className="font-bold text-[#2a2a2a]">{slot.servings || plan?.householdSize || 2}</span>
                        <div className="inline-flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() =>
                              editMealSlot(slot.id, {
                                servings: Math.max(1, (slot.servings || 2) - 1),
                              })
                            }
                            className="w-4 h-4 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-[10px] cursor-pointer"
                            title="Decrease servings"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              editMealSlot(slot.id, {
                                servings: Math.min(12, (slot.servings || 2) + 1),
                              })
                            }
                            className="w-4 h-4 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-[10px] cursor-pointer"
                            title="Increase servings"
                          >
                            +
                          </button>
                        </div>
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {/* Swap button */}
                      <button
                        type="button"
                        onClick={() => handleOpenSwapModal(slot.day, slot.id)}
                        className="p-1.5 text-xs font-bold text-[#6b6b6b] hover:text-[#8bc020] bg-gray-50 hover:bg-[#9ed034]/15 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        title="Swap this meal"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove button (only if more than 1 meal slot in meals) */}
                      {plan?.meals && plan.meals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove "${recipe.title}" from ${slot.day}?`)) {
                              removeMealSlot(slot.id);
                            }
                          }}
                          className="p-1.5 text-xs font-bold text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title="Remove from plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Cooked Checkbox */}
                    <button
                      type="button"
                      onClick={() => {
                        if (plan?.meals && plan.meals.length > 0) {
                          editMealSlot(slot.id, { isCooked: !slot.isCooked });
                        } else {
                          toggleDinnerCooked(slot.day);
                        }
                      }}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                        slot.isCooked
                          ? 'bg-[#9ed034] border-[#9ed034] text-[#1f2a06]'
                          : 'border-gray-300 text-transparent hover:border-gray-400'
                      }`}
                      title={slot.isCooked ? 'Marked as cooked' : 'Mark as cooked'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-[24px] p-8 text-center border border-[#2a2a2a]/6">
            <p className="text-sm text-[#6b6b6b] mb-4">
              {activeMealTypeFilter === 'all'
                ? 'No meal plan found for this week.'
                : `No ${activeMealTypeFilter} meals planned for this week.`}
            </p>
            {activeMealTypeFilter === 'all' ? (
              <Button onClick={generatePlan} isLoading={isLoading}>
                Generate Plan
              </Button>
            ) : (
              <Button onClick={() => handleOpenAddModal()}>
                Add a {activeMealTypeFilter}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Regenerate Plan Bar */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isRegenerating || isLoading}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6b6b6b] hover:text-[#2a2a2a] p-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>Regenerate entire weekly plan</span>
        </button>
      </div>

      <AllergyBanner compact={true} />

      {/* MEAL SWAP MODAL */}
      {isSwappingSlot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#2a2a2a]">
                  Swap Meal for {isSwappingSlot.day}
                </h3>
                <p className="text-xs text-[#6b6b6b]">Pick an alternative compliant recipe</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSwappingSlot(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {loadingCandidates ? (
                <div className="text-center py-8 text-sm text-[#888]">Finding alternative meals...</div>
              ) : candidateRecipes.length > 0 ? (
                candidateRecipes.map((r) => (
                  <div
                    key={r._id}
                    onClick={() => handleSelectSwap(r._id)}
                    className="flex items-center gap-3.5 p-3 rounded-2xl border border-gray-100 hover:border-[#9ed034] hover:bg-[#9ed034]/10 cursor-pointer transition-all"
                  >
                    <RecipeImage src={r.image} alt={r.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans font-bold text-sm text-[#2a2a2a] truncate">{r.title}</h4>
                      <p className="text-xs text-[#888]">{r.cuisine} • {r.cookTimeMinutes} mins • {r.calories} kcal</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Select
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-[#888]">No other matching recipes available.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD MEAL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#2a2a2a]">Add Meal to Plan</h3>
                <p className="text-xs text-[#6b6b6b]">Select slot details and pick a recipe</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Config selectors */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#6b6b6b] mb-1">
                    Day
                  </label>
                  <select
                    value={addDay}
                    onChange={(e) => setAddDay(e.target.value as DayOfWeek)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-semibold"
                  >
                    {daysOfWeek.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#6b6b6b] mb-1">
                    Meal Type
                  </label>
                  <select
                    value={addMealType}
                    onChange={(e) => setAddMealType(e.target.value as MealType)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-semibold capitalize"
                  >
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[#6b6b6b] mb-1">
                    Servings
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={addServings}
                    onChange={(e) => setAddServings(parseInt(e.target.value, 10) || 2)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Recipe Search */}
              <input
                type="text"
                placeholder="Search recipe..."
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs"
              />
            </div>

            {/* Recipe Results */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {loadingAddRecipes ? (
                <div className="text-center py-8 text-sm text-[#888]">Loading recipes...</div>
              ) : (
                addRecipes
                  .filter((r) => !addSearch || r.title.toLowerCase().includes(addSearch.toLowerCase()))
                  .map((r) => (
                    <div
                      key={r._id}
                      onClick={() => handleAddMealSubmit(r._id)}
                      className="flex items-center gap-3 p-2.5 rounded-2xl border border-gray-100 hover:border-[#9ed034] hover:bg-[#9ed034]/10 cursor-pointer transition-all"
                    >
                      <RecipeImage src={r.image} alt={r.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans font-bold text-xs text-[#2a2a2a] truncate">{r.title}</h4>
                        <p className="text-[11px] text-[#888]">
                          {r.cuisine} • {r.cookTimeMinutes}m • {r.calories} kcal
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Add
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PLAN HISTORY MODAL */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#2a2a2a]">Meal Plan History</h3>
                <p className="text-xs text-[#6b6b6b]">Previous weekly meal plans</p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {planHistory.length > 0 ? (
                planHistory.map((hPlan, idx) => (
                  <div
                    key={hPlan._id || idx}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#2a2a2a]">
                        <Calendar className="w-3.5 h-3.5 text-[#8bc020]" />
                        <span>Week of {new Date(hPlan.weekStartDate).toLocaleDateString()}</span>
                      </div>
                      <span className="text-xs font-black text-[#2a2a2a]">
                        ${hPlan.estimatedCost.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-[#6b6b6b]">
                      Family of {hPlan.householdSize} •{' '}
                      {(hPlan.meals && hPlan.meals.length > 0 ? hPlan.meals.length : hPlan.dinners?.length) || 0}{' '}
                      meals planned
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-[#888]">No archived meal plans yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
