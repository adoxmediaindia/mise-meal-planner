import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../context/PlanContext.js';
import { Button } from '../../components/common/Button.js';
import { AllergyBanner } from '../../components/common/AllergyBanner.js';
import { Supermarket, DayOfWeek, DietaryNeed, Allergen, KitchenEquipment, MealVibe } from '../../types/index.js';
import { Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { updatePreferences, generatePlan } = usePlan();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [supermarket, setSupermarket] = useState<Supermarket>('Aldi');
  const [householdSize, setHouseholdSize] = useState(2);
  const [cookingDays, setCookingDays] = useState<DayOfWeek[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const [weeklyBudget, setWeeklyBudget] = useState(40);
  const [dietaryNeeds, setDietaryNeeds] = useState<DietaryNeed[]>(['None']);
  const [allergies, setAllergies] = useState<Allergen[]>([]);
  const [equipment, setEquipment] = useState<KitchenEquipment[]>(['Hob Only', 'Oven']);
  const [vibes, setVibes] = useState<MealVibe[]>(['Speedy Meals', 'Family Favs']);

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

  const days: DayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

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

  const allAllergens: Allergen[] = [
    'Gluten',
    'Dairy',
    'Peanuts',
    'Tree Nuts',
    'Eggs',
    'Fish',
    'Shellfish',
    'Soy',
    'Sesame',
  ];

  const toggleDay = (day: DayOfWeek) => {
    if (cookingDays.includes(day)) {
      if (cookingDays.length > 1) {
        setCookingDays(cookingDays.filter((d) => d !== day));
      }
    } else {
      setCookingDays([...cookingDays, day]);
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

  const toggleAllergen = (allergen: Allergen) => {
    if (allergies.includes(allergen)) {
      setAllergies(allergies.filter((a) => a !== allergen));
    } else {
      setAllergies([...allergies, allergen]);
    }
  };

  const toggleEquipment = (eq: KitchenEquipment) => {
    if (equipment.includes(eq)) {
      if (equipment.length > 1) {
        setEquipment(equipment.filter((e) => e !== eq));
      }
    } else {
      setEquipment([...equipment, eq]);
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

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await updatePreferences({
        supermarket,
        householdSize,
        cookingDays,
        weeklyBudget,
        dietaryNeeds,
        allergies,
        equipment,
        vibes,
      });
      await generatePlan();
      navigate('/app/plan');
    } catch (err: any) {
      alert(err.message || 'Error generating plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] py-10 px-5 sm:px-6">
      <div className="max-w-[580px] mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-[#8bc020]' : s < step ? 'w-4 bg-[#9ed034]' : 'w-4 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">
            Step {step} of 4
          </span>
        </div>

        <div className="bg-white rounded-[28px] p-6 sm:p-10 shadow-[0_12px_32px_rgba(42,42,42,0.08)] border border-[#2a2a2a]/6">
          {/* STEP 1: SUPERMARKET */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8bc020]">
                  Your Supermarket
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2a2a2a] mt-1 mb-2">
                  Where do you shop?
                </h2>
                <p className="text-sm text-[#6b6b6b]">
                  Recipes and shopping lists are tuned to your store's aisles and prices.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {supermarkets.map((store) => {
                  const isSelected = supermarket === store;
                  return (
                    <button
                      key={store}
                      type="button"
                      onClick={() => setSupermarket(store)}
                      className={`p-4 rounded-2xl text-left border text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#9ed034] bg-[#9ed034]/10 text-[#1f2a06] ring-2 ring-[#9ed034]'
                          : 'border-gray-200 hover:border-gray-300 text-[#2a2a2a]'
                      }`}
                    >
                      <span>{store}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#8bc020]" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={() => setStep(2)} icon={<ArrowRight className="w-4 h-4" />}>
                  Next: Household &amp; Days
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: HOUSEHOLD & COOKING DAYS */}
          {step === 2 && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8bc020]">
                  Household &amp; Schedule
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2a2a2a] mt-1 mb-2">
                  Who and when?
                </h2>
              </div>

              {/* Household Size Stepper */}
              <div>
                <label className="block text-sm font-bold text-[#2a2a2a] mb-3">
                  How many are you cooking for?
                </label>
                <div className="flex items-center gap-6 justify-center bg-[#fafaf8] py-4 rounded-2xl border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setHouseholdSize(Math.max(1, householdSize - 1))}
                    disabled={householdSize <= 1}
                    className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-200 text-2xl font-bold flex items-center justify-center text-[#2a2a2a] disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <div className="text-center min-w-[70px]">
                    <div className="font-serif text-4xl font-bold text-[#2a2a2a]">{householdSize}</div>
                    <div className="text-xs text-[#6b6b6b] font-medium">
                      {householdSize === 1 ? 'person' : 'people'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHouseholdSize(Math.min(10, householdSize + 1))}
                    disabled={householdSize >= 10}
                    className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-200 text-2xl font-bold flex items-center justify-center text-[#2a2a2a] disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cooking Days */}
              <div>
                <label className="block text-sm font-bold text-[#2a2a2a] mb-2">
                  Which days should we plan meals for?
                </label>
                <p className="text-xs text-[#6b6b6b] mb-3">
                  Select {cookingDays.length} {cookingDays.length === 1 ? 'dinner' : 'dinners'} this week.
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {days.map((d) => {
                    const isSelected = cookingDays.includes(d);
                    const shortName = d.slice(0, 3);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#9ed034]/20 border-[#9ed034] text-[#1f2a06] ring-2 ring-[#9ed034]'
                            : 'bg-white border-gray-200 text-[#6b6b6b] hover:border-gray-300'
                        }`}
                      >
                        {shortName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-[#2a2a2a]">Weekly Target Budget</label>
                  <span className="font-serif text-lg font-bold text-[#8bc020]">${weeklyBudget}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="5"
                  value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(Number(e.target.value))}
                  className="w-full accent-[#8bc020] cursor-pointer"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} icon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} icon={<ArrowRight className="w-4 h-4" />}>
                  Next: Dietary Needs
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: DIETARY NEEDS & ALLERGIES */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8bc020]">
                  Diet &amp; Allergies
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2a2a2a] mt-1 mb-2">
                  Any requirements?
                </h2>
                <p className="text-sm text-[#6b6b6b]">
                  Backend strictly excludes all recipes conflicting with chosen allergens.
                </p>
              </div>

              {/* Diet Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-2.5">
                  Dietary Style
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['None', 'Vegetarian', 'Vegan', 'Pescatarian'] as DietaryNeed[]).map((diet) => {
                    const isSelected = dietaryNeeds.includes(diet);
                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => toggleDiet(diet)}
                        className={`p-3 rounded-xl border text-sm font-bold text-left flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#9ed034] bg-[#9ed034]/15 text-[#1f2a06] ring-2 ring-[#9ed034]'
                            : 'border-gray-200 text-[#2a2a2a] hover:border-gray-300'
                        }`}
                      >
                        <span>{diet}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#8bc020]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergen Checkboxes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-2.5">
                  Allergens to Avoid (Strict Filter)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {allAllergens.map((alg) => {
                    const isSelected = allergies.includes(alg);
                    return (
                      <button
                        key={alg}
                        type="button"
                        onClick={() => toggleAllergen(alg)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center cursor-pointer transition-all ${
                          isSelected
                            ? 'border-red-400 bg-red-50 text-red-700 font-bold ring-2 ring-red-400'
                            : 'border-gray-200 text-[#444] hover:border-gray-300'
                        }`}
                      >
                        {isSelected ? `✕ ${alg}` : alg}
                      </button>
                    );
                  })}
                </div>
              </div>

              <AllergyBanner compact={true} />

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
                <Button onClick={() => setStep(4)} icon={<ArrowRight className="w-4 h-4" />}>
                  Next: Vibes &amp; Kitchen
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: VIBES & EQUIPMENT */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8bc020]">
                  Vibes &amp; Kitchen Kit
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2a2a2a] mt-1 mb-2">
                  What's the vibe this week?
                </h2>
                <p className="text-sm text-[#6b6b6b]">
                  Pick up to 3 meal vibes. Selected: {vibes.length}/3
                </p>
              </div>

              {/* Vibe Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {allVibes.map((v) => {
                  const isSelected = vibes.includes(v.name);
                  return (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => toggleVibe(v.name)}
                      className={`p-3.5 rounded-2xl border text-sm font-semibold flex items-center gap-2.5 text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#9ed034] bg-[#9ed034]/20 text-[#1f2a06] ring-2 ring-[#9ed034] font-bold'
                          : 'border-gray-200 text-[#2a2a2a] hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{v.emoji}</span>
                      <span className="leading-tight">{v.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-2.5">
                  Kitchen Equipment
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['Hob Only', 'Oven', 'Air Fryer', 'Slow Cooker', 'Blender', 'Instant Pot'] as KitchenEquipment[]).map(
                    (eq) => {
                      const isSelected = equipment.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => toggleEquipment(eq)}
                          className={`px-3.5 py-2 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#9ed034] bg-[#9ed034]/20 text-[#1f2a06] font-bold ring-2 ring-[#9ed034]'
                              : 'border-gray-200 text-[#444] hover:border-gray-300'
                          }`}
                        >
                          {eq}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(3)} icon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
                <Button
                  onClick={handleFinish}
                  isLoading={isSubmitting}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Generate My Weekly Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
