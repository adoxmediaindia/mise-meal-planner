import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { secureStorage } from '../../services/secureStorage';
import {
  CountryCode,
  CurrencyCode,
  DayOfWeek,
  IOnboardingData,
  UsualCookingTime,
} from '../../types';

interface OnboardingScreenProps {
  onFinishBatch1: () => void;
  onNavigateToAuth?: () => void;
}

const TOTAL_QUESTIONS = 9;
const COMPLETED_STEP = 10;
const LEGACY_STEPS = [9, 12, 13, 14, 15, 17, 18, 19, 20];

const COUNTRIES: {
  code: CountryCode;
  name: string;
  currency: CurrencyCode;
  symbol: string;
  flag: string;
  defaultBudget: number;
  minBudget: number;
  maxBudget: number;
  step: number;
}[] = [
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸', defaultBudget: 120, minBudget: 30, maxBudget: 230, step: 5 },
  { code: 'EU', name: 'Europe', currency: 'EUR', symbol: '€', flag: '🇪🇺', defaultBudget: 110, minBudget: 30, maxBudget: 220, step: 5 },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧', defaultBudget: 95, minBudget: 25, maxBudget: 190, step: 5 },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$', flag: '🇦🇺', defaultBudget: 160, minBudget: 40, maxBudget: 300, step: 10 },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$', flag: '🇨🇦', defaultBudget: 150, minBudget: 40, maxBudget: 290, step: 10 },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', symbol: 'NZ$', flag: '🇳🇿', defaultBudget: 170, minBudget: 40, maxBudget: 320, step: 10 },
  { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$', flag: '🇧🇷', defaultBudget: 350, minBudget: 100, maxBudget: 700, step: 25 },
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', flag: '🇮🇳', defaultBudget: 4000, minBudget: 1000, maxBudget: 8000, step: 250 },
];

const COOKING_TIMES: UsualCookingTime[] = ['15–30 min', '30–45 min', '45–60 min', '60+ min'];
const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MOODS = [
  { id: 'Speedy Meals', label: 'Speedy Meals', icon: '⚡' },
  { id: 'Low Calorie', label: 'Low Calorie', icon: '⚖️' },
  { id: 'Family Favs', label: 'Family Favs', icon: '👨‍👩‍👧' },
  { id: 'Healthy Comfort', label: 'Healthy Comfort', icon: '🥗' },
  { id: 'Fakeaway', label: 'Fakeaway', icon: '🥡' },
  { id: 'Gut Friendly', label: 'Gut Friendly', icon: '🧘' },
  { id: 'Protein Packed', label: 'Protein Packed', icon: '💪' },
];
const DIETARY = [
  { id: 'None', label: 'None', icon: '🚫' },
  { id: 'Vegetarian', label: 'Vegetarian', icon: '🥕' },
  { id: 'Vegan', label: 'Vegan', icon: '🌱' },
  { id: 'Pescatarian', label: 'Pescatarian', icon: '🐟' },
];
const ALLERGIES = [
  { id: 'None', label: 'None', icon: '🚫' },
  { id: 'Gluten free', label: 'Gluten free', icon: '🌾' },
  { id: 'Dairy free', label: 'Dairy free', icon: '🥛' },
  { id: 'Nut free', label: 'Nut free', icon: '🥜' },
  { id: 'Egg free', label: 'Egg free', icon: '🥚' },
  { id: 'Shellfish free', label: 'Shellfish free', icon: '🦐' },
  { id: 'Sesame free', label: 'Sesame free', icon: '🧂' },
  { id: 'Soy free', label: 'Soy free', icon: '🫘' },
];
const APPLIANCES: { id: string; label: string; icon: string }[] = [
  { id: 'Stovetop', label: 'Stovetop', icon: '🍳' },
  { id: 'Oven', label: 'Oven', icon: '♨️' },
  { id: 'Air Fryer', label: 'Air Fryer', icon: '🍟' },
  { id: 'Microwave', label: 'Microwave', icon: '📻' },
];

const getLegacyStep = (step: number): number => LEGACY_STEPS[step - 1] || 25;

const ChoiceCard: React.FC<{
  label: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}> = ({ label, icon, selected, onPress, compact = false }) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityState={{ selected }}
    activeOpacity={0.78}
    onPress={onPress}
    style={[
      styles.choiceCard,
      compact && styles.choiceCardCompact,
      selected && styles.choiceCardSelected,
    ]}
  >
    {icon ? <Text style={styles.choiceIcon}>{icon}</Text> : null}
    <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
    <View style={[styles.checkMark, selected && styles.checkMarkSelected]}>
      {selected ? <Text style={styles.checkMarkText}>✓</Text> : null}
    </View>
  </TouchableOpacity>
);

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onFinishBatch1,
  onNavigateToAuth,
}) => {
  const { updateOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [cookingTime, setCookingTime] = useState<UsualCookingTime | null>('30–45 min');
  const [countryCode, setCountryCode] = useState<CountryCode | null>(null);
  const [householdSize, setHouseholdSize] = useState(4);
  const [cookingDays, setCookingDays] = useState<DayOfWeek[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]);
  const [weeklyBudget, setWeeklyBudget] = useState(120);
  const [moods, setMoods] = useState<string[]>(['Speedy Meals', 'Low Calorie']);
  const [dietary, setDietary] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [appliances, setAppliances] = useState<string[]>(['Stovetop', 'Oven', 'Air Fryer']);
  const [editedQuestions, setEditedQuestions] = useState<Record<number, boolean>>({});
  const animation = useRef(new Animated.Value(1)).current;
  const finishCallback = useRef(onFinishBatch1);
  const finishRedirected = useRef(false);

  const markQuestionEdited = (question: number) => {
    setEditedQuestions((current) => ({ ...current, [question]: true }));
  };

  useEffect(() => {
    finishCallback.current = onFinishBatch1;
  }, [onFinishBatch1]);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [animation, step]);

  useEffect(() => {
    let active = true;

    const restore = async () => {
      const saved = await secureStorage.getGuestOnboarding();
      if (!active) return;

      if (saved) {
        const restoredQuestions: number[] = [];
        if (saved.usualCookingTime) {
          setCookingTime(saved.usualCookingTime);
          restoredQuestions.push(1);
        }
        if (saved.countryCode && COUNTRIES.some((country) => country.code === saved.countryCode)) {
          setCountryCode(saved.countryCode);
          restoredQuestions.push(2);
        }
        if (saved.householdSize !== undefined) {
          setHouseholdSize(saved.householdSize);
          restoredQuestions.push(3);
        }
        if (Array.isArray(saved.cookingDays)) {
          setCookingDays(saved.cookingDays);
          restoredQuestions.push(4);
        }
        if (saved.weeklyBudget !== undefined) {
          setWeeklyBudget(saved.weeklyBudget);
          restoredQuestions.push(5);
        } else if (saved.countryCode) {
          const savedCountry = COUNTRIES.find((country) => country.code === saved.countryCode);
          if (savedCountry) setWeeklyBudget(savedCountry.defaultBudget);
        }
        if (Array.isArray(saved.mealMoods)) {
          setMoods(saved.mealMoods);
          restoredQuestions.push(6);
        }
        if (Array.isArray(saved.dietaryPreferences)) {
          setDietary(saved.dietaryPreferences);
          restoredQuestions.push(7);
        }
        if (Array.isArray(saved.allergies)) {
          setAllergies(saved.allergies);
          restoredQuestions.push(8);
        }
        if (Array.isArray(saved.appliances)) {
          setAppliances(saved.appliances);
          restoredQuestions.push(9);
        }
        setEditedQuestions(Object.fromEntries(restoredQuestions.map((question) => [question, true])));
      }

      const savedProgress = await secureStorage.getOnboardingProgress();
      if (!active) return;

      if (savedProgress !== null) {
        setStep(savedProgress);
        if (savedProgress >= COMPLETED_STEP && !finishRedirected.current) {
          finishRedirected.current = true;
          finishCallback.current();
        }
      } else {
        const legacyStep = Number(saved?.onboardingStep || 0);
        if (legacyStep >= 21) {
          setStep(COMPLETED_STEP);
          finishRedirected.current = true;
          finishCallback.current();
        } else if (legacyStep >= 20) {
          setStep(9);
        } else if (legacyStep >= 19) {
          setStep(8);
        } else if (legacyStep >= 18) {
          setStep(7);
        } else if (legacyStep >= 16) {
          setStep(6);
        } else if (legacyStep >= 15) {
          setStep(5);
        } else if (legacyStep >= 14) {
          setStep(4);
        } else if (legacyStep >= 13) {
          setStep(3);
        } else if (legacyStep >= 12) {
          setStep(2);
        } else if (legacyStep >= 9) {
          setStep(1);
        }
      }
      setIsRestoring(false);
    };

    restore().catch((error: unknown) => {
      console.warn('[Onboarding] Could not restore saved progress:', error);
      if (active) setIsRestoring(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const selectedCountry = COUNTRIES.find((item) => item.code === countryCode);
  const country = selectedCountry || COUNTRIES[0];
  const progress = step > 0 ? Math.min(step, TOTAL_QUESTIONS) / TOTAL_QUESTIONS : 0;
  const animationStyle = {
    opacity: animation,
    transform: [
      {
        translateX: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  const toggleMultiSelect = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    noneValue?: string
  ) => {
    if (noneValue && value === noneValue) {
      setSelected([noneValue]);
      return;
    }
    const withoutNone = noneValue ? selected.filter((item) => item !== noneValue) : selected;
    const next = withoutNone.includes(value)
      ? withoutNone.filter((item) => item !== value)
      : [...withoutNone, value];
    setSelected(next);
  };

  const saveAndContinue = async () => {
    if (isSaving || step < 1 || step > TOTAL_QUESTIONS) return;
    if (step === 1 && !cookingTime) return;
    if (step === 2 && !selectedCountry) return;
    if (step === 4 && cookingDays.length === 0) return;
    if (step === 6 && (moods.length === 0 || moods.length > 3)) return;
    if (step === 7 && dietary.length === 0) return;
    if (step === 8 && allergies.length === 0) return;
    if (step === 9 && appliances.length === 0) return;
    if (step === 5 && !selectedCountry) return;

    setSaveError('');
    setIsSaving(true);
    const nextStep = step === TOTAL_QUESTIONS ? COMPLETED_STEP : step + 1;
    const stepData: Record<number, Partial<IOnboardingData>> = {
      1: { usualCookingTime: cookingTime ?? undefined },
      2: selectedCountry ? {
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
        currencyCode: selectedCountry.currency,
      } : {},
      3: { householdSize },
      4: { cookingDays: DAYS.filter((day) => cookingDays.includes(day)) },
      5: selectedCountry ? { weeklyBudget, weeklyBudgetCurrency: selectedCountry.currency } : {},
      6: { mealMoods: moods },
      7: { dietaryPreferences: dietary },
      8: { allergies },
      9: { appliances },
    };

    try {
      await updateOnboarding({
        ...stepData[step],
        onboardingStep: step === TOTAL_QUESTIONS ? 25 : getLegacyStep(step),
        onboardingCompleted: false,
      });
      await secureStorage.setOnboardingProgress(nextStep);
      if (nextStep === COMPLETED_STEP) {
        finishRedirected.current = true;
        finishCallback.current();
      } else {
        animation.setValue(0);
        setStep(nextStep);
      }
    } catch (error) {
      console.warn('[Onboarding] Could not save answer:', error);
      setSaveError('We couldn’t save that just yet. Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    if (step <= 0 || isSaving) return;
    setSaveError('');
    animation.setValue(0);
    const previousStep = step - 1;
    setStep(previousStep);
    secureStorage.setOnboardingProgress(previousStep).catch((error: unknown) => {
      console.warn('[Onboarding] Could not update saved progress:', error);
    });
  };

  const renderChoices = (
    options: { id: string; label: string; icon?: string }[],
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    optionsPerRow = 1,
    noneValue?: string,
    maxSelections?: number,
    question?: number
  ) => (
    <View style={[styles.choiceGrid, optionsPerRow === 2 && styles.choiceGridTwoColumn]}>
      {options.map((option) => (
        <ChoiceCard
          key={option.id}
          label={option.label}
          icon={option.icon}
          selected={selected.includes(option.id)}
          onPress={() => {
            if (
              maxSelections &&
              !selected.includes(option.id) &&
              selected.length >= maxSelections
            ) {
              return;
            }
            if (question !== undefined) markQuestionEdited(question);
            toggleMultiSelect(option.id, selected, setSelected, noneValue);
          }}
          compact={optionsPerRow === 2}
        />
      ))}
    </View>
  );

  if (isRestoring) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.restoreState}>
          <ActivityIndicator size="small" color="#0D5C3A" />
        </View>
      </View>
    );
  }

  if (step === 0) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.welcome}>
          <View style={styles.brandMark}>
            <Text style={styles.brandLeaf}>✳</Text>
            <Text style={styles.brandName}>meltto</Text>
          </View>
          <View style={styles.welcomeCopy}>
            <Text style={styles.welcomeEyebrow}>A FRESH START FOR YOUR WEEK</Text>
            <Text style={styles.welcomeTitle}>Good food.{'\n'}Less figuring it out.</Text>
            <Text style={styles.welcomeDescription}>
              A few quick questions help us shape a meal plan around your home, your tastes and your budget.
            </Text>
          </View>
          <View style={styles.welcomeActions}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                animation.setValue(0);
                setStep(1);
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Get started</Text>
              <Text style={styles.primaryButtonArrow}>→</Text>
            </TouchableOpacity>
            {onNavigateToAuth ? (
              <TouchableOpacity onPress={onNavigateToAuth} style={styles.signInButton}>
                <Text style={styles.signInText}>Already have an account? <Text style={styles.signInStrong}>Sign in</Text></Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  const questionContent = (() => {
    switch (step) {
      case 1:
        return {
          title: 'how long do you usually spend cooking your meals?',
          description: editedQuestions[1]
            ? "we'll match recipes to your routine"
            : 'Suggested: 30–45 min · tap to change',
          content: (
            <View style={styles.choiceGrid}>
              {COOKING_TIMES.map((value) => (
                <ChoiceCard
                  key={value}
                  label={value}
                  selected={cookingTime === value}
                  onPress={() => {
                    markQuestionEdited(1);
                    setCookingTime(value);
                  }}
                />
              ))}
            </View>
          ),
        };
      case 2:
        return {
          title: 'where are you from?',
          description: 'choose your country to set your currency and local prices',
          content: (
            <View style={styles.countryList}>
              {COUNTRIES.map((item) => (
                <ChoiceCard
                  key={item.code}
                  label={`${item.flag}   ${item.name}`}
                  selected={countryCode === item.code}
                  onPress={() => {
                    if (countryCode !== item.code) {
                      setWeeklyBudget(item.defaultBudget);
                      setEditedQuestions((current) => ({ ...current, 5: false }));
                    }
                    setCountryCode(item.code);
                    markQuestionEdited(2);
                  }}
                />
              ))}
            </View>
          ),
        };
      case 3:
        return {
          title: 'how many are you cooking for?',
          description: editedQuestions[3]
            ? "we'll scale your meals and budget"
            : 'Suggested starting point · adjust for your household',
          content: (
            <View style={styles.centeredAnswer}>
              <View style={styles.householdControl}>
                <TouchableOpacity
                  accessibilityLabel="Decrease household size"
                  accessibilityRole="button"
                  disabled={householdSize <= 1}
                  onPress={() => {
                    markQuestionEdited(3);
                    setHouseholdSize((value) => Math.max(1, value - 1));
                  }}
                  style={[styles.stepperButton, householdSize <= 1 && styles.stepperDisabled]}
                >
                  <Text style={styles.stepperText}>−</Text>
                </TouchableOpacity>
                <View style={styles.householdValue}>
                  <Text style={styles.householdNumber}>{householdSize}</Text>
                  <Text style={styles.householdLabel}>{householdSize === 1 ? 'person' : 'people'}</Text>
                </View>
                <TouchableOpacity
                  accessibilityLabel="Increase household size"
                  accessibilityRole="button"
                  disabled={householdSize >= 20}
                  onPress={() => {
                    markQuestionEdited(3);
                    setHouseholdSize((value) => Math.min(20, value + 1));
                  }}
                  style={[styles.stepperButton, householdSize >= 20 && styles.stepperDisabled]}
                >
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ),
        };
      case 4:
        return {
          title: 'which days will you cook?',
          description: editedQuestions[4]
            ? 'pick the days you want meals planned for'
            : 'Suggested: 6 days · tap to change',
          content: (
            <View style={styles.dayGrid}>
              {DAYS.map((day) => {
                const selected = cookingDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      markQuestionEdited(4);
                      setCookingDays((current) => (
                        selected ? current.filter((value) => value !== day) : [...current, day]
                      ));
                    }}
                    style={[styles.dayCard, selected && styles.dayCardSelected]}
                  >
                    <Text style={[styles.dayLabel, selected && styles.choiceLabelSelected]}>{day}</Text>
                    {selected ? <Text style={styles.dayCheck}>✓</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ),
        };
      case 5:
        return {
          title: "what's your weekly budget?",
          description: editedQuestions[5]
            ? "set what you're happy to spend on those days"
            : 'Suggested starting point · adjust to your week',
          content: (
            <View style={styles.budgetPanel}>
              <Text style={styles.budgetValue}>{country.symbol}{weeklyBudget.toLocaleString()}</Text>
              <Text style={styles.budgetCaption}>for your planned meals this week</Text>
              <View style={styles.budgetStepper}>
                <TouchableOpacity
                  accessibilityLabel="Decrease weekly budget"
                  accessibilityRole="button"
                  disabled={weeklyBudget <= country.minBudget}
                  onPress={() => {
                    markQuestionEdited(5);
                    setWeeklyBudget((value) => Math.max(country.minBudget, value - country.step));
                  }}
                  style={[styles.stepperButton, weeklyBudget <= country.minBudget && styles.stepperDisabled]}
                >
                  <Text style={styles.stepperText}>−</Text>
                </TouchableOpacity>
                <View style={styles.budgetRange}>
                  <Text style={styles.budgetRangeText}>Adjust budget</Text>
                  <Text style={styles.budgetRangeText}>
                    {country.symbol}{country.minBudget.toLocaleString()} – {country.symbol}{country.maxBudget.toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityLabel="Increase weekly budget"
                  accessibilityRole="button"
                  disabled={weeklyBudget >= country.maxBudget}
                  onPress={() => {
                    markQuestionEdited(5);
                    setWeeklyBudget((value) => Math.min(country.maxBudget, value + country.step));
                  }}
                  style={[styles.stepperButton, weeklyBudget >= country.maxBudget && styles.stepperDisabled]}
                >
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ),
        };
      case 6:
        return {
          title: 'what are you in the mood for?',
          description: editedQuestions[6]
            ? 'pick up to 3'
            : 'Suggested: Speedy Meals + Low Calorie · pick up to 3',
          content: renderChoices(MOODS, moods, setMoods, 2, undefined, 3, 6),
        };
      case 7:
        return {
          title: 'any dietary needs?',
          description: 'pick all that apply',
          content: renderChoices(DIETARY, dietary, setDietary, 2, 'None', undefined, 7),
        };
      case 8:
        return {
          title: 'any allergies?',
          description: 'pick all that apply',
          content: renderChoices(ALLERGIES, allergies, setAllergies, 2, 'None', undefined, 8),
        };
      case 9:
        return {
          title: 'what appliances do you have?',
          description: editedQuestions[9]
            ? 'select at least one to plan with'
            : 'Suggested: Stovetop, Oven and Air Fryer · change any time',
          content: renderChoices(APPLIANCES, appliances, setAppliances, 2, undefined, undefined, 9),
        };
      default:
        return { title: '', description: '', content: null };
    }
  })();

  const isContinueDisabled =
    isSaving ||
    (step === 1 && !cookingTime) ||
    (step === 2 && !selectedCountry) ||
    (step === 5 && !selectedCountry) ||
    (step === 4 && cookingDays.length === 0) ||
    (step === 6 && (moods.length === 0 || moods.length > 3)) ||
    (step === 7 && dietary.length === 0) ||
    (step === 8 && allergies.length === 0) ||
    (step === 9 && appliances.length === 0);

  return (
    <View style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <TouchableOpacity
            accessibilityLabel={step === 1 ? 'Back to welcome' : 'Previous question'}
            accessibilityRole="button"
            onPress={goBack}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={styles.progressColumn}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressLabel}>QUESTION {step} OF {TOTAL_QUESTIONS}</Text>
          </View>
        </View>

        <Animated.View style={[styles.questionBody, animationStyle]}>
          <ScrollView
            contentContainerStyle={styles.questionScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.questionTitle}>{questionContent.title}</Text>
            <Text style={styles.questionDescription}>{questionContent.description}</Text>
            {questionContent.content}
          </ScrollView>

          <View style={styles.footer}>
            {saveError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>{saveError}</Text>
            ) : null}
            {step === 6 && moods.length >= 3 ? (
              <Text style={styles.helperText}>You’ve selected the maximum of 3.</Text>
            ) : null}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: isContinueDisabled }}
              disabled={isContinueDisabled}
              onPress={saveAndContinue}
              style={[styles.primaryButton, isContinueDisabled && styles.primaryButtonDisabled]}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {step === TOTAL_QUESTIONS ? 'Create my meal plan' : 'Continue'}
                  </Text>
                  <Text style={styles.primaryButtonArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  restoreState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 20,
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
  },
  brandLeaf: {
    fontSize: 28,
    color: '#91C929',
  },
  brandName: {
    color: '#0D5C3A',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  welcomeCopy: {
    marginTop: 64,
    marginBottom: 40,
  },
  welcomeEyebrow: {
    color: '#61805F',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 18,
  },
  welcomeTitle: {
    color: '#1D2922',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  welcomeDescription: {
    color: '#66716A',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 18,
    maxWidth: 350,
  },
  welcomeActions: {
    gap: 20,
  },
  page: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 52,
    marginBottom: 18,
  },
  backButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEECE5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14251B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  backArrow: {
    color: '#1D2922',
    fontSize: 32,
    lineHeight: 34,
    marginTop: -4,
  },
  progressColumn: {
    flex: 1,
    gap: 8,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#E8E9E1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#92C92D',
    borderRadius: 4,
  },
  progressLabel: {
    color: '#829087',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  questionBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  questionScroll: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  questionTitle: {
    color: '#202822',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 36,
    marginTop: 10,
  },
  questionDescription: {
    color: '#747E77',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 24,
  },
  choiceGrid: {
    gap: 10,
    paddingBottom: 8,
  },
  choiceGridTwoColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  choiceCard: {
    minHeight: 60,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E8E8E2',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A2B20',
    shadowOpacity: 0.035,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  choiceCardCompact: {
    width: '48.5%',
    minHeight: 78,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  choiceCardSelected: {
    borderWidth: 1.6,
    borderColor: '#8FCB25',
    backgroundColor: '#FCFFF7',
  },
  choiceIcon: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  choiceLabel: {
    color: '#26332B',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  choiceLabelSelected: {
    color: '#173A28',
  },
  checkMark: {
    width: 21,
    height: 21,
    borderWidth: 1,
    borderColor: '#D5DCD5',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkSelected: {
    borderColor: '#8FCB25',
    backgroundColor: '#8FCB25',
  },
  checkMarkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  countryList: {
    gap: 9,
    paddingBottom: 12,
  },
  centeredAnswer: {
    flex: 1,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  householdControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  stepperButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisabled: {
    opacity: 0.45,
  },
  stepperText: {
    color: '#24352A',
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 32,
  },
  householdValue: {
    alignItems: 'center',
    minWidth: 92,
  },
  householdNumber: {
    color: '#1E2922',
    fontSize: 66,
    lineHeight: 72,
    fontWeight: '800',
  },
  householdLabel: {
    color: '#8A928C',
    fontSize: 14,
    fontWeight: '600',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  dayCard: {
    width: '48.5%',
    minHeight: 58,
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E6E7E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dayCardSelected: {
    borderColor: '#8FCB25',
    backgroundColor: '#FCFFF7',
  },
  dayLabel: {
    color: '#344137',
    fontSize: 14,
    fontWeight: '700',
  },
  dayCheck: {
    color: '#6DA61C',
    fontWeight: '800',
  },
  budgetPanel: {
    flex: 1,
    minHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  budgetValue: {
    color: '#1E2922',
    fontSize: 48,
    lineHeight: 58,
    fontWeight: '800',
    letterSpacing: -1,
  },
  budgetCaption: {
    color: '#88918A',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  budgetStepper: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 36,
  },
  budgetRange: {
    alignItems: 'center',
    gap: 5,
  },
  budgetRangeText: {
    color: '#7D887F',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 10,
    gap: 8,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: '#0D5C3A',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0D5C3A',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#A8B9AE',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  primaryButtonArrow: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },
  signInButton: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: '#7C877F',
    fontSize: 13,
  },
  signInStrong: {
    color: '#0D5C3A',
    fontWeight: '800',
  },
  errorText: {
    color: '#A6352F',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  helperText: {
    color: '#7B877F',
    fontSize: 12,
    textAlign: 'center',
  },
});
