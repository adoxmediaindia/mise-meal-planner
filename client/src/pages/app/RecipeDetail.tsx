import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { usePlan } from '../../context/PlanContext.js';
import { IRecipe, DayOfWeek } from '../../types/index.js';
import { AllergyBanner } from '../../components/common/AllergyBanner.js';
import { Button } from '../../components/common/Button.js';
import { ArrowLeft, Heart, ThumbsUp, ThumbsDown, CheckCircle, Plus } from 'lucide-react';

export const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, toggleFavoriteInState } = useAuth();
  const { swapMeal, plan } = usePlan();

  const [recipe, setRecipe] = useState<IRecipe | null>(null);
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const isFavorited = user?.favorites?.includes(recipe?._id || '') || false;

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api
      .getRecipeById(id)
      .then((res) => {
        setRecipe(res.data);
      })
      .catch((err) => {
        console.error('Failed to load recipe:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!recipe) return;
    try {
      toggleFavoriteInState(recipe._id);
      await api.toggleFavorite(recipe._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReaction = async (type: 'up' | 'down') => {
    if (!recipe) return;
    setReaction(type);
    try {
      await api.submitReaction(recipe._id, type);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwapIntoDay = async (day: DayOfWeek) => {
    if (!recipe) return;
    try {
      await swapMeal(day, recipe._id);
      setShowDaySelector(false);
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add recipe to plan');
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-[#6b6b6b]">Loading recipe details...</div>;
  }

  if (!recipe) {
    return (
      <div className="text-center py-20 text-[#6b6b6b]">
        <p className="mb-4">Recipe not found.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const baseServings = recipe.servings || 2;
  const currentServings = baseServings * servingsMultiplier;

  return (
    <div className="animate-fadeIn pb-10 -mx-5 sm:-mx-6 -mt-2">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-[#1f2a06] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-[#9ed034]" />
          <span>Swapped into your weekly meal plan!</span>
        </div>
      )}

      {/* Hero Banner with floating buttons & title overlay */}
      <div className="relative w-full h-[320px] sm:h-[360px] overflow-hidden rounded-b-[36px] bg-gray-900 shadow-md">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover opacity-90"
        />
        {/* Gradient dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

        {/* Floating Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-[#2a2a2a] flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleToggleFavorite}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
            aria-label="Toggle Favorite"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-[#2a2a2a]'
              }`}
            />
          </button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-10">
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-white leading-tight drop-shadow-md">
            {recipe.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
              {recipe.cuisine}
            </span>
            {recipe.vibes?.[0] && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#9ed034] text-[#1f2a06]">
                {recipe.vibes[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-6 mt-4 space-y-6">
        {/* Floating Summary Card (2 Rows) matching reference */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6">
          {/* Row 1: Kcal, Time, Servings */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 pb-3.5 border-b border-gray-100 text-center">
            <div>
              <div className="font-sans font-black text-xl text-[#2a2a2a]">
                {Math.round(recipe.calories * servingsMultiplier)}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9a9a94]">
                kcal
              </div>
            </div>
            <div>
              <div className="font-sans font-black text-xl text-[#2a2a2a]">
                {recipe.cookTimeMinutes}m
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9a9a94]">
                Time
              </div>
            </div>
            <div>
              <div className="font-sans font-black text-xl text-[#2a2a2a]">
                {currentServings}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9a9a94]">
                Serves
              </div>
            </div>
          </div>

          {/* Row 2: Carbs, Protein, Fat */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 pt-3.5 text-center">
            <div>
              <div className="font-sans font-black text-lg text-[#2a2a2a]">
                {Math.round(recipe.carbsGrams * servingsMultiplier)}g
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9a9a94]">
                Carbs
              </div>
            </div>
            <div>
              <div className="font-sans font-black text-lg text-[#2a2a2a]">
                {Math.round(recipe.proteinGrams * servingsMultiplier)}g
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9a9a94]">
                Protein
              </div>
            </div>
            <div>
              <div className="font-sans font-black text-lg text-[#2a2a2a]">
                {Math.round(recipe.fatGrams * servingsMultiplier)}g
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9a9a94]">
                Fat
              </div>
            </div>
          </div>
        </div>

        {/* Reaction Buttons */}
        <div className="flex justify-center items-center gap-6 py-1">
          <button
            type="button"
            onClick={() => handleReaction('up')}
            className={`p-3 rounded-full border transition-all cursor-pointer ${
              reaction === 'up'
                ? 'bg-[#9ed034]/20 border-[#9ed034] text-[#8bc020] scale-110'
                : 'bg-white border-gray-200 text-gray-400 hover:text-gray-700'
            }`}
            title="I liked this meal"
          >
            <ThumbsUp className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleReaction('down')}
            className={`p-3 rounded-full border transition-all cursor-pointer ${
              reaction === 'down'
                ? 'bg-red-50 border-red-300 text-red-500 scale-110'
                : 'bg-white border-gray-200 text-gray-400 hover:text-gray-700'
            }`}
            title="Not for me"
          >
            <ThumbsDown className="w-5 h-5" />
          </button>
        </div>

        {/* Mandatory Allergy Notice */}
        <AllergyBanner compact={true} />

        {/* Action: Add to Plan Button */}
        <div>
          {!showDaySelector ? (
            <Button
              onClick={() => setShowDaySelector(true)}
              className="w-full"
              icon={<Plus className="w-4 h-4" />}
            >
              Swap Into Weekly Plan
            </Button>
          ) : (
            <div className="bg-white p-4 rounded-2xl border border-[#9ed034] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2a2a2a]">
                  Choose day to replace:
                </span>
                <button
                  type="button"
                  onClick={() => setShowDaySelector(false)}
                  className="text-xs font-semibold text-gray-400"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {plan?.dinners?.map((slot) => (
                  <button
                    key={slot.day}
                    type="button"
                    onClick={() => handleSwapIntoDay(slot.day)}
                    className="p-2 text-xs font-bold rounded-xl border border-gray-200 hover:border-[#9ed034] hover:bg-[#9ed034]/20 text-[#2a2a2a] transition-all"
                  >
                    {slot.day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ingredients Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-black text-xl text-[#2a2a2a]">Ingredients</h3>
            <div className="flex items-center gap-1.5 text-xs text-[#888]">
              <span>Scale:</span>
              <button
                type="button"
                onClick={() => setServingsMultiplier(Math.max(0.5, servingsMultiplier - 0.5))}
                className="w-6 h-6 rounded bg-gray-100 font-bold hover:bg-gray-200"
              >
                -
              </button>
              <span className="font-bold text-[#2a2a2a] px-1">{servingsMultiplier}x</span>
              <button
                type="button"
                onClick={() => setServingsMultiplier(servingsMultiplier + 0.5)}
                className="w-6 h-6 rounded bg-gray-100 font-bold hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[24px] divide-y divide-gray-100 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 overflow-hidden">
            {recipe.ingredients.map((ing, idx) => {
              const scaledQty = Math.round(ing.quantity * servingsMultiplier * 10) / 10;
              return (
                <div key={idx} className="flex items-center justify-between p-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{ing.icon || '🥘'}</span>
                    <span className="font-sans font-bold text-sm text-[#2a2a2a]">
                      {ing.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#6b6b6b]">
                    {scaledQty} {ing.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cooking Instructions Section */}
        <div className="space-y-3">
          <h3 className="font-serif font-black text-xl text-[#2a2a2a]">Instructions</h3>
          <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-4">
            {recipe.instructions.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3.5">
                <span className="w-6 h-6 rounded-full bg-[#9ed034] text-[#1f2a06] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-sm text-[#444] leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
