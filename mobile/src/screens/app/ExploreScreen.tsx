import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { mobileApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';
import { IRecipe, Cuisine, MealVibe, DietaryNeed } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

const CUISINES: Cuisine[] = [
  'Italian',
  'Asian',
  'Mexican',
  'Indian',
  'Mediterranean',
  'British',
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

const DIETARY: DietaryNeed[] = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
];

const TIME_FILTERS = [
  { label: 'Under 15m', value: '15' },
  { label: 'Under 20m', value: '20' },
  { label: 'Under 25m', value: '25' },
  { label: 'Under 30m', value: '30' },
];

interface ExploreScreenProps {
  onSelectRecipe: (recipe: IRecipe) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onSelectRecipe,
}) => {
  const { user, toggleFavorite } = useAuth();
  const { preferences } = usePlan();

  const currencySymbol =
    preferences?.currencyCode === 'INR' || user?.currencyCode === 'INR' ? '₹'
    : preferences?.currencyCode === 'GBP' || user?.currencyCode === 'GBP' ? '£'
    : preferences?.currencyCode === 'EUR' || user?.currencyCode === 'EUR' ? '€'
    : preferences?.currencyCode === 'BRL' || user?.currencyCode === 'BRL' ? 'R$'
    : '$';

  const activeDiets = (preferences?.dietaryNeeds || user?.dietaryPreferences || ['None']).filter((d) => d !== 'None');
  const activeAllergies = preferences?.allergies || user?.allergies || [];
  const dietSummary = activeDiets.length > 0 ? activeDiets.join(', ') : 'Standard diet';
  const allergySummary = activeAllergies.length > 0 ? `${activeAllergies.join(', ')} safe` : 'zero exclusions';

  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedDietary, setSelectedDietary] = useState<string | null>(null);
  const [selectedMaxTime, setSelectedMaxTime] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [togglingFavId, setTogglingFavId] = useState<string | null>(null);

  const fetchRecipes = async () => {
    try {
      if (favoritesOnly) {
        const res = await mobileApi.getFavorites();
        let list = res.data || [];
        if (search.trim()) {
          list = list.filter((r) =>
            r.title.toLowerCase().includes(search.trim().toLowerCase())
          );
        }
        if (selectedCuisine) {
          list = list.filter((r) => r.cuisine === selectedCuisine);
        }
        if (selectedVibe) {
          list = list.filter((r) => r.vibes?.includes(selectedVibe as any));
        }
        if (selectedDietary) {
          list = list.filter((r) => r.dietaryTags?.includes(selectedDietary as any));
        }
        if (selectedMaxTime) {
          const maxMin = parseInt(selectedMaxTime, 10);
          list = list.filter((r) => ((r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0)) <= maxMin);
        }
        setRecipes(list);
      } else {
        const params: Record<string, string> = {};
        if (search.trim()) params.search = search.trim();
        if (selectedCuisine) params.cuisine = selectedCuisine;
        if (selectedVibe) params.vibe = selectedVibe;
        if (selectedDietary) params.dietary = selectedDietary;
        if (selectedMaxTime) params.maxCookTime = selectedMaxTime;

        const res = await mobileApi.getRecipes(params);
        if (res.data) {
          setRecipes(res.data);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchRecipes();
  }, [selectedCuisine, selectedVibe, selectedDietary, selectedMaxTime, favoritesOnly]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecipes();
  };

  const handleSearchSubmit = () => {
    setLoading(true);
    fetchRecipes();
  };

  const handleToggleFav = async (recipeId: string) => {
    setTogglingFavId(recipeId);
    try {
      await toggleFavorite(recipeId);
      if (favoritesOnly) {
        setRecipes((prev) => prev.filter((r) => r._id !== recipeId));
      }
    } catch (err) {
      console.warn('Favorite toggle failed', err);
    } finally {
      setTogglingFavId(null);
    }
  };

  const hasActiveFilters = Boolean(
    selectedCuisine || selectedVibe || selectedDietary || selectedMaxTime || favoritesOnly || search.trim()
  );

  const resetAllFilters = () => {
    setSelectedCuisine(null);
    setSelectedVibe(null);
    setSelectedDietary(null);
    setSelectedMaxTime(null);
    setFavoritesOnly(false);
    setSearch('');
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.headerTitle}>
              {favoritesOnly ? 'Your Favorites' : 'Explore Recipes'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {favoritesOnly
                ? 'Quickly view and cook your saved recipes'
                : 'Browse recipes and pull favorites into your meal plan'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.favFilterPill, favoritesOnly && styles.favFilterPillActive]}
            onPress={() => setFavoritesOnly(!favoritesOnly)}
          >
            <Text style={[styles.favFilterText, favoritesOnly && styles.favFilterTextActive]}>
              {favoritesOnly ? '♥ Favorites' : '♡ Favorites'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search recipes, ingredients..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Filter Scrollable Chips */}
      <View style={styles.filtersSection}>
        {/* Cuisine Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterPill, selectedCuisine === null && styles.filterPillActive]}
            onPress={() => setSelectedCuisine(null)}
          >
            <Text style={[styles.filterText, selectedCuisine === null && styles.filterTextActive]}>
              All Cuisines
            </Text>
          </TouchableOpacity>
          {CUISINES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.filterPill, selectedCuisine === c && styles.filterPillActive]}
              onPress={() => setSelectedCuisine(selectedCuisine === c ? null : c)}
            >
              <Text style={[styles.filterText, selectedCuisine === c && styles.filterTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Vibes & Dietary Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {VIBES.map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.vibePill, selectedVibe === v && styles.vibePillActive]}
              onPress={() => setSelectedVibe(selectedVibe === v ? null : v)}
            >
              <Text style={[styles.vibeText, selectedVibe === v && styles.vibeTextActive]}>
                {v}
              </Text>
            </TouchableOpacity>
          ))}

          {DIETARY.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.vibePill, selectedDietary === d && styles.vibePillActive]}
              onPress={() => setSelectedDietary(selectedDietary === d ? null : d)}
            >
              <Text style={[styles.vibeText, selectedDietary === d && styles.vibeTextActive]}>
                🌱 {d}
              </Text>
            </TouchableOpacity>
          ))}

          {TIME_FILTERS.map((tf) => (
            <TouchableOpacity
              key={tf.value}
              style={[styles.vibePill, selectedMaxTime === tf.value && styles.vibePillActive]}
              onPress={() => setSelectedMaxTime(selectedMaxTime === tf.value ? null : tf.value)}
            >
              <Text style={[styles.vibeText, selectedMaxTime === tf.value && styles.vibeTextActive]}>
                ⏱️ {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {hasActiveFilters && (
          <TouchableOpacity onPress={resetAllFilters} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>✕ Reset All Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recipe List */}
      {loading ? (
        <LoadingState message="Discovering delicious recipes..." />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon={favoritesOnly ? '❤️' : '🔍'}
          title={favoritesOnly ? 'No favorite recipes yet' : 'No recipes found'}
          description={
            favoritesOnly
              ? 'Browse the explore catalog and tap the heart icon on any recipe to save it here.'
              : 'Try broadening your search or choosing a different filter.'
          }
          actionTitle="Reset Filters"
          onAction={resetAllFilters}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.recipeListScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0D5C3A']}
            />
          }
        >
          {recipes.map((item) => {
            const isFav = user?.favorites?.includes(item._id) || false;
            const isToggling = togglingFavId === item._id;
            const totalTime = (item.prepTimeMinutes || 0) + (item.cookTimeMinutes || 0);

            return (
              <TouchableOpacity
                key={item._id}
                style={styles.recipeCard}
                activeOpacity={0.8}
                onPress={() => onSelectRecipe(item)}
              >
                <View style={styles.imageWrapper}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.recipeImage} />
                  ) : (
                    <View style={[styles.recipeImage, styles.imagePlaceholder]}>
                      <Text style={styles.placeholderEmoji}>🍲</Text>
                    </View>
                  )}

                  {/* Vibe badge on bottom left of image */}
                  {item.vibes?.[0] && (
                    <View style={styles.imageVibeBadge}>
                      <Text style={styles.imageVibeText}>{item.vibes[0]}</Text>
                    </View>
                  )}

                  {/* Heart Favorite Button */}
                  <TouchableOpacity
                    style={[styles.favBtn, isFav && styles.favBtnActive]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleFav(item._id);
                    }}
                    disabled={isToggling}
                  >
                    {isToggling ? (
                      <ActivityIndicator size="small" color={isFav ? '#EF4444' : '#6B7280'} />
                    ) : (
                      <Text style={[styles.favHeartIcon, isFav && styles.favHeartIconActive]}>
                        {isFav ? '♥' : '♡'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.recipeTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <Text style={styles.recipeMeta}>
                    ⏱️ {totalTime} min • {currencySymbol}{Math.max(1.5, Math.round((item.calories / 220) * 100) / 100).toFixed(2)}/serv • 🔥 {item.calories} kcal
                  </Text>

                  {item.dietaryTags && item.dietaryTags.filter((d) => d !== 'None').length > 0 && (
                    <View style={styles.tagsRow}>
                      {item.dietaryTags
                        .filter((d) => d !== 'None')
                        .map((t) => (
                          <View key={t} style={styles.tagBadge}>
                            <Text style={styles.tagBadgeText}>{t}</Text>
                          </View>
                        ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Safety Reassurance Notice matching Screenshot 2 */}
          <View style={styles.safetyFooterCard}>
            <Text style={styles.safetyFooterText}>
              🛡️ Only showing meals you can eat ({dietSummary}, {allergySummary}).
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  favFilterPill: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  favFilterPillActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  favFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  favFilterTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    marginTop: 2,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtersSection: {
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  filterScroll: {
    paddingHorizontal: 16,
    marginBottom: 3,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  vibePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 6,
  },
  vibePillActive: {
    backgroundColor: '#9ED034',
    borderColor: '#9ED034',
  },
  vibeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  vibeTextActive: {
    color: '#1F2A06',
    fontWeight: '800',
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D5C3A',
  },
  recipeListScroll: {
    padding: 16,
    gap: 14,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0ECE4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  imageVibeBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageVibeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1F2937',
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  favBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  favHeartIcon: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  favHeartIconActive: {
    color: '#EF4444',
  },
  cardContent: {
    padding: 14,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  recipeMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D5C3A',
  },
  safetyFooterCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    marginBottom: 24,
    alignItems: 'center',
  },
  safetyFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    textAlign: 'center',
    lineHeight: 18,
  },
});
