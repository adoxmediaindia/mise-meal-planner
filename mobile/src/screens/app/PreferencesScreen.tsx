import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { usePlan } from '../../context/PlanContext';
import { useAuth } from '../../context/AuthContext';
import {
  Supermarket,
  DayOfWeek,
  DietaryNeed,
  Allergen,
  KitchenEquipment,
  MealVibe,
  CountryCode,
  CurrencyCode,
} from '../../types';
import { Button } from '../../components/common/Button';

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

const DIETARY: DietaryNeed[] = [
  'None',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
];

const ALLERGENS: Allergen[] = [
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

const VIBES: { id: MealVibe; label: string; emoji: string }[] = [
  { id: 'Speedy Meals', label: 'Speedy Meals', emoji: '⚡' },
  { id: 'Low Calorie', label: 'Low Calorie', emoji: '⚖️' },
  { id: 'Family Favs', label: 'Family Favs', emoji: '👨‍👩‍👧' },
  { id: 'Healthy Comfort', label: 'Healthy Comfort', emoji: '🥗' },
  { id: 'Fakeaway', label: 'Fakeaway', emoji: '🥡' },
  { id: 'Gut Friendly', label: 'Gut Friendly', emoji: '🧘' },
  { id: 'Protein Packed', label: 'Protein Packed', emoji: '💪' },
];

interface PreferencesScreenProps {
  onBackToProfile?: () => void;
}

export const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ onBackToProfile }) => {
  const { preferences, updatePreferences, isLoading } = usePlan();
  const { user } = useAuth();

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('US');
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  const [supermarket, setSupermarket] = useState<Supermarket>('Aldi');
  const [householdSize, setHouseholdSize] = useState<number>(2);
  const [cookingDays, setCookingDays] = useState<DayOfWeek[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const [weeklyBudget, setWeeklyBudget] = useState<number>(40);
  const [dietaryNeeds, setDietaryNeeds] = useState<DietaryNeed[]>(['None']);
  const [allergies, setAllergies] = useState<Allergen[]>([]);
  const [vibes, setVibes] = useState<MealVibe[]>(['Speedy Meals', 'Family Favs']);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize from existing preferences or user onboarding data
  useEffect(() => {
    if (preferences) {
      if (preferences.supermarket) setSupermarket(preferences.supermarket);
      if (preferences.householdSize) setHouseholdSize(preferences.householdSize);
      if (preferences.cookingDays && preferences.cookingDays.length > 0) setCookingDays(preferences.cookingDays);
      if (preferences.weeklyBudget) setWeeklyBudget(preferences.weeklyBudget);
      if (preferences.dietaryNeeds) setDietaryNeeds(preferences.dietaryNeeds);
      if (preferences.allergies) setAllergies(preferences.allergies);
      if (preferences.vibes) setVibes(preferences.vibes);

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
  const availableSupermarkets = COUNTRY_SUPERMARKETS[selectedCountry] || COUNTRY_SUPERMARKETS.US;

  const handleSelectCountry = (country: CountryConfig) => {
    setSelectedCountry(country.code);
    setIsCountryModalOpen(false);

    // Switch default supermarket to first store of selected country if current not present
    const stores = COUNTRY_SUPERMARKETS[country.code] || [];
    if (!stores.includes(supermarket)) {
      setSupermarket((stores[0] as Supermarket) || 'Aldi');
    }

    // Adjust budget if current is outside new country's reasonable range
    if (country.code === 'IN' && weeklyBudget < 1000) {
      setWeeklyBudget(country.defaultBudget);
    } else if (country.code !== 'IN' && country.code !== 'BR' && weeklyBudget > 600) {
      setWeeklyBudget(country.defaultBudget);
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    if (cookingDays.includes(day)) {
      if (cookingDays.length === 1) {
        Alert.alert('Minimum days', 'Select at least one cooking day.');
        return;
      }
      setCookingDays(cookingDays.filter((d) => d !== day));
    } else {
      setCookingDays([...cookingDays, day]);
    }
  };

  const toggleAllergy = (allergen: Allergen) => {
    if (allergies.includes(allergen)) {
      setAllergies(allergies.filter((a) => a !== allergen));
    } else {
      setAllergies([...allergies, allergen]);
    }
  };

  const toggleDietary = (diet: DietaryNeed) => {
    if (diet === 'None') {
      setDietaryNeeds(['None']);
    } else {
      const filtered = dietaryNeeds.filter((d) => d !== 'None');
      if (filtered.includes(diet)) {
        const next = filtered.filter((d) => d !== diet);
        setDietaryNeeds(next.length ? next : ['None']);
      } else {
        setDietaryNeeds([...filtered, diet]);
      }
    }
  };

  const toggleVibe = (vibe: MealVibe) => {
    if (vibes.includes(vibe)) {
      setVibes(vibes.filter((v) => v !== vibe));
    } else {
      if (vibes.length >= 3) {
        Alert.alert('Max Vibes', 'You can select up to 3 dinner vibes.');
        return;
      }
      setVibes([...vibes, vibe]);
    }
  };

  const adjustBudget = (direction: 'up' | 'down') => {
    const delta = currentCountryConfig.step;
    if (direction === 'up') {
      setWeeklyBudget(Math.min(currentCountryConfig.maxBudget, weeklyBudget + delta));
    } else {
      setWeeklyBudget(Math.max(currentCountryConfig.minBudget, weeklyBudget - delta));
    }
  };

  const handleSave = async () => {
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
          vibes,
        },
        true
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update preferences.');
    }
  };

  return (
    <View style={styles.container}>
      {onBackToProfile ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onBackToProfile}
          style={styles.backToProfile}
        >
          <Text style={styles.backToProfileText}>‹  Profile</Text>
        </TouchableOpacity>
      ) : null}
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header matching Screenshot 3: PLAN SETTINGS / preferences */}
        <View style={styles.header}>
          <Text style={styles.headerOverline}>PLAN SETTINGS</Text>
          <Text style={styles.headerTitle}>preferences</Text>
        </View>

        {/* User Card matching Screenshot 3: Hi, Name / Shopping at Supermarket */}
        <View style={styles.userCard}>
          <View style={styles.userCardInfo}>
            <View style={styles.userGreetingRow}>
              <Text style={styles.userGreeting}>Hi, {user?.name || 'Cook'}</Text>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
            <Text style={styles.userSupermarket}>Shopping at {supermarket}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {user?.name ? user.name[0].toUpperCase() : 'C'}
            </Text>
          </View>
        </View>

        {savedSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Preferences updated and plan regenerated!</Text>
          </View>
        )}

        {/* 1. Country & Currency Selector */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Country &amp; Currency</Text>
          <TouchableOpacity
            style={styles.countryPickerBtn}
            onPress={() => setIsCountryModalOpen(true)}
          >
            <View style={styles.countryPickerLeft}>
              <Text style={styles.countryFlag}>{currentCountryConfig.flag}</Text>
              <View>
                <Text style={styles.countryName}>{currentCountryConfig.name}</Text>
                <Text style={styles.countryCurrency}>
                  {currentCountryConfig.currency} ({currentCountryConfig.symbol})
                </Text>
              </View>
            </View>
            <Text style={styles.countryPickerChevron}>▾ Change</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Preferred Supermarket based on Country */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Supermarket</Text>
          <Text style={styles.cardSub}>
            Recipes and shopping prices tailored for {currentCountryConfig.name}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {availableSupermarkets.map((store) => {
              const active = supermarket === store;
              return (
                <TouchableOpacity
                  key={store}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSupermarket(store as Supermarket)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {store}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Days to Cook matching Screenshot 3: Circular (M) (T) (W) (T) (F) (S) (S) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>days to cook</Text>
            <Text style={styles.cardHeaderCount}>{cookingDays.length} days selected</Text>
          </View>
          <View style={styles.circularDaysRow}>
            {DAYS_SHORT.map(({ day, letter }, index) => {
              const active = cookingDays.includes(day);
              return (
                <TouchableOpacity
                  key={`${day}-${index}`}
                  style={[styles.circularDay, active && styles.circularDayActive]}
                  onPress={() => toggleDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.circularDayText, active && styles.circularDayTextActive]}>
                    {letter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Weekly Budget matching Screenshot 3 */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>weekly budget</Text>
            <Text style={styles.budgetValueHighlight}>
              {currentCountryConfig.symbol}{weeklyBudget.toLocaleString()}
            </Text>
          </View>

          <View style={styles.budgetControlRow}>
            <TouchableOpacity
              style={styles.budgetStepBtn}
              onPress={() => adjustBudget('down')}
            >
              <Text style={styles.budgetStepBtnText}>−</Text>
            </TouchableOpacity>

            <View style={styles.budgetValueCenter}>
              <Text style={styles.budgetValueMain}>
                {currentCountryConfig.symbol}{weeklyBudget.toLocaleString()}
              </Text>
              <Text style={styles.budgetRangeSub}>
                Range: {currentCountryConfig.symbol}{currentCountryConfig.minBudget} – {currentCountryConfig.symbol}{currentCountryConfig.maxBudget}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.budgetStepBtn}
              onPress={() => adjustBudget('up')}
            >
              <Text style={styles.budgetStepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Household Servings */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardLabel}>household size</Text>
              <Text style={styles.cardSub}>Scales ingredients and portions</Text>
            </View>
            <View style={styles.householdStepper}>
              <TouchableOpacity
                style={styles.householdStepBtn}
                onPress={() => setHouseholdSize(Math.max(1, householdSize - 1))}
              >
                <Text style={styles.householdStepText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.householdValText}>{householdSize} {householdSize === 1 ? 'person' : 'persons'}</Text>
              <TouchableOpacity
                style={styles.householdStepBtn}
                onPress={() => setHouseholdSize(Math.min(12, householdSize + 1))}
              >
                <Text style={styles.householdStepText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 6. Meal Vibes matching Screenshot 3 */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>meal vibes</Text>
            <Text style={styles.cardHeaderCount}>{vibes.length}/3 selected</Text>
          </View>
          <View style={styles.chipWrap}>
            {VIBES.map((v) => {
              const active = vibes.includes(v.id);
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vibeChip, active && styles.vibeChipActive]}
                  onPress={() => toggleVibe(v.id)}
                >
                  <Text style={[styles.vibeChipText, active && styles.vibeChipTextActive]}>
                    {v.emoji} {v.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 7. Dietary Requirements matching Screenshot 4 */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>dietary requirements</Text>
          <View style={styles.chipWrap}>
            {DIETARY.map((diet) => {
              const active = dietaryNeeds.includes(diet);
              return (
                <TouchableOpacity
                  key={diet}
                  style={[styles.dietChip, active && styles.dietChipActive]}
                  onPress={() => toggleDietary(diet)}
                >
                  <Text style={[styles.dietChipText, active && styles.dietChipTextActive]}>
                    {diet === 'None' ? 'None' : `🌱 ${diet}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 8. Allergies matching Screenshot 4 */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>allergies</Text>
          <Text style={styles.cardSub}>Recipes with these allergens are strictly excluded</Text>
          <View style={styles.chipWrap}>
            {ALLERGENS.map((allergen) => {
              const active = allergies.includes(allergen);
              return (
                <TouchableOpacity
                  key={allergen}
                  style={[styles.allergyChip, active && styles.allergyChipActive]}
                  onPress={() => toggleAllergy(allergen)}
                >
                  <Text style={[styles.allergyChipText, active && styles.allergyChipTextActive]}>
                    {active ? `🚫 ${allergen}` : allergen}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.actionContainer}>
          <Button
            title="Save preferences"
            onPress={handleSave}
            loading={isLoading}
            variant="primary"
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>

      {/* Country Selection Modal */}
      <Modal visible={isCountryModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country &amp; Currency</Text>
              <TouchableOpacity onPress={() => setIsCountryModalOpen(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalCountryList}>
              {COUNTRIES.map((c) => {
                const selected = selectedCountry === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.modalCountryItem, selected && styles.modalCountryItemSelected]}
                    onPress={() => handleSelectCountry(c)}
                  >
                    <Text style={styles.modalCountryFlag}>{c.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalCountryName, selected && styles.modalCountryNameSelected]}>
                        {c.name}
                      </Text>
                      <Text style={styles.modalCountrySub}>
                        Currency: {c.currency} ({c.symbol})
                      </Text>
                    </View>
                    {selected && <Text style={styles.modalCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  backToProfile: {
    minHeight: 44,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  backToProfileText: {
    color: '#0D5C3A',
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerOverline: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  userCardInfo: {
    flex: 1,
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userGreeting: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  editIcon: {
    fontSize: 14,
  },
  userSupermarket: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
    fontWeight: '600',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D5C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  successBanner: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  successText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    textTransform: 'lowercase',
  },
  cardHeaderCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  countryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
  },
  countryPickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryFlag: {
    fontSize: 26,
  },
  countryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  countryCurrency: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  countryPickerChevron: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D5C3A',
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  circularDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  circularDay: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FAF9F5',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularDayActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  circularDayText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4B5563',
  },
  circularDayTextActive: {
    color: '#FFFFFF',
  },
  budgetValueHighlight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D5C3A',
  },
  budgetControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 10,
    marginTop: 6,
  },
  budgetStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetStepBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  budgetValueCenter: {
    alignItems: 'center',
  },
  budgetValueMain: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  budgetRangeSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  householdStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  householdStepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  householdStepText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  householdValText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 6,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  vibeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vibeChipActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  vibeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  vibeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dietChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dietChipActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  dietChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  dietChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  allergyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  allergyChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  allergyChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  allergyChipTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  actionContainer: {
    marginTop: 8,
  },
  saveBtn: {
    borderRadius: 16,
    height: 52,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    padding: 4,
  },
  modalCountryList: {
    marginBottom: 10,
  },
  modalCountryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 8,
    gap: 12,
  },
  modalCountryItemSelected: {
    borderColor: '#0D5C3A',
    backgroundColor: '#F0FDF4',
  },
  modalCountryFlag: {
    fontSize: 26,
  },
  modalCountryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  modalCountryNameSelected: {
    color: '#0D5C3A',
  },
  modalCountrySub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  modalCheck: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D5C3A',
  },
});
