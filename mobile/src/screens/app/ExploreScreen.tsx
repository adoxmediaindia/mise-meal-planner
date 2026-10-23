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
} from 'react-native';
import { mobileApi } from '../../services/api';
import { IRecipe, Cuisine } from '../../types';
import { Badge } from '../../components/common/Badge';
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

interface ExploreScreenProps {
  onSelectRecipe: (recipe: IRecipe) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onSelectRecipe,
}) => {
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);

  const fetchRecipes = async () => {
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCuisine) params.cuisine = selectedCuisine;

      const res = await mobileApi.getRecipes(params);
      if (res.data) {
        setRecipes(res.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [selectedCuisine]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecipes();
  };

  const handleSearchSubmit = () => {
    setLoading(true);
    fetchRecipes();
  };

  return (
    <View style={styles.container}>
      {/* Search Bar Header */}
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

      {/* Cuisine Filter Pills */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedCuisine === null && styles.filterPillActive,
            ]}
            onPress={() => setSelectedCuisine(null)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCuisine === null && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {CUISINES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.filterPill,
                selectedCuisine === c && styles.filterPillActive,
              ]}
              onPress={() => setSelectedCuisine(selectedCuisine === c ? null : c)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCuisine === c && styles.filterTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recipe Grid */}
      {loading ? (
        <LoadingState message="Discovering fresh recipes..." />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No recipes found"
          description="Try broadening your search or choosing a different cuisine filter."
          actionTitle="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedCuisine(null);
          }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.recipeList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0D5C3A']}
            />
          }
        >
          {recipes.map((item) => (
            <TouchableOpacity
              key={item._id}
              activeOpacity={0.8}
              onPress={() => onSelectRecipe(item)}
              style={styles.recipeCard}
            >
              <Image source={{ uri: item.image }} style={styles.cardImage} />

              <View style={styles.cardContent}>
                <View style={styles.pillRow}>
                  <Badge label={item.cuisine} variant="neutral" />
                  {item.vibes?.[0] && (
                    <Badge label={item.vibes[0]} variant="green" />
                  )}
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMetaText}>⏱️ {item.cookTimeMinutes} mins</Text>
                  <Text style={styles.cardMetaText}>🔥 {item.calories} kcal</Text>
                  <Text style={styles.cardMetaText}>🍗 {item.proteinGrams}g pro</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  filterWrapper: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  recipeList: {
    padding: 16,
    gap: 16,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0ECE4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  cardContent: {
    padding: 14,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
    marginBottom: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: 14,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
