import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlan } from '../../context/PlanContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/common/Button.js';
import { AllergyBanner } from '../../components/common/AllergyBanner.js';
import { Clock, Users, RefreshCw, ArrowLeftRight, Check, X } from 'lucide-react';
import { DayOfWeek, IRecipe } from '../../types/index.js';
import { api } from '../../services/api.js';

export const PlanOverview: React.FC = () => {
  const { plan, shoppingList, isLoading, swapMeal, generatePlan, toggleDinnerCooked } = usePlan();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isSwappingDay, setIsSwappingDay] = useState<DayOfWeek | null>(null);
  const [candidateRecipes, setCandidateRecipes] = useState<IRecipe[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Open Swap Modal
  const handleOpenSwapModal = async (day: DayOfWeek) => {
    setIsSwappingDay(day);
    setLoadingCandidates(true);
    try {
      const res = await api.getRecipes();
      if (res.data) {
        // Exclude recipes currently in the plan
        const currentRecipeIds = plan?.dinners.map((d) => d.recipe?._id) || [];
        const available = res.data.filter((r) => !currentRecipeIds.includes(r._id));
        setCandidateRecipes(available);
      }
    } catch {
      setCandidateRecipes([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleSelectSwap = async (recipeId: string) => {
    if (!isSwappingDay) return;
    try {
      await swapMeal(isSwappingDay, recipeId);
      setIsSwappingDay(null);
    } catch (err: any) {
      alert(err.message || 'Failed to swap meal');
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

  return (
    <div className="space-y-5 animate-fadeIn pb-6">
      {/* Greeting Header */}
      <div>
        <span className="block text-xs font-bold uppercase tracking-widest text-[#9a9a94]">
          Good Afternoon
        </span>
        <h1 className="font-serif text-3xl font-bold text-[#2a2a2a] mt-0.5">
          {user?.name ? `${user.name.split(' ')[0]}!` : 'Chef!'}
        </h1>
      </div>

      {/* Top 2 Cards Row */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Cost vs Budget Card */}
        <div className="bg-white rounded-[22px] p-4 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/5 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a94]">
            Est. Cost
          </span>
          <div className="my-1.5 font-sans">
            <span className="text-2xl font-black text-[#2a2a2a]">{cost.toFixed(2)}</span>
            <span className="text-sm font-bold text-[#9a9a94]"> / {budget}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#9ed034] h-full rounded-full transition-all duration-500"
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

      {/* Dinners List */}
      <div className="space-y-4 pt-1">
        {isLoading && !plan ? (
          <div className="text-center py-12 text-[#6b6b6b]">Loading your weekly meals...</div>
        ) : plan?.dinners && plan.dinners.length > 0 ? (
          plan.dinners.map((slot) => {
            const recipe = slot.recipe;
            if (!recipe) return null;
            const primaryVibe = recipe.vibes?.[0] || 'Family Favs';

            return (
              <div
                key={slot.day}
                className="relative bg-white rounded-[24px] pt-4 p-4 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 transition-all hover:shadow-[0_8px_24px_rgba(42,42,42,0.08)]"
              >
                {/* Attached Day Pill */}
                <div className="absolute -top-3 left-6 bg-white border border-[#2a2a2a]/10 px-3 py-0.5 rounded-full shadow-xs">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6b6b6b]">
                    {slot.day}
                  </span>
                </div>

                <div className="flex gap-4 items-center">
                  {/* Recipe Image Thumbnail */}
                  <Link
                    to={`/app/recipes/${recipe._id}`}
                    className="flex-shrink-0 w-20 h-20 rounded-[18px] overflow-hidden bg-gray-100 shadow-xs"
                  >
                    <img
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

                    {/* Timing & Servings info */}
                    <div className="flex items-center gap-3 text-xs font-semibold text-[#888] mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#888]" />
                        <span>{recipe.cookTimeMinutes}m</span>
                      </span>
                      <span>|</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#888]" />
                        <span>{plan.householdSize}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenSwapModal(slot.day)}
                      className="p-2 text-xs font-bold text-[#6b6b6b] hover:text-[#8bc020] bg-gray-50 hover:bg-[#9ed034]/15 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      title="Swap this meal"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleDinnerCooked(slot.day)}
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
            <p className="text-sm text-[#6b6b6b] mb-4">No meal plan found for this week.</p>
            <Button onClick={generatePlan} isLoading={isLoading}>
              Generate Plan
            </Button>
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
      {isSwappingDay && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#2a2a2a]">
                  Swap Dinner for {isSwappingDay}
                </h3>
                <p className="text-xs text-[#6b6b6b]">Pick an alternative compliant recipe</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSwappingDay(null)}
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
                    <img src={r.image} alt={r.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
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
    </div>
  );
};
