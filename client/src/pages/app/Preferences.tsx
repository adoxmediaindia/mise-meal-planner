import React, { useState, useEffect } from 'react';
import { usePlan } from '../../context/PlanContext.js';
import { Button } from '../../components/common/Button.js';
import { AllergyBanner } from '../../components/common/AllergyBanner.js';
import { Supermarket, DayOfWeek, DietaryNeed, Allergen, KitchenEquipment, MealVibe } from '../../types/index.js';
import { Check, Sparkles, ChevronDown } from 'lucide-react';

export const Preferences: React.FC = () => {
  const { preferences, updatePreferences } = usePlan();

  const [supermarket, setSupermarket] = useState<Supermarket>('Aldi');
  const [householdSize, setHouseholdSize] = useState(2);
  const [cookingDays, setCookingDays] = useState<DayOfWeek[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [weeklyBudget, setWeeklyBudget] = useState(40);
  const [dietaryNeeds, setDietaryNeeds] = useState<DietaryNeed[]>(['None']);
  const [allergies, setAllergies] = useState<Allergen[]>([]);
  const [equipment, setEquipment] = useState<KitchenEquipment[]>(['Hob Only', 'Oven']);
  const [vibes, setVibes] = useState<MealVibe[]>(['Speedy Meals', 'Family Favs']);
  const [maxCookTimeMinutes, setMaxCookTimeMinutes] = useState<number>(60);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (preferences) {
      setSupermarket(preferences.supermarket || 'Aldi');
      setHouseholdSize(preferences.householdSize || 2);
      setCookingDays(preferences.cookingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
      setWeeklyBudget(preferences.weeklyBudget || 40);
      setDietaryNeeds(preferences.dietaryNeeds || ['None']);
      setAllergies(preferences.allergies || []);
      setEquipment(preferences.equipment || ['Hob Only', 'Oven']);
      setVibes(preferences.vibes || ['Speedy Meals', 'Family Favs']);
      setMaxCookTimeMinutes(preferences.maxCookTimeMinutes || 60);
    }
  }, [preferences]);

  const supermarkets: Supermarket[] = [
    'Aldi',
    'Walmart',
    'Kroger',
    'Costco',
    'Publix',
    'Safeway',
    'Whole Foods',
    "Trader Joe's",
    'H-E-B',
    'Sprouts',
  ];

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const allVibes: { name: MealVibe; emoji: string }[] = [
    { name: 'Speedy Meals', emoji: '⚡' },
    { name: 'Low Calorie', emoji: '⚖️' },
    { name: 'Family Favs', emoji: '👨‍👩‍👧' },
    { name: 'Healthy Comfort', emoji: '🥗' },
    { name: 'Fakeaway', emoji: '🍔' },
    { name: 'Gut Friendly', emoji: '💚' },
    { name: 'Protein Packed', emoji: '💪' },
    { name: 'British Staples', emoji: '🇬🇧' },
  ];

  const allAllergens: Allergen[] = ['Gluten', 'Dairy', 'Peanuts', 'Tree Nuts', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Sesame'];

  const toggleDay = (d: DayOfWeek) => {
    if (cookingDays.includes(d)) {
      if (cookingDays.length > 1) setCookingDays(cookingDays.filter((item) => item !== d));
    } else {
      setCookingDays([...cookingDays, d]);
    }
  };

  const toggleDiet = (diet: DietaryNeed) => {
    if (diet === 'None') {
      setDietaryNeeds(['None']);
    } else {
      const filtered = dietaryNeeds.filter((d) => d !== 'None');
      if (filtered.includes(diet)) {
        const next = filtered.filter((d) => d !== diet);
        setDietaryNeeds(next.length === 0 ? ['None'] : next);
      } else {
        setDietaryNeeds([...filtered, diet]);
      }
    }
  };

  const toggleAllergen = (alg: Allergen) => {
    if (allergies.includes(alg)) {
      setAllergies(allergies.filter((a) => a !== alg));
    } else {
      setAllergies([...allergies, alg]);
    }
  };

  const toggleVibe = (vibe: MealVibe) => {
    if (vibes.includes(vibe)) {
      setVibes(vibes.filter((v) => v !== vibe));
    } else {
      if (vibes.length < 3) {
        setVibes([...vibes, vibe]);
      }
    }
  };

  const handleSave = async (autoRegenerate = false) => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updatePreferences(
        {
          supermarket,
          householdSize,
          cookingDays,
          weeklyBudget,
          dietaryNeeds,
          allergies,
          equipment,
          vibes,
          maxCookTimeMinutes,
        },
        autoRegenerate
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-14">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#9a9a94]">
          Your Plan
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#2a2a2a] mt-0.5">
          preferences
        </h1>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-[#9ed034]/20 border border-[#9ed034] rounded-xl text-xs font-bold text-[#1f2a06] flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-[#8bc020]" />
          <span>Preferences updated and plan synchronized!</span>
        </div>
      )}

      {/* Supermarket selector */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-2">
        <label className="block font-sans font-black text-base text-[#2a2a2a]">
          Supermarket
        </label>
        <div className="relative">
          <select
            value={supermarket}
            onChange={(e) => setSupermarket(e.target.value as Supermarket)}
            className="w-full appearance-none bg-[#fafaf8] border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] cursor-pointer"
          >
            {supermarkets.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#6b6b6b] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Household size stepper */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3">
        <div>
          <label className="block font-sans font-black text-base text-[#2a2a2a]">
            Household size
          </label>
          <p className="text-xs text-[#6b6b6b]">How many are you cooking for?</p>
        </div>

        <div className="flex items-center justify-center gap-6 py-2">
          <button
            type="button"
            onClick={() => setHouseholdSize(Math.max(1, householdSize - 1))}
            disabled={householdSize <= 1}
            className="w-11 h-11 rounded-full bg-gray-100 font-bold text-xl flex items-center justify-center text-[#2a2a2a] disabled:opacity-30 cursor-pointer"
          >
            -
          </button>
          <div className="text-center min-w-[60px]">
            <span className="font-sans font-black text-3xl text-[#2a2a2a]">{householdSize}</span>
            <div className="text-[11px] text-[#888] font-semibold">
              {householdSize === 1 ? 'person' : 'people'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setHouseholdSize(Math.min(10, householdSize + 1))}
            disabled={householdSize >= 10}
            className="w-11 h-11 rounded-full bg-gray-100 font-bold text-xl flex items-center justify-center text-[#2a2a2a] disabled:opacity-30 cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      {/* Cooking days */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3">
        <div>
          <label className="block font-sans font-black text-base text-[#2a2a2a]">
            Cooking days
          </label>
          <p className="text-xs text-[#6b6b6b]">Which days should we plan meals for?</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {days.map((d) => {
            const isSelected = cookingDays.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`py-3 rounded-2xl border text-sm font-bold text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#9ed034] bg-white ring-2 ring-[#9ed034] text-[#2a2a2a]'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                }`}
              >
                {d.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meal mood / vibes */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <label className="block font-sans font-black text-base text-[#2a2a2a]">
              Meal mood
            </label>
            <p className="text-xs text-[#6b6b6b]">Pick up to 3</p>
          </div>
          <span className="text-xs font-bold text-[#8bc020]">{vibes.length}/3 selected</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {allVibes.map((v) => {
            const isSelected = vibes.includes(v.name);
            return (
              <button
                key={v.name}
                type="button"
                onClick={() => toggleVibe(v.name)}
                className={`p-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#9ed034] bg-white ring-2 ring-[#9ed034] text-[#1f2a06]'
                    : 'border-gray-200 bg-white text-[#2a2a2a] hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{v.emoji}</span>
                <span className="truncate">{v.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cooking Time Limit */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3">
        <div>
          <label className="block font-sans font-black text-base text-[#2a2a2a]">
            Max cooking time limit
          </label>
          <p className="text-xs text-[#6b6b6b]">Only suggest recipes that can be made within this timeframe</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '15 mins', val: 15 },
            { label: '30 mins', val: 30 },
            { label: '45 mins', val: 45 },
            { label: '60 mins', val: 60 },
          ].map((t) => {
            const isSelected = maxCookTimeMinutes === t.val;
            return (
              <button
                key={t.val}
                type="button"
                onClick={() => setMaxCookTimeMinutes(t.val)}
                className={`py-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#9ed034] bg-[#9ed034]/20 text-[#1f2a06] ring-2 ring-[#9ed034]'
                    : 'border-gray-200 text-[#2a2a2a] hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dietary Needs & Allergens */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-4">
        <div>
          <label className="block font-sans font-black text-base text-[#2a2a2a]">
            Dietary needs &amp; Allergies
          </label>
          <p className="text-xs text-[#6b6b6b]">Backend automatically filters out all conflicting recipes.</p>
        </div>

        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-[#9a9a94] mb-2">
            Dietary Style
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(['None', 'Vegetarian', 'Vegan', 'Pescatarian'] as DietaryNeed[]).map((diet) => {
              const isSelected = dietaryNeeds.includes(diet);
              return (
                <button
                  key={diet}
                  type="button"
                  onClick={() => toggleDiet(diet)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#9ed034] bg-[#9ed034]/20 text-[#1f2a06] ring-2 ring-[#9ed034]'
                      : 'border-gray-200 text-[#2a2a2a]'
                  }`}
                >
                  {diet}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-[#9a9a94] mb-2">
            Allergen Exclusions
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {allAllergens.map((alg) => {
              const isSelected = allergies.includes(alg);
              return (
                <button
                  key={alg}
                  type="button"
                  onClick={() => toggleAllergen(alg)}
                  className={`p-2 rounded-xl border text-[11px] font-semibold text-center cursor-pointer transition-all ${
                    isSelected
                      ? 'border-red-400 bg-red-50 text-red-700 font-bold ring-2 ring-red-400'
                      : 'border-gray-200 text-[#444]'
                  }`}
                >
                  {isSelected ? `✕ ${alg}` : alg}
                </button>
              );
            })}
          </div>
        </div>

        <AllergyBanner compact={true} />
      </div>

      {/* Save Action Buttons */}
      <div className="space-y-2 pt-2">
        <Button
          onClick={() => handleSave(true)}
          isLoading={isSaving}
          className="w-full"
          icon={<Sparkles className="w-4 h-4" />}
        >
          Save &amp; Regenerate Weekly Plan
        </Button>
        <button
          type="button"
          onClick={() => handleSave(false)}
          className="w-full py-2.5 text-xs font-bold text-[#6b6b6b] hover:text-[#2a2a2a] text-center"
        >
          Save preferences only (Keep current meals)
        </button>
      </div>
    </div>
  );
};
