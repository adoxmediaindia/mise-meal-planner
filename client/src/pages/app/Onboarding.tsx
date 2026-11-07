import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout.js';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader.js';
import { SelectionCard } from '../../components/onboarding/SelectionCard.js';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton.js';
import { TextInputField } from '../../components/onboarding/TextInputField.js';
import { WelcomeCarousel } from '../../components/onboarding/WelcomeCarousel.js';
import { FlagIcon } from '../../components/onboarding/FlagIcon.js';
import { ChefIllustration } from '../../components/onboarding/ChefIllustration.js';
import { ReferralIcon } from '../../components/onboarding/ReferralIcon.js';
import { StopwatchIllustration } from '../../components/onboarding/StopwatchIllustration.js';
import { CountryFlag } from '../../components/onboarding/CountryFlag.js';
import { SavingsCelebrationIllustration } from '../../components/onboarding/SavingsCelebrationIllustration.js';
import { KitchenIllustration, ApplianceId } from '../../components/onboarding/KitchenIllustration.js';
import { TestimonialsScreen } from '../../components/onboarding/TestimonialsScreen.js';
import { BuildingWeekScreen } from '../../components/onboarding/BuildingWeekScreen.js';
import { FreeTrialIntroScreen } from '../../components/onboarding/FreeTrialIntroScreen.js';
import { TrialReminderScreen } from '../../components/onboarding/TrialReminderScreen.js';
import { PricingScreen } from '../../components/onboarding/PricingScreen.js';
import { Batch5CompleteScreen } from '../../components/onboarding/Batch5CompleteScreen.js';
import { api } from '../../services/api.js';
import { TrialReminderPreference } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  OnboardingLanguage,
  AgeRange,
  PrimaryGoal,
  CookingBarrier,
  ShoppingSavingsConfidence,
  UsualCookingTime,
  ReferralSource,
  CountryCode,
  CurrencyCode,
  CountryOption,
  DayOfWeek,
} from '../../types/index.js';
import { Tag, CheckCircle2, AlertCircle, Sparkles, Check } from 'lucide-react';

interface LanguageOption {
  code: OnboardingLanguage;
  name: string;
  subtitle?: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch', subtitle: 'German' },
  { code: 'sv', name: 'Svenska', subtitle: 'Swedish' },
  { code: 'nl', name: 'Nederlands', subtitle: 'Dutch' },
  { code: 'pt', name: 'Português', subtitle: 'Portuguese' },
  { code: 'es', name: 'Español', subtitle: 'Spanish' },
  { code: 'fr', name: 'Français', subtitle: 'French' },
];

const AGE_RANGES: AgeRange[] = [
  '24 and under',
  '25-34',
  '35-44',
  '45-54',
  '55+',
];

const GOAL_OPTIONS: { id: PrimaryGoal; label: string; emoji: string }[] = [
  { id: 'Meal prep for the week', label: 'Meal prep for the week', emoji: '📅' },
  { id: 'Find super simple recipes', label: 'Find super simple recipes', emoji: '✨' },
  { id: 'Feed myself', label: 'Feed myself', emoji: '🍽️' },
  { id: 'Feed my family', label: 'Feed my family', emoji: '👨‍👩‍👧' },
];

const COOKING_BARRIERS: { id: CookingBarrier; label: string; emoji: string }[] = [
  { id: 'Lack of time', label: 'Lack of time', emoji: '⏱️' },
  { id: 'Too tired after work', label: 'Too tired after work', emoji: '😴' },
  { id: 'I find cooking difficult', label: 'I find cooking difficult', emoji: '🤔' },
  { id: 'I struggle for inspiration', label: 'I struggle for inspiration', emoji: '💭' },
];

const SHOPPING_SAVINGS_OPTIONS: ShoppingSavingsConfidence[] = [
  'Definitely',
  'Most likely',
  'Somewhat',
  'Not really',
];

const COOKING_TIME_OPTIONS: UsualCookingTime[] = [
  '15–30 min',
  '30–45 min',
  '45–60 min',
  '60+ min',
];

const REFERRAL_OPTIONS: ReferralSource[] = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Facebook',
  'Word of mouth',
  'Google Play',
];

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'EU', name: 'Europe', currency: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: '$', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: '$', flag: '🇨🇦' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', symbol: '$', flag: '🇳🇿' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', flag: '🇮🇳' },
];

export const CURRENCY_CONFIG: Record<
  CurrencyCode,
  { symbol: string; defaultBudget: number; maxBudget: number; minBudget: number; step: number }
> = {
  USD: { symbol: '$', defaultBudget: 120, maxBudget: 230, minBudget: 30, step: 5 },
  EUR: { symbol: '€', defaultBudget: 110, maxBudget: 220, minBudget: 30, step: 5 },
  GBP: { symbol: '£', defaultBudget: 95, maxBudget: 190, minBudget: 25, step: 5 },
  AUD: { symbol: '$', defaultBudget: 160, maxBudget: 300, minBudget: 40, step: 10 },
  CAD: { symbol: '$', defaultBudget: 150, maxBudget: 290, minBudget: 40, step: 10 },
  NZD: { symbol: '$', defaultBudget: 170, maxBudget: 320, minBudget: 40, step: 10 },
  BRL: { symbol: 'R$', defaultBudget: 350, maxBudget: 700, minBudget: 100, step: 25 },
  INR: { symbol: '₹', defaultBudget: 4000, maxBudget: 8000, minBudget: 1000, step: 250 },
};

const WEEKDAY_ORDER: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const CURRENCY_SAVINGS: Record<
  CurrencyCode,
  { weekly: number; labelWeekly: string; labelYearly: string }
> = {
  USD: { weekly: 20, labelWeekly: '$20', labelYearly: "$1040 a year!" },
  EUR: { weekly: 18, labelWeekly: '€18', labelYearly: "€936 a year!" },
  GBP: { weekly: 15, labelWeekly: '£15', labelYearly: "£780 a year!" },
  AUD: { weekly: 28, labelWeekly: '$28', labelYearly: "$1456 a year!" },
  CAD: { weekly: 25, labelWeekly: '$25', labelYearly: "$1300 a year!" },
  NZD: { weekly: 30, labelWeekly: '$30', labelYearly: "$1560 a year!" },
  BRL: { weekly: 100, labelWeekly: 'R$100', labelYearly: "R$5200 a year!" },
  INR: { weekly: 1500, labelWeekly: '₹1,500', labelYearly: "₹78,000 a year!" },
};

export const MOOD_OPTIONS: { id: string; label: string; emoji: string; fullWidth?: boolean }[] = [
  { id: 'Speedy Meals', label: 'Speedy Meals', emoji: '⚡' },
  { id: 'Low Calorie', label: 'Low Calorie', emoji: '⚖️' },
  { id: 'Family Favs', label: 'Family Favs', emoji: '👨‍👩‍👧' },
  { id: 'Healthy Comfort', label: 'Healthy Comfort', emoji: '🥗' },
  { id: 'Fakeaway', label: 'Fakeaway', emoji: '🥡' },
  { id: 'Gut Friendly', label: 'Gut Friendly', emoji: '🧘' },
  { id: 'Protein Packed', label: 'Protein Packed', emoji: '💪', fullWidth: true },
];

export const DIETARY_OPTIONS: { id: string; label: string; emoji: string }[] = [
  { id: 'None', label: 'None', emoji: '🚫' },
  { id: 'Vegetarian', label: 'Vegetarian', emoji: '🥕' },
  { id: 'Vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'Pescatarian', label: 'Pescatarian', emoji: '🐟' },
];

export const ALLERGY_OPTIONS: { id: string; label: string; emoji: string }[] = [
  { id: 'None', label: 'None', emoji: '🚫' },
  { id: 'Gluten free', label: 'Gluten free', emoji: '🌾' },
  { id: 'Dairy free', label: 'Dairy free', emoji: '🥛' },
  { id: 'Nut free', label: 'Nut free', emoji: '🥜' },
  { id: 'Egg free', label: 'Egg free', emoji: '🥚' },
  { id: 'Shellfish free', label: 'Shellfish free', emoji: '🦐' },
  { id: 'Sesame free', label: 'Sesame free', emoji: '🧂' },
  { id: 'Soy free', label: 'Soy free', emoji: '🫘' },
];

export const APPLIANCE_OPTIONS: { id: ApplianceId; label: string; emoji: string }[] = [
  { id: 'Stovetop', label: 'Stovetop', emoji: '🍳' },
  { id: 'Oven', label: 'Oven', emoji: '♨️' },
  { id: 'Air Fryer', label: 'Air Fryer', emoji: '🍟' },
  { id: 'Microwave', label: 'Microwave', emoji: '📻' },
];

const GUEST_STORAGE_KEY = 'meltto_onboarding_guest';

export const Onboarding: React.FC = () => {
  const { user, updateOnboarding } = useAuth();
  const navigate = useNavigate();

  // Screen step: 1 to 15
  const [step, setStep] = useState<number>(1);

  // Form states (Screens 1–5)
  const [selectedLanguage, setSelectedLanguage] = useState<OnboardingLanguage>('en');
  const [name, setName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<AgeRange | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<PrimaryGoal | null>(null);

  // Form states (Screens 6–10)
  const [selectedBarrier, setSelectedBarrier] = useState<CookingBarrier | null>(null);
  const [selectedSavings, setSelectedSavings] = useState<ShoppingSavingsConfidence | null>(null);
  const [selectedCookingTime, setSelectedCookingTime] = useState<UsualCookingTime | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<ReferralSource | null>(null);

  // Form states (Screens 11–15)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('US');
  const [selectedCountryName, setSelectedCountryName] = useState<string>('United States');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [householdSize, setHouseholdSize] = useState<number>(3);
  const [cookingDays, setCookingDays] = useState<DayOfWeek[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const [weeklyBudget, setWeeklyBudget] = useState<number>(120);

  // Code modal state
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [promoCode, setPromoCode] = useState<string>('');
  const [codeMessage, setCodeMessage] = useState<string>('');

  // Form states (Screens 16–20)
  const [selectedMoods, setSelectedMoods] = useState<string[]>(['Speedy Meals']);
  const [selectedDietary, setSelectedDietary] = useState<string[]>(['None']);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(['None']);
  const [selectedAppliances, setSelectedAppliances] = useState<ApplianceId[]>([
    'Stovetop',
    'Oven',
    'Air Fryer',
  ]);
  const [moodWarning, setMoodWarning] = useState<string>('');
  const [applianceError, setApplianceError] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [trialReminder, setTrialReminder] = useState<TrialReminderPreference>('1_day_before');
  const [selectedTrialPlan, setSelectedTrialPlan] = useState<'mise_free' | 'mise_pro_yearly' | 'mise_pro_monthly'>('mise_free');
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [isStartingTrial, setIsStartingTrial] = useState<boolean>(false);
  const [batch5Complete, setBatch5Complete] = useState<boolean>(false);

  // Restore saved state from User or LocalStorage on mount
  useEffect(() => {
    let initialStep = 1;
    if (user) {
      if (user.preferredLanguage) setSelectedLanguage(user.preferredLanguage);
      if (user.name) setName(user.name);
      if (user.ageRange) setSelectedAge(user.ageRange as AgeRange);
      if (user.primaryGoal) setSelectedGoal(user.primaryGoal as PrimaryGoal);
      if (user.cookingBarrier) setSelectedBarrier(user.cookingBarrier as CookingBarrier);
      if (user.shoppingSavingsConfidence) setSelectedSavings(user.shoppingSavingsConfidence as ShoppingSavingsConfidence);
      if (user.usualCookingTime) setSelectedCookingTime(user.usualCookingTime as UsualCookingTime);
      if (user.referralSource) setSelectedReferral(user.referralSource as ReferralSource);
      if (user.countryCode) setSelectedCountry(user.countryCode as CountryCode);
      if (user.countryName) setSelectedCountryName(user.countryName);
      if (user.currencyCode) setSelectedCurrency(user.currencyCode as CurrencyCode);
      if (user.householdSize) setHouseholdSize(user.householdSize);
      if (user.cookingDays && user.cookingDays.length > 0) setCookingDays(user.cookingDays as DayOfWeek[]);
      if (user.weeklyBudget) setWeeklyBudget(user.weeklyBudget);
      if (user.mealMoods && user.mealMoods.length > 0) setSelectedMoods(user.mealMoods);
      if (user.dietaryPreferences && user.dietaryPreferences.length > 0) setSelectedDietary(user.dietaryPreferences);
      if (user.allergies && user.allergies.length > 0) setSelectedAllergies(user.allergies);
      if (user.appliances && user.appliances.length > 0) setSelectedAppliances(user.appliances as ApplianceId[]);
      if (user.trialReminderPreference) setTrialReminder(user.trialReminderPreference as TrialReminderPreference);
      if (user.onboardingStep && user.onboardingStep >= 1 && user.onboardingStep <= 25) {
        initialStep = user.onboardingStep;
      }
    } else {
      try {
        const saved = localStorage.getItem(GUEST_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.preferredLanguage) setSelectedLanguage(parsed.preferredLanguage);
          if (parsed.name) setName(parsed.name);
          if (parsed.ageRange) setSelectedAge(parsed.ageRange);
          if (parsed.primaryGoal) setSelectedGoal(parsed.primaryGoal);
          if (parsed.cookingBarrier) setSelectedBarrier(parsed.cookingBarrier);
          if (parsed.shoppingSavingsConfidence) setSelectedSavings(parsed.shoppingSavingsConfidence);
          if (parsed.usualCookingTime) setSelectedCookingTime(parsed.usualCookingTime);
          if (parsed.referralSource) setSelectedReferral(parsed.referralSource);
          if (parsed.countryCode) setSelectedCountry(parsed.countryCode);
          if (parsed.countryName) setSelectedCountryName(parsed.countryName);
          if (parsed.currencyCode) setSelectedCurrency(parsed.currencyCode);
          if (parsed.householdSize) setHouseholdSize(parsed.householdSize);
          if (parsed.cookingDays && parsed.cookingDays.length > 0) setCookingDays(parsed.cookingDays);
          if (parsed.weeklyBudget) setWeeklyBudget(parsed.weeklyBudget);
          if (parsed.mealMoods && parsed.mealMoods.length > 0) setSelectedMoods(parsed.mealMoods);
          if (parsed.dietaryPreferences && parsed.dietaryPreferences.length > 0) setSelectedDietary(parsed.dietaryPreferences);
          if (parsed.allergies && parsed.allergies.length > 0) setSelectedAllergies(parsed.allergies);
          if (parsed.appliances && parsed.appliances.length > 0) setSelectedAppliances(parsed.appliances);
          if (parsed.trialReminderPreference) setTrialReminder(parsed.trialReminderPreference as TrialReminderPreference);
          if (parsed.onboardingStep && parsed.onboardingStep >= 1 && parsed.onboardingStep <= 25) {
            initialStep = parsed.onboardingStep;
          }
        }
      } catch (err) {
        console.warn('Failed to parse guest onboarding state:', err);
      }
    }
    setStep(initialStep);
  }, [user]);

  // Save changes to auth context & local persistence
  const persistChanges = (data: Record<string, any>) => {
    if (updateOnboarding) {
      updateOnboarding(data).catch(() => {});
    } else {
      try {
        const existing = localStorage.getItem(GUEST_STORAGE_KEY);
        const parsed = existing ? JSON.parse(existing) : {};
        const merged = { ...parsed, ...data };
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(merged));
      } catch {}
    }
  };

  // SCREEN 1: Language selection handler
  const handleSelectLanguage = (code: OnboardingLanguage) => {
    setSelectedLanguage(code);
    persistChanges({ preferredLanguage: code, onboardingStep: 2 });
    setTimeout(() => {
      setStep(2);
    }, 220);
  };

  // SCREEN 2: "Get Started"
  const handleGetStarted = () => {
    persistChanges({ onboardingStep: 3 });
    setStep(3);
  };

  // SCREEN 3: Name Input validation & Continue
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (nameError) setNameError('');
  };

  const isNameValid = name.trim().length > 0 && name.trim().length <= 50;

  const handleNameContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Please enter your name');
      return;
    }
    if (trimmed.length > 50) {
      setNameError('Name cannot exceed 50 characters');
      return;
    }
    setName(trimmed);
    persistChanges({ name: trimmed, onboardingStep: 4 });
    setStep(4);
  };

  // SCREEN 4: Age selection
  const handleSelectAge = (age: AgeRange) => {
    setSelectedAge(age);
  };

  const handleAgeContinue = () => {
    if (!selectedAge) return;
    persistChanges({ ageRange: selectedAge, onboardingStep: 5 });
    setStep(5);
  };

  // SCREEN 5: Goal selection
  const handleSelectGoal = (goal: PrimaryGoal) => {
    setSelectedGoal(goal);
  };

  const handleGoalContinue = () => {
    if (!selectedGoal) return;
    persistChanges({
      primaryGoal: selectedGoal,
      onboardingStep: 6,
    });
    setStep(6);
  };

  // SCREEN 6: Cooking Barrier
  const handleSelectBarrier = (barrier: CookingBarrier) => {
    setSelectedBarrier(barrier);
  };

  const handleBarrierContinue = () => {
    if (!selectedBarrier) return;
    persistChanges({
      cookingBarrier: selectedBarrier,
      onboardingStep: 7,
    });
    setStep(7);
  };

  // SCREEN 7: Chef Introduction (Informational - Continue always enabled)
  const handleChefContinue = () => {
    persistChanges({ onboardingStep: 8 });
    setStep(8);
  };

  // SCREEN 8: Shopping Savings Confidence
  const handleSelectSavings = (savings: ShoppingSavingsConfidence) => {
    setSelectedSavings(savings);
  };

  const handleSavingsContinue = () => {
    if (!selectedSavings) return;
    persistChanges({
      shoppingSavingsConfidence: selectedSavings,
      onboardingStep: 9,
    });
    setStep(9);
  };

  // SCREEN 9: Usual Cooking Time
  const handleSelectCookingTime = (time: UsualCookingTime) => {
    setSelectedCookingTime(time);
  };

  const handleCookingTimeContinue = () => {
    if (!selectedCookingTime) return;
    persistChanges({
      usualCookingTime: selectedCookingTime,
      onboardingStep: 10,
    });
    setStep(10);
  };

  // SCREEN 10: Referral Source (advances to Screen 11)
  const handleSelectReferral = (source: ReferralSource) => {
    setSelectedReferral(source);
  };

  const handleReferralContinue = () => {
    if (!selectedReferral) return;
    persistChanges({
      referralSource: selectedReferral,
      onboardingStep: 11,
    });
    setStep(11);
  };

  // SCREEN 11: Time-Saving Introduction (Informational - Continue always enabled)
  const handleScreen11Continue = () => {
    persistChanges({ onboardingStep: 12 });
    setStep(12);
  };

  // SCREEN 12: Country and Currency Selection
  const handleSelectCountry = (country: CountryOption) => {
    setSelectedCountry(country.code);
    setSelectedCountryName(country.name);
    setSelectedCurrency(country.currency);
    const cfg = CURRENCY_CONFIG[country.currency] || CURRENCY_CONFIG.USD;
    setWeeklyBudget(cfg.defaultBudget);
  };

  const handleCountryContinue = () => {
    if (!selectedCountry) return;
    persistChanges({
      countryCode: selectedCountry,
      countryName: selectedCountryName,
      currencyCode: selectedCurrency,
      onboardingStep: 13,
    });
    setStep(13);
  };

  // SCREEN 13: Household Size
  const handleHouseholdContinue = () => {
    persistChanges({
      householdSize,
      onboardingStep: 14,
    });
    setStep(14);
  };

  // SCREEN 14: Cooking Days Multi-select
  const handleToggleDay = (day: DayOfWeek) => {
    setCookingDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleCookingDaysContinue = () => {
    if (cookingDays.length === 0) return;
    const sorted = [...cookingDays].sort(
      (a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b)
    );
    persistChanges({
      cookingDays: sorted,
      onboardingStep: 15,
    });
    setStep(15);
  };

  // SCREEN 15: Weekly Food Budget
  const handleBudgetContinue = () => {
    if (weeklyBudget <= 0) return;
    persistChanges({
      weeklyBudget,
      weeklyBudgetCurrency: selectedCurrency,
      onboardingStep: 16,
      onboardingCompleted: false,
    });
    setStep(16);
  };

  // SCREEN 16: Weekly Savings Intro
  const handleScreen16Continue = () => {
    persistChanges({
      onboardingStep: 17,
      onboardingCompleted: false,
    });
    setStep(17);
  };

  // SCREEN 17: Mood Selection (up to 3)
  const handleToggleMood = (moodId: string) => {
    setMoodWarning('');
    if (selectedMoods.includes(moodId)) {
      setSelectedMoods(selectedMoods.filter((m) => m !== moodId));
    } else {
      if (selectedMoods.length >= 3) {
        setMoodWarning('You can select up to 3 moods.');
        return;
      }
      setSelectedMoods([...selectedMoods, moodId]);
    }
  };

  const handleMoodContinue = () => {
    if (selectedMoods.length === 0) return;
    persistChanges({
      mealMoods: selectedMoods,
      onboardingStep: 18,
      onboardingCompleted: false,
    });
    setStep(18);
  };

  // SCREEN 18: Dietary Needs
  const handleToggleDietary = (dietId: string) => {
    if (dietId === 'None') {
      setSelectedDietary(['None']);
    } else {
      const filtered = selectedDietary.filter((d) => d !== 'None');
      if (filtered.includes(dietId)) {
        const next = filtered.filter((d) => d !== dietId);
        setSelectedDietary(next.length ? next : ['None']);
      } else {
        setSelectedDietary([...filtered, dietId]);
      }
    }
  };

  const handleDietaryContinue = () => {
    if (selectedDietary.length === 0) return;
    persistChanges({
      dietaryPreferences: selectedDietary,
      onboardingStep: 19,
      onboardingCompleted: false,
    });
    setStep(19);
  };

  // SCREEN 19: Allergies
  const handleToggleAllergy = (allergyId: string) => {
    if (allergyId === 'None') {
      setSelectedAllergies(['None']);
    } else {
      const filtered = selectedAllergies.filter((a) => a !== 'None');
      if (filtered.includes(allergyId)) {
        const next = filtered.filter((a) => a !== allergyId);
        setSelectedAllergies(next.length ? next : ['None']);
      } else {
        setSelectedAllergies([...filtered, allergyId]);
      }
    }
  };

  const handleAllergyContinue = () => {
    if (selectedAllergies.length === 0) return;
    persistChanges({
      allergies: selectedAllergies,
      onboardingStep: 20,
      onboardingCompleted: false,
    });
    setStep(20);
  };

  // SCREEN 20: Kitchen Appliances
  const handleToggleAppliance = (appId: ApplianceId) => {
    setApplianceError('');
    if (selectedAppliances.includes(appId)) {
      setSelectedAppliances(selectedAppliances.filter((a) => a !== appId));
    } else {
      setSelectedAppliances([...selectedAppliances, appId]);
    }
  };

  const handleGeneratePlan = async () => {
    if (selectedAppliances.length === 0) {
      setApplianceError('Please select at least one appliance to plan with.');
      return;
    }
    setApplianceError('');
    persistChanges({
      appliances: selectedAppliances,
      onboardingStep: 21,
      onboardingCompleted: false,
    });
    setStep(21);
  };

  const handleContinueFromTestimonials = () => {
    persistChanges({ onboardingStep: 22 });
    setStep(22);
  };

  const handlePlanGenerated = (plan: any) => {
    setGeneratedPlan(plan);
    persistChanges({ onboardingStep: 23 });
    setStep(23);
  };

  const handleContinueFromTrialIntro = () => {
    persistChanges({ onboardingStep: 24 });
    setStep(24);
  };

  const handleContinueFromReminder = (pref: TrialReminderPreference) => {
    setTrialReminder(pref);
    persistChanges({
      trialReminderPreference: pref,
      onboardingStep: 25,
    });
    setStep(25);
  };

  const handleStartFreeTrial = async (planId: 'mise_free' | 'mise_pro_yearly' | 'mise_pro_monthly') => {
    setSelectedTrialPlan(planId);
    setIsStartingTrial(true);
    try {
      if (user && planId !== 'mise_free') {
        await api.upgradeSubscription(planId as any).catch(() => {});
      }
      persistChanges({
        trialReminderPreference: trialReminder,
        onboardingStep: 25,
        onboardingCompleted: false, // Guardrail: stop at Batch 5 holding review
      });
      setBatch5Complete(true);
    } finally {
      setIsStartingTrial(false);
    }
  };

  // Navigation: Back button
  const handleBack = () => {
    if (batch5Complete) {
      setBatch5Complete(false);
      return;
    }
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      persistChanges({ onboardingStep: prevStep });
    } else {
      navigate('/');
    }
  };

  // Calculate progress bar percentage for Screens 3–20 matching visual references
  const getProgress = () => {
    switch (step) {
      case 3:
        return 15;
      case 4:
        return 20;
      case 5:
        return 25;
      case 6:
        return 30;
      case 7:
        return 35;
      case 8:
        return 40;
      case 9:
        return 45;
      case 10:
        return 50;
      case 11:
        return 55;
      case 12:
        return 60;
      case 13:
        return 65;
      case 14:
        return 70;
      case 15:
        return 75;
      case 16:
        return 80;
      case 17:
        return 85;
      case 18:
        return 90;
      case 19:
        return 95;
      case 20:
        return 98;
      case 21:
        return 100;
      default:
        return undefined;
    }
  };

  // Promo code redemption placeholder (per requirements: do not invent success)
  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) {
      setCodeMessage('Please enter a valid invite or referral code.');
      return;
    }
    setCodeMessage('Referral codes will be validated and applied during subscription checkout.');
  };

  const currencyConfig = CURRENCY_CONFIG[selectedCurrency] || CURRENCY_CONFIG.USD;
  const currencySavings = CURRENCY_SAVINGS[selectedCurrency] || CURRENCY_SAVINGS.USD;

  return (
    <OnboardingLayout
      header={
        step > 1 && !batch5Complete ? (
          <OnboardingHeader
            onBack={handleBack}
            progress={step >= 3 && step <= 21 ? getProgress() : undefined}
          />
        ) : null
      }
    >
      {/* ======================================================== */}
      {/* SCREEN 1 — CHOOSE YOUR LANGUAGE                          */}
      {/* ======================================================== */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-between py-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">
              choose your language
            </h1>

            <div className="space-y-3 max-h-[60vh] sm:max-h-none overflow-y-auto pr-1">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <SelectionCard
                    key={lang.code}
                    testId={`language-option-${lang.code}`}
                    title={lang.name}
                    subtitle={lang.subtitle}
                    icon={<FlagIcon language={lang.code} />}
                    selected={isSelected}
                    onClick={() => handleSelectLanguage(lang.code)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 2 — WELCOME / INTRODUCTION                        */}
      {/* ======================================================== */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-between py-2 sm:py-4 items-center text-center animate-fadeIn">
          {/* Meltto Branding */}
          <div className="flex flex-col items-center mb-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">🥗</span>
              <span className="font-extrabold text-3xl sm:text-4xl text-[#8bc020] tracking-tight">
                meltto
              </span>
            </div>
            <p className="text-sm sm:text-base text-[#6b6b6b] max-w-xs font-normal leading-snug">
              plan dinners around your budget, your cravings, and what&apos;s in your kitchen
            </p>
          </div>

          {/* Carousel */}
          <div className="w-full flex justify-center py-2">
            <WelcomeCarousel />
          </div>

          {/* Bottom Actions */}
          <div className="w-full space-y-2 pt-2">
            <PrimaryButton
              testId="welcome-get-started-btn"
              onClick={handleGetStarted}
            >
              get started →
            </PrimaryButton>

            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="text-xs sm:text-sm text-[#9a9a94] hover:text-[#1a1a1a] font-medium transition-colors cursor-pointer py-1 block mx-auto"
            >
              Got a code?
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 3 — NAME INPUT                                    */}
      {/* ======================================================== */}
      {step === 3 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-8">
              what&apos;s your name?
            </h1>

            <TextInputField
              testId="name-input-field"
              value={name}
              onChange={handleNameChange}
              placeholder="enter here"
              error={nameError}
              autoFocus
              maxLength={50}
            />
          </div>

          <div className="pt-8">
            <PrimaryButton
              testId="name-continue-btn"
              onClick={handleNameContinue}
              disabled={!isNameValid}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 4 — AGE SELECTION                                 */}
      {/* ======================================================== */}
      {step === 4 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
              how old are you?
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mb-6">
              we only use this information to personalise your experience.
            </p>

            <div className="space-y-3.5">
              {AGE_RANGES.map((age) => {
                const isSelected = selectedAge === age;
                return (
                  <SelectionCard
                    key={age}
                    testId={`age-option-${age}`}
                    title={age}
                    selected={isSelected}
                    mutedUnselected={true}
                    onClick={() => handleSelectAge(age)}
                  />
                );
              })}
            </div>
          </div>

          <div className="pt-8">
            <PrimaryButton
              testId="age-continue-btn"
              onClick={handleAgeContinue}
              disabled={!selectedAge}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 5 — MEAL PLANNING GOAL                            */}
      {/* ======================================================== */}
      {step === 5 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">
              what are you trying to achieve?
            </h1>

            <div className="space-y-3.5">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = selectedGoal === goal.id;
                return (
                  <SelectionCard
                    key={goal.id}
                    testId={`goal-option-${goal.id}`}
                    title={goal.label}
                    icon={goal.emoji}
                    selected={isSelected}
                    onClick={() => handleSelectGoal(goal.id)}
                  />
                );
              })}
            </div>
          </div>

          <div className="pt-8">
            <PrimaryButton
              testId="goal-continue-btn"
              onClick={handleGoalContinue}
              disabled={!selectedGoal}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 6 — COOKING BARRIERS                              */}
      {/* ======================================================== */}
      {step === 6 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">
              what prevents you from doing that?
            </h1>

            <div className="space-y-3.5">
              {COOKING_BARRIERS.map((barrier) => {
                const isSelected = selectedBarrier === barrier.id;
                return (
                  <SelectionCard
                    key={barrier.id}
                    testId={`barrier-option-${barrier.id}`}
                    title={barrier.label}
                    icon={barrier.emoji}
                    selected={isSelected}
                    onClick={() => handleSelectBarrier(barrier.id)}
                  />
                );
              })}
            </div>
          </div>

          <div className="pt-8">
            <PrimaryButton
              testId="barrier-continue-btn"
              onClick={handleBarrierContinue}
              disabled={!selectedBarrier}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 7 — CHEF INTRODUCTION                             */}
      {/* ======================================================== */}
      {step === 7 && (
        <div className="flex-1 flex flex-col justify-between items-center text-center py-4 animate-fadeIn">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-4 max-w-[340px] mx-auto leading-tight">
              planning for meals is time-consuming...
            </h1>

            <ChefIllustration className="my-2" />

            <p className="text-base sm:text-lg text-[#6b6b6b] max-w-[340px] mx-auto font-normal leading-relaxed mt-2">
              we take away that stress and provide you with delicious meals to cook and enjoy
            </p>
          </div>

          <div className="w-full pt-8">
            <PrimaryButton
              testId="chef-continue-btn"
              onClick={handleChefContinue}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 8 — SHOPPING SAVINGS                              */}
      {/* ======================================================== */}
      {step === 8 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">
              do you feel like you could save more on your shopping?
            </h1>

            <div className="space-y-3.5">
              {SHOPPING_SAVINGS_OPTIONS.map((savings) => {
                const isSelected = selectedSavings === savings;
                return (
                  <SelectionCard
                    key={savings}
                    testId={`savings-option-${savings}`}
                    title={savings}
                    selected={isSelected}
                    mutedUnselected={true}
                    onClick={() => handleSelectSavings(savings)}
                  />
                );
              })}
            </div>
          </div>

          <div className="pt-8">
            <PrimaryButton
              testId="savings-continue-btn"
              onClick={handleSavingsContinue}
              disabled={!selectedSavings}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 9 — COOKING TIME                                  */}
      {/* ======================================================== */}
      {step === 9 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
              how long do you usually spend cooking your meals?
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mb-6">
              we&apos;ll match recipes to your routine
            </p>

            <div className="space-y-3.5">
              {COOKING_TIME_OPTIONS.map((time) => {
                const isSelected = selectedCookingTime === time;
                return (
                  <SelectionCard
                    key={time}
                    testId={`cooking-time-option-${time}`}
                    title={time}
                    selected={isSelected}
                    onClick={() => handleSelectCookingTime(time)}
                  />
                );
              })}
            </div>
          </div>

          <div className="pt-8">
            <PrimaryButton
              testId="cooking-time-continue-btn"
              onClick={handleCookingTimeContinue}
              disabled={!selectedCookingTime}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 10 — REFERRAL SOURCE                              */}
      {/* ======================================================== */}
      {step === 10 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">
              where did you hear about us?
            </h1>

            <div className="space-y-3 max-h-[58vh] sm:max-h-none overflow-y-auto pr-1">
              {REFERRAL_OPTIONS.map((source) => {
                const isSelected = selectedReferral === source;
                return (
                  <SelectionCard
                    key={source}
                    testId={`referral-option-${source}`}
                    title={source}
                    icon={<ReferralIcon source={source} />}
                    selected={isSelected}
                    onClick={() => handleSelectReferral(source)}
                  />
                );
              })}
            </div>
          </div>

          <div className="pt-6">
            <PrimaryButton
              testId="referral-continue-btn"
              onClick={handleReferralContinue}
              disabled={!selectedReferral}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 11 — TIME-SAVING INTRODUCTION                     */}
      {/* ======================================================== */}
      {step === 11 && (
        <div className="flex-1 flex flex-col justify-between items-center text-center py-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-3">
              plan your week in less time
            </h1>

            <StopwatchIllustration size={130} className="my-2" />

            <p className="text-sm sm:text-base text-[#6b6b6b] max-w-xs mx-auto leading-relaxed mb-4">
              less time deciding recipes, checking cupboards, and wandering the supermarket
            </p>

            {/* Comparison Graphic */}
            <div className="w-full max-w-[280px] mx-auto mb-4">
              <div className="flex items-end justify-center gap-10 h-32 border-b-2 border-[#EAEAE6] pb-0">
                {/* With us column: short lime-green bar */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-4 bg-[#9ED034] rounded-t-md" />
                </div>
                {/* Without us column: tall grey bar */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-28 bg-[#D8D8D2] rounded-t-2xl" />
                </div>
              </div>
              <div className="flex justify-center gap-10 pt-2.5">
                <div className="w-20 text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#8BC020]">5m</div>
                  <div className="text-xs text-[#8C8C88] font-medium mt-0.5">with us</div>
                </div>
                <div className="w-20 text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A]">60m</div>
                  <div className="text-xs text-[#8C8C88] font-medium mt-0.5">without us</div>
                </div>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1A1A] text-center mt-2">
              save nearly an hour every week
            </h2>
          </div>

          <div className="w-full pt-6">
            <PrimaryButton
              testId="screen11-continue-btn"
              onClick={handleScreen11Continue}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 12 — COUNTRY AND CURRENCY SELECTION               */}
      {/* ======================================================== */}
      {step === 12 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
              where are you from?
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mb-5 leading-relaxed">
              we use this once - to set your currency, cuisine, and a handful of local touches
            </p>

            <div className="space-y-3 max-h-[58vh] sm:max-h-none overflow-y-auto pr-1">
              {COUNTRY_OPTIONS.map((country) => {
                const isSelected = selectedCountry === country.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    data-testid={`country-option-${country.code}`}
                    onClick={() => handleSelectCountry(country)}
                    className={`w-full bg-white rounded-2xl p-4 sm:p-4.5 flex items-center justify-between text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#9ed034] shadow-[0_4px_16px_rgba(158,208,52,0.18)]'
                        : 'border border-[#eaeae6] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <CountryFlag countryCode={country.code} />
                      <span className="font-bold text-base sm:text-lg text-[#1a1a1a]">
                        {country.name}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg border border-[#eaeae6] text-xs font-bold text-[#8c8c88] tracking-wider uppercase bg-[#FAFAF8]">
                      {country.currency}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6">
            <PrimaryButton
              testId="country-continue-btn"
              onClick={handleCountryContinue}
              disabled={!selectedCountry}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 13 — HOUSEHOLD SIZE                               */}
      {/* ======================================================== */}
      {step === 13 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
              how many are you cooking for?
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mb-4">
              we&apos;ll scale your meals and budget
            </p>
          </div>

          {/* Stepper Display */}
          <div className="flex flex-col items-center justify-center my-auto py-8">
            <div className="flex items-center justify-center gap-8">
              <button
                type="button"
                data-testid="household-minus-btn"
                onClick={() => setHouseholdSize((prev) => Math.max(1, prev - 1))}
                disabled={householdSize <= 1}
                className={`w-14 h-14 rounded-full bg-[#F3F2ED] flex items-center justify-center text-3xl font-bold text-[#1a1a1a] transition-all ${
                  householdSize <= 1
                    ? 'opacity-35 cursor-not-allowed'
                    : 'hover:bg-[#EAE8E0] active:scale-95 cursor-pointer'
                }`}
                aria-label="Decrease household count"
              >
                −
              </button>

              <span
                data-testid="household-count-value"
                className="text-7xl sm:text-8xl font-black text-[#1a1a1a] select-none min-w-[70px] text-center"
              >
                {householdSize}
              </span>

              <button
                type="button"
                data-testid="household-plus-btn"
                onClick={() => setHouseholdSize((prev) => Math.min(20, prev + 1))}
                disabled={householdSize >= 20}
                className={`w-14 h-14 rounded-full bg-[#F3F2ED] flex items-center justify-center text-3xl font-bold text-[#1a1a1a] transition-all ${
                  householdSize >= 20
                    ? 'opacity-35 cursor-not-allowed'
                    : 'hover:bg-[#EAE8E0] active:scale-95 cursor-pointer'
                }`}
                aria-label="Increase household count"
              >
                +
              </button>
            </div>
            <div className="text-base text-[#8c8c88] font-medium mt-3 select-none">people</div>
          </div>

          <div className="pt-6">
            <PrimaryButton
              testId="household-continue-btn"
              onClick={handleHouseholdContinue}
              disabled={householdSize < 1 || householdSize > 20}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 14 — COOKING DAYS                                 */}
      {/* ======================================================== */}
      {step === 14 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
              which days will you cook?
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mb-4">
              pick the days you want meals planned for
            </p>

            <div className="text-sm font-semibold text-[#8c8c88] text-center mb-5">
              {cookingDays.length} {cookingDays.length === 1 ? 'day' : 'days'} selected
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                  const isSelected = cookingDays.includes(day as DayOfWeek);
                  return (
                    <button
                      key={day}
                      type="button"
                      data-testid={`day-option-${day}`}
                      onClick={() => handleToggleDay(day as DayOfWeek)}
                      className={`w-full py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-white border-2 border-[#9ed034] text-[#1a1a1a] shadow-[0_4px_14px_rgba(158,208,52,0.18)]'
                          : 'bg-white border border-[#eaeae6] text-[#1a1a1a] hover:border-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-center">
                {(() => {
                  const isSelected = cookingDays.includes('Sunday');
                  return (
                    <button
                      type="button"
                      data-testid="day-option-Sunday"
                      onClick={() => handleToggleDay('Sunday')}
                      className={`w-1/2 py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-white border-2 border-[#9ed034] text-[#1a1a1a] shadow-[0_4px_14px_rgba(158,208,52,0.18)]'
                          : 'bg-white border border-[#eaeae6] text-[#1a1a1a] hover:border-gray-300'
                      }`}
                    >
                      Sunday
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <PrimaryButton
              testId="cooking-days-continue-btn"
              onClick={handleCookingDaysContinue}
              disabled={cookingDays.length === 0}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 15 — WEEKLY FOOD BUDGET                           */}
      {/* ======================================================== */}
      {step === 15 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
              what&apos;s your weekly budget?
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mb-10">
              slide to what you&apos;re happy to spend on those days
            </p>

            {/* Budget Amount Display */}
            <div className="text-center my-6">
              <div data-testid="budget-amount-display" className="text-6xl sm:text-7xl font-extrabold text-[#1a1a1a]">
                {currencyConfig.symbol}{weeklyBudget}
              </div>
              <div className="text-sm text-[#8c8c88] font-medium mt-2">this week</div>
            </div>

            {/* Slider Control */}
            <div className="my-8 px-2">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 flex items-center">
                  <input
                    type="range"
                    data-testid="budget-slider"
                    min={currencyConfig.minBudget}
                    max={currencyConfig.maxBudget}
                    step={currencyConfig.step}
                    value={weeklyBudget}
                    onChange={(e) => setWeeklyBudget(Number(e.target.value))}
                    className="w-full h-2 bg-[#EAEAE6] rounded-lg appearance-none cursor-pointer accent-[#F5C242]"
                  />
                </div>
                <div className="text-sm font-bold text-[#8c8c88] whitespace-nowrap min-w-[50px] text-right">
                  {currencyConfig.symbol}{currencyConfig.maxBudget}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <PrimaryButton
              testId="budget-continue-btn"
              onClick={handleBudgetContinue}
              disabled={weeklyBudget <= 0}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 16 — WEEKLY SAVINGS INTRODUCTION                  */}
      {/* ======================================================== */}
      {step === 16 && (
        <div className="flex-1 flex flex-col justify-between py-6 text-center animate-fadeIn">
          <div className="flex flex-col items-center justify-center my-auto">
            <SavingsCelebrationIllustration size={160} />

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mt-6 mb-2">
              you could save an average of
            </h1>

            <div
              data-testid="savings-weekly-amount"
              className="text-6xl sm:text-7xl font-black text-[#8bc020] my-2"
            >
              {currencySavings.labelWeekly}
            </div>

            <p className="text-base sm:text-lg text-[#8c8c88] font-medium mb-6">
              on your shopping every week
            </p>

            <h2
              data-testid="savings-yearly-statement"
              className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a]"
            >
              that&apos;s {currencySavings.labelYearly}
            </h2>
          </div>

          <div className="pt-6">
            <PrimaryButton
              testId="screen16-continue-btn"
              onClick={handleScreen16Continue}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 17 — MOOD SELECTION                               */}
      {/* ======================================================== */}
      {step === 17 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
              what are you in the mood for?
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mb-4">
              pick up to 3
            </p>

            {moodWarning && (
              <div
                data-testid="mood-warning-banner"
                className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl mb-3 animate-fadeIn"
              >
                {moodWarning}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {MOOD_OPTIONS.filter((m) => !m.fullWidth).map((mood) => {
                  const isSelected = selectedMoods.includes(mood.id);
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      data-testid={`mood-option-${mood.id}`}
                      onClick={() => handleToggleMood(mood.id)}
                      className={`w-full py-5 px-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-white border-2 border-[#9ed034] text-[#1a1a1a] shadow-[0_4px_14px_rgba(158,208,52,0.18)]'
                          : 'bg-white border border-[#eaeae6] text-[#1a1a1a] hover:border-gray-300'
                      }`}
                    >
                      <span className="text-3xl mb-2 select-none">{mood.emoji}</span>
                      <span className="font-bold text-sm sm:text-base text-center leading-snug">
                        {mood.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Full width Protein Packed option on last row */}
              {(() => {
                const protein = MOOD_OPTIONS.find((m) => m.fullWidth);
                if (!protein) return null;
                const isSelected = selectedMoods.includes(protein.id);
                return (
                  <button
                    type="button"
                    data-testid={`mood-option-${protein.id}`}
                    onClick={() => handleToggleMood(protein.id)}
                    className={`w-full py-5 px-4 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-2 border-[#9ed034] text-[#1a1a1a] shadow-[0_4px_14px_rgba(158,208,52,0.18)]'
                        : 'bg-white border border-[#eaeae6] text-[#1a1a1a] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-3xl mb-1 select-none">{protein.emoji}</span>
                    <span className="font-bold text-sm sm:text-base text-center">
                      {protein.label}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>

          <div className="pt-6">
            <PrimaryButton
              testId="moods-continue-btn"
              onClick={handleMoodContinue}
              disabled={selectedMoods.length === 0}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 18 — DIETARY NEEDS                                */}
      {/* ======================================================== */}
      {step === 18 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
              any dietary needs?
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mb-5">
              pick all that apply
            </p>

            <div className="grid grid-cols-2 gap-3">
              {DIETARY_OPTIONS.map((opt) => {
                const isSelected = selectedDietary.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`dietary-option-${opt.id}`}
                    onClick={() => handleToggleDietary(opt.id)}
                    className={`w-full py-6 px-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-2 border-[#9ed034] text-[#1a1a1a] shadow-[0_4px_14px_rgba(158,208,52,0.18)]'
                        : 'bg-white border border-[#eaeae6] text-[#1a1a1a] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-3xl mb-2 select-none">{opt.emoji}</span>
                    <span className="font-bold text-sm sm:text-base text-center">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6">
            <PrimaryButton
              testId="dietary-continue-btn"
              onClick={handleDietaryContinue}
              disabled={selectedDietary.length === 0}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 19 — ALLERGIES                                    */}
      {/* ======================================================== */}
      {step === 19 && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
              any allergies?
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mb-4">
              pick all that apply
            </p>

            <div className="grid grid-cols-2 gap-3 max-h-[58vh] sm:max-h-none overflow-y-auto pr-1">
              {ALLERGY_OPTIONS.map((opt) => {
                const isSelected = selectedAllergies.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`allergy-option-${opt.id}`}
                    onClick={() => handleToggleAllergy(opt.id)}
                    className={`w-full py-5 px-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-2 border-[#9ed034] text-[#1a1a1a] shadow-[0_4px_14px_rgba(158,208,52,0.18)]'
                        : 'bg-white border border-[#eaeae6] text-[#1a1a1a] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-3xl mb-1.5 select-none">{opt.emoji}</span>
                    <span className="font-bold text-sm sm:text-base text-center">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6">
            <PrimaryButton
              testId="allergies-continue-btn"
              onClick={handleAllergyContinue}
              disabled={selectedAllergies.length === 0}
            >
              continue
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 20 — KITCHEN APPLIANCES & GENERATE PLAN           */}
      {/* ======================================================== */}
      {step === 20 && !batch5Complete && (
        <div className="flex-1 flex flex-col justify-between py-5 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
              what appliances do you have?
            </h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mb-4">
              select at least one to plan with
            </p>

            {applianceError && (
              <div
                data-testid="appliance-error-message"
                className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-xl mb-3 animate-fadeIn flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{applianceError}</span>
              </div>
            )}

            {/* Interactive Kitchen Illustration with Clickable Hotspots */}
            <KitchenIllustration
              selectedAppliances={selectedAppliances}
              onToggleAppliance={handleToggleAppliance}
            />

            {/* Direct Tactile Appliance Cards */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {APPLIANCE_OPTIONS.map((app) => {
                const isSelected = selectedAppliances.includes(app.id);
                return (
                  <button
                    key={app.id}
                    type="button"
                    data-testid={`appliance-chip-${app.id}`}
                    onClick={() => handleToggleAppliance(app.id)}
                    className={`py-3 px-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-2 border-[#9ed034] text-[#1a1a1a] shadow-[0_2px_8px_rgba(158,208,52,0.18)]'
                        : 'bg-white border border-[#eaeae6] text-[#6b6b6b] hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{app.emoji}</span>
                      <span>{app.label}</span>
                    </span>
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-[#9ed034] text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-gray-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-5">
            <button
              type="button"
              data-testid="generate-plan-btn"
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan || selectedAppliances.length === 0}
              className={`w-full py-4 rounded-full font-bold text-base sm:text-lg transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                selectedAppliances.length === 0 || isGeneratingPlan
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-[#9ED034] to-[#8BC020] text-[#1a1a1a] hover:opacity-95 active:scale-[0.99] shadow-[0_4px_16px_rgba(158,208,52,0.35)]'
              }`}
            >
              <Sparkles className="w-5 h-5 text-[#1a1a1a]" />
              <span>{isGeneratingPlan ? 'generating plan...' : 'generate plan'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 21 — LOVED BY HOME COOKS                          */}
      {/* ======================================================== */}
      {step === 21 && !batch5Complete && (
        <TestimonialsScreen onContinue={handleContinueFromTestimonials} />
      )}

      {/* ======================================================== */}
      {/* SCREEN 22 — BUILDING YOUR WEEK                           */}
      {/* ======================================================== */}
      {step === 22 && !batch5Complete && (
        <BuildingWeekScreen
          userName={name}
          preferences={{
            supermarket: 'Aldi',
            householdSize,
            cookingDays,
            weeklyBudget,
            dietaryNeeds: selectedDietary,
            allergies: selectedAllergies,
            equipment: selectedAppliances,
            vibes: selectedMoods,
          }}
          isAuthenticated={Boolean(user)}
          savedPlan={generatedPlan}
          onGenerationSuccess={handlePlanGenerated}
        />
      )}

      {/* ======================================================== */}
      {/* SCREEN 23 — FREE TRIAL INTRODUCTION                      */}
      {/* ======================================================== */}
      {step === 23 && !batch5Complete && (
        <FreeTrialIntroScreen
          userName={name ? `${name}!` : 'Chef!'}
          supermarket="Aldi"
          currencySymbol={currencyConfig.symbol}
          estimatedCost={generatedPlan?.estimatedCost || weeklyBudget * 0.75}
          dinners={
            generatedPlan?.dinners?.map((d: any) => ({
              title: d.recipe?.title || 'Dinner Recipe',
              cookTime: d.recipe?.cookTimeMinutes || 25,
              emoji: '🥘',
            }))
          }
          onContinue={handleContinueFromTrialIntro}
        />
      )}

      {/* ======================================================== */}
      {/* SCREEN 24 — TRIAL REMINDER PREFERENCE                    */}
      {/* ======================================================== */}
      {step === 24 && !batch5Complete && (
        <TrialReminderScreen
          initialPreference={trialReminder}
          onContinue={handleContinueFromReminder}
        />
      )}

      {/* ======================================================== */}
      {/* SCREEN 25 — SUBSCRIPTION / PRICING                       */}
      {/* ======================================================== */}
      {step === 25 && !batch5Complete && (
        <PricingScreen
          currencyCode={selectedCurrency}
          isStartingTrial={isStartingTrial}
          onStartTrial={handleStartFreeTrial}
        />
      )}

      {/* ======================================================== */}
      {/* BATCH 5 COMPLETION HOLDING SCREEN                        */}
      {/* ======================================================== */}
      {batch5Complete && (
        <Batch5CompleteScreen
          userName={name}
          language={selectedLanguage}
          age={selectedAge}
          goal={selectedGoal}
          countryName={selectedCountryName}
          currency={selectedCurrency}
          householdSize={householdSize}
          cookingDays={cookingDays}
          budget={weeklyBudget}
          currencySymbol={currencyConfig.symbol}
          moods={selectedMoods}
          dietary={selectedDietary}
          allergies={selectedAllergies}
          appliances={selectedAppliances}
          trialReminder={trialReminder}
          selectedPlan={selectedTrialPlan}
          generatedPlan={generatedPlan}
          onReview={() => setBatch5Complete(false)}
        />
      )}

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-xl border border-gray-100 animate-scaleUp">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-[#8bc020]" />
              <h3 className="font-bold text-xl text-[#1a1a1a]">Enter Referral Code</h3>
            </div>
            <p className="text-xs text-[#6b6b6b] mb-4">
              Have an invitation or creator code? Enter it below.
            </p>
            <form onSubmit={handleApplyPromoCode} className="space-y-4">
              <input
                type="text"
                placeholder="PROMOCODE"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 uppercase font-mono tracking-wider text-center text-lg outline-none focus:border-[#9ed034]"
              />
              {codeMessage && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">{codeMessage}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCodeModal(false);
                    setCodeMessage('');
                  }}
                  className="flex-1 py-3 rounded-full text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-full text-sm font-bold bg-[#9ed034] text-white hover:bg-[#8bc020]"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
};
