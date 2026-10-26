import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { usePlan } from '../../context/PlanContext';
import {
  Supermarket,
  DayOfWeek,
  DietaryNeed,
  Allergen,
  KitchenEquipment,
  MealVibe,
} from '../../types';
import { Button } from '../../components/common/Button';

const SUPERMARKETS: Supermarket[] = [
  'Aldi',
  'Walmart',
  'Kroger',
  'Costco',
  'Publix',
  'Safeway',
  'H-E-B',
  'Whole Foods',
  "Trader Joe's",
  'Food Lion',
  'Sprouts',
];

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
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

const EQUIPMENT: KitchenEquipment[] = [
  'Hob Only',
  'Oven',
  'Slow Cooker',
  'Air Fryer',
  'Blender',
];

const VIBES: MealVibe[] = [
  'Speedy Meals',
  'Low Calorie',
  'Family Favs',
  'Healthy Comfort',
  'Fakeaway',
  'Gut Friendly',
  'Protein Packed',
  'British Staples',
];

export const PreferencesScreen: React.FC = () => {
  const { preferences, updatePreferences, isLoading } = usePlan();

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
  const [equipment, setEquipment] = useState<KitchenEquipment[]>(['Hob Only', 'Oven']);
  const [vibes, setVibes] = useState<MealVibe[]>(['Speedy Meals', 'Family Favs']);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
    }
  }, [preferences]);

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

  const handleSave = async () => {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Household Preferences</Text>
        <Text style={styles.subtitle}>
          Customizes recipe safety filters, grocery scaling, and budget targets
        </Text>
      </View>

      {savedSuccess && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✓ Preferences updated and meal plan regenerated!</Text>
        </View>
      )}

      {/* 1. Supermarket Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred Supermarket</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {SUPERMARKETS.map((store) => (
            <TouchableOpacity
              key={store}
              style={[styles.chip, supermarket === store && styles.chipActive]}
              onPress={() => setSupermarket(store)}
            >
              <Text
                style={[styles.chipText, supermarket === store && styles.chipTextActive]}
              >
                {store}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 2. Household Size */}
      <View style={styles.section}>
        <View style={styles.stepperRow}>
          <View>
            <Text style={styles.sectionTitle}>Household Size</Text>
            <Text style={styles.sectionSub}>Scaling for ingredients & shopping lists</Text>
          </View>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setHouseholdSize(Math.max(1, householdSize - 1))}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{householdSize} persons</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setHouseholdSize(Math.min(12, householdSize + 1))}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. Cooking Days */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cooking Days</Text>
        <View style={styles.daysGrid}>
          {DAYS.map((day) => {
            const active = cookingDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayButton, active && styles.dayButtonActive]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[styles.dayButtonText, active && styles.dayButtonTextActive]}>
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Strict Allergy Safety Filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strict Allergy Exclusion</Text>
        <Text style={styles.sectionSub}>
          Safety guarantee: recipes with selected allergens are 100% eliminated
        </Text>
        <View style={styles.chipWrap}>
          {ALLERGENS.map((allergen) => {
            const active = allergies.includes(allergen);
            return (
              <TouchableOpacity
                key={allergen}
                style={[styles.chip, active && styles.allergyActive]}
                onPress={() => toggleAllergy(allergen)}
              >
                <Text style={[styles.chipText, active && styles.chipTextLight]}>
                  {active ? `🚫 ${allergen}` : allergen}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 5. Dietary Needs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Needs</Text>
        <View style={styles.chipWrap}>
          {DIETARY.map((diet) => {
            const active = dietaryNeeds.includes(diet);
            return (
              <TouchableOpacity
                key={diet}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleDietary(diet)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {diet}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 6. Meal Vibes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Vibes (Max 3)</Text>
        <View style={styles.chipWrap}>
          {VIBES.map((v) => {
            const active = vibes.includes(v);
            return (
              <TouchableOpacity
                key={v}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleVibe(v)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {v}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Save Button */}
      <Button
        title="Save & Regenerate Plan"
        onPress={handleSave}
        loading={isLoading}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  scroll: {
    padding: 18,
    paddingBottom: 50,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  successBanner: {
    backgroundColor: '#DEF7EC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#31C48D',
  },
  successText: {
    color: '#03543F',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12,
  },
  chipRow: {
    marginTop: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
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
  allergyActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  chipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextLight: {
    color: '#FFFFFF',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 4,
    gap: 12,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D5C3A',
  },
  stepperValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  dayButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    marginTop: 10,
  },
});
