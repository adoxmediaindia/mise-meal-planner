import React, { useState, useEffect } from 'react';
import { usePlan } from '../../context/PlanContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/common/Button.js';
import { AllergyBanner } from '../../components/common/AllergyBanner.js';
import {
  Supermarket,
  DayOfWeek,
  DietaryNeed,
  Allergen,
  KitchenEquipment,
  MealVibe,
  CountryCode,
  CurrencyCode,
} from '../../types/index.js';
import { Check, Sparkles, ChevronDown } from 'lucide-react';

interface CountryConfig {
  code: CountryCode;
  name: string;
  currency: CurrencyCode;
  symbol: string;
  flag: string;
  defaultBudget: number;
  minBudget: number;
  maxBudget: number;
  step: number;
}

const COUNTRIES: CountryConfig[] = [
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', flag: '🇮🇳', defaultBudget: 4000, minBudget: 1000, maxBudget: 10000, step: 250 },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸', defaultBudget: 120, minBudget: 30, maxBudget: 350, step: 5 },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧', defaultBudget: 95, minBudget: 25, maxBudget: 250, step: 5 },
  { code: 'EU', name: 'Europe', currency: 'EUR', symbol: '€', flag: '🇪🇺', defaultBudget: 110, minBudget: 30, maxBudget: 300, step: 5 },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: '$', flag: '🇨🇦', defaultBudget: 150, minBudget: 40, maxBudget: 350, step: 10 },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: '$', flag: '🇦🇺', defaultBudget: 160, minBudget: 40, maxBudget: 400, step: 10 },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', symbol: '$', flag: '🇳🇿', defaultBudget: 170, minBudget: 40, maxBudget: 400, step: 10 },
  { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$', flag: '🇧🇷', defaultBudget: 350, minBudget: 100, maxBudget: 800, step: 25 },
];

const COUNTRY_SUPERMARKETS: Record<CountryCode, string[]> = {
  IN: ['Blinkit', 'Zepto', 'Instamart', 'BigBasket', 'DMart', "Nature's Basket", 'Reliance Fresh'],
  US: ['Walmart', "Trader Joe's", 'Kroger', 'Whole Foods', 'Target', 'Aldi', 'Costco', 'Safeway', 'H-E-B', 'Publix'],
  GB: ['Tesco', "Sainsbury's", 'Asda', 'Morrisons', 'Aldi', 'Lidl', 'Waitrose', 'M&S'],
  EU: ['Lidl', 'Aldi', 'Carrefour', 'E.Leclerc', 'REWE', 'Edeka', 'Mercadona', 'Albert Heijn'],
  CA: ['Loblaws', 'No Frills', 'Metro', 'Sobeys', 'Walmart', 'Costco'],
  AU: ['Woolworths', 'Coles', 'ALDI', 'IGA'],
  NZ: ['Countdown', "Pak'nSave", 'New World'],
  BR: ['Carrefour', 'Pão de Açúcar', 'Extra', 'Assaí'],
};

const DAYS_SHORT: { day: DayOfWeek; letter: string }[] = [
  { day: 'Monday', letter: 'M' },
  { day: 'Tuesday', letter: 'T' },
  { day: 'Wednesday', letter: 'W' },
  { day: 'Thursday', letter: 'T' },
  { day: 'Friday', letter: 'F' },
  { day: 'Saturday', letter: 'S' },
  { day: 'Sunday', letter: 'S' },
];

export const Preferences: React.FC = () => {
  const { preferences, updatePreferences } = usePlan();
  const { user } = useAuth();

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('US');
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
      if (preferences.supermarket) setSupermarket(preferences.supermarket);
      if (preferences.householdSize) setHouseholdSize(preferences.householdSize);
      if (preferences.cookingDays) setCookingDays(preferences.cookingDays);
      if (preferences.weeklyBudget) setWeeklyBudget(preferences.weeklyBudget);
      if (preferences.dietaryNeeds) setDietaryNeeds(preferences.dietaryNeeds);
      if (preferences.allergies) setAllergies(preferences.allergies);
      if (preferences.equipment) setEquipment(preferences.equipment);
      if (preferences.vibes) setVibes(preferences.vibes);
      if (preferences.maxCookTimeMinutes) setMaxCookTimeMinutes(preferences.maxCookTimeMinutes);

      const code = (preferences.countryCode || user?.countryCode || 'US') as CountryCode;
      if (COUNTRIES.some((c) => c.code === code)) {
        setSelectedCountry(code);
      }
    } else if (user) {
      if (user.countryCode && COUNTRIES.some((c) => c.code === user.countryCode)) {
        setSelectedCountry(user.countryCode as CountryCode);
      }
      if (user.householdSize) setHouseholdSize(user.householdSize);
      if (user.weeklyBudget) setWeeklyBudget(user.weeklyBudget);
    }
  }, [preferences, user]);

  const currentCountryConfig = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[1];
  const supermarkets = COUNTRY_SUPERMARKETS[selectedCountry] || COUNTRY_SUPERMARKETS.US;

  const handleCountryChange = (code: CountryCode) => {
    setSelectedCountry(code);
    const country = COUNTRIES.find((c) => c.code === code) || COUNTRIES[1];
    const stores = COUNTRY_SUPERMARKETS[code] || [];
    if (!stores.includes(supermarket)) {
      setSupermarket((stores[0] as Supermarket) || 'Aldi');
    }
    if (code === 'IN' && weeklyBudget < 1000) {
      setWeeklyBudget(country.defaultBudget);
    } else if (code !== 'IN' && code !== 'BR' && weeklyBudget > 600) {
      setWeeklyBudget(country.defaultBudget);
    }
  };

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
          countryCode: currentCountryConfig.code,
          countryName: currentCountryConfig.name,
          currencyCode: currentCountryConfig.currency,
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
          Plan Settings
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#2a2a2a] mt-0.5">
          preferences
        </h1>
      </div>

      {/* User Card */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-sans font-black text-lg text-[#2a2a2a]">Hi, {user?.name || 'Cook'}</h3>
            <span className="text-sm">✏️</span>
          </div>
          <p className="text-xs text-[#6b6b6b] mt-0.5 font-medium">Shopping at <strong className="text-[#2a2a2a]">{supermarket}</strong></p>
        </div>
        <div className="w-11 h-11 rounded-full bg-[#0D5C3A] text-white font-extrabold text-base flex items-center justify-center">
          {user?.name?.[0]?.toUpperCase() || 'C'}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-[#9ed034]/20 border border-[#9ed034] rounded-xl text-xs font-bold text-[#1f2a06] flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-[#8bc020]" />
          <span>Preferences updated and plan synchronized!</span>
        </div>
      )}

      {/* Country & Currency selector */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-2">
        <label className="block font-sans font-black text-base text-[#2a2a2a]">
          Country &amp; Currency
        </label>
        <p className="text-xs text-[#6b6b6b]">Determines local supermarkets and currency formatting</p>
        <div className="relative mt-2">
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
            className="w-full appearance-none bg-[#fafaf8] border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] cursor-pointer"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} — {c.currency} ({c.symbol})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#6b6b6b] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Supermarket selector based on country */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-2">
        <label className="block font-sans font-black text-base text-[#2a2a2a]">
          Supermarket
        </label>
        <p className="text-xs text-[#6b6b6b]">Tailored grocery pricing for {currentCountryConfig.name}</p>
        <div className="relative mt-2">
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

      {/* Circular Days to Cook matching Screenshot 3 */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="block font-sans font-black text-base text-[#2a2a2a]">
              days to cook
            </label>
            <p className="text-xs text-[#6b6b6b]">Select cooking nights for this week</p>
          </div>
          <span className="text-xs font-bold text-[#0D5C3A] bg-[#E6F4EA] px-2.5 py-1 rounded-full">
            {cookingDays.length} days
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          {DAYS_SHORT.map(({ day, letter }, index) => {
            const isSelected = cookingDays.includes(day);
            return (
              <button
                key={`${day}-${index}`}
                type="button"
                onClick={() => toggleDay(day)}
                title={day}
                className={`w-11 h-11 rounded-full font-bold text-sm flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0D5C3A] text-white shadow-xs scale-105'
                    : 'bg-[#fafaf8] text-[#4b5563] border border-gray-200 hover:border-gray-300'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Household size stepper */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3">
        <div>
          <label className="block font-sans font-black text-base text-[#2a2a2a]">
            household size
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

      {/* Weekly budget slider */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="block font-sans font-black text-base text-[#2a2a2a]">
              weekly budget
            </label>
            <p className="text-xs text-[#6b6b6b]">Target grocery spend for planned meals</p>
          </div>
          <span className="font-sans font-black text-xl text-[#0D5C3A]">
            {currentCountryConfig.symbol}{weeklyBudget.toLocaleString()}
          </span>
        </div>

        <input
          type="range"
          min={currentCountryConfig.minBudget}
          max={currentCountryConfig.maxBudget}
          step={currentCountryConfig.step}
          value={weeklyBudget}
          onChange={(e) => setWeeklyBudget(Number(e.target.value))}
          className="w-full accent-[#0D5C3A] cursor-pointer"
        />

        <div className="flex justify-between text-xs text-[#888] font-bold">
          <span>{currentCountryConfig.symbol}{currentCountryConfig.minBudget.toLocaleString()}</span>
          <span>{currentCountryConfig.symbol}{currentCountryConfig.maxBudget.toLocaleString()}</span>
        </div>
      </div>

      {/* Meal Vibes matching Screenshot 3 */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="block font-sans font-black text-base text-[#2a2a2a]">
              meal vibes
            </label>
            <p className="text-xs text-[#6b6b6b]">Pick up to 3 moods for your recipes</p>
          </div>
          <span className="text-xs font-bold text-[#888]">{vibes.length}/3</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {allVibes.map((v) => {
            const isSelected = vibes.includes(v.name);
            return (
              <button
                key={v.name}
                type="button"
                onClick={() => toggleVibe(v.name)}
                className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0D5C3A] bg-[#E6F4EA] text-[#0D5C3A]'
                    : 'border-gray-200 bg-[#fafaf8] text-[#2a2a2a] hover:border-gray-300'
                }`}
              >
                <span>{v.emoji}</span>
                <span className="truncate">{v.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dietary requirements matching Screenshot 4 */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3">
        <div>
          <label className="block font-sans font-black text-base text-[#2a2a2a]">
            dietary requirements
          </label>
          <p className="text-xs text-[#6b6b6b]">Which dietary patterns do you follow?</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(['None', 'Vegetarian', 'Vegan', 'Pescatarian'] as DietaryNeed[]).map((d) => {
            const isSelected = dietaryNeeds.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDiet(d)}
                className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0D5C3A] bg-[#E6F4EA] text-[#0D5C3A]'
                    : 'border-gray-200 bg-[#fafaf8] text-[#2a2a2a] hover:border-gray-300'
                }`}
              >
                <span>{d === 'None' ? 'None' : `🌱 ${d}`}</span>
                {isSelected && <Check className="w-4 h-4 text-[#0D5C3A]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Strict Allergen Safety Exclusion */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3">
        <div>
          <label className="block font-sans font-black text-base text-[#2a2a2a]">
            allergies
          </label>
          <p className="text-xs text-[#6b6b6b]">Strict zero-tolerance allergen safety exclusion</p>
        </div>

        <AllergyBanner />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
          {allAllergens.map((alg) => {
            const isSelected = allergies.includes(alg);
            return (
              <button
                key={alg}
                type="button"
                onClick={() => toggleAllergen(alg)}
                className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-[#fafaf8] text-[#2a2a2a] hover:border-gray-300'
                }`}
              >
                <span>{isSelected ? `🚫 ${alg}` : alg}</span>
                {isSelected && <span className="text-red-500 font-extrabold text-xs">Excl</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          onClick={() => handleSave(false)}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? 'Saving...' : 'Save preferences'}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave(true)}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-[#0D5C3A]" />
          <span>Save &amp; Regenerate Plan</span>
        </Button>
      </div>
    </div>
  );
};
