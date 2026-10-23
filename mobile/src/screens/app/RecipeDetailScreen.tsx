import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { IRecipe } from '../../types';
import { mobileApi } from '../../services/api';
import { Badge } from '../../components/common/Badge';

interface RecipeDetailScreenProps {
  recipe: IRecipe;
  onBack: () => void;
}

export const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({
  recipe,
  onBack,
}) => {
  const [upvotes, setUpvotes] = useState(recipe.upvotes || 0);
  const [downvotes, setDownvotes] = useState(recipe.downvotes || 0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  const handleVote = async (type: 'up' | 'down') => {
    try {
      const res = await mobileApi.submitReaction(recipe._id, type);
      if (res.success) {
        setUpvotes(res.upvotes);
        setDownvotes(res.downvotes);
      }
    } catch (err) {
      console.warn('Reaction error:', err);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const res = await mobileApi.toggleFavorite(recipe._id);
      if (res.success) {
        setIsFavorited(res.isFavorited);
      }
    } catch (err) {
      console.warn('Favorite error:', err);
    }
  };

  const toggleIngredientCheck = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <View style={styles.container}>
      {/* Top Floating Back Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.favButton, isFavorited && styles.favButtonActive]}
          onPress={handleToggleFavorite}
        >
          <Text style={styles.favText}>{isFavorited ? '❤️ Saved' : '🤍 Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cover Photo */}
        <Image source={{ uri: recipe.image }} style={styles.heroImage} />

        {/* Content Container */}
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <Badge label={recipe.cuisine} variant="neutral" />
            {recipe.vibes?.map((v) => (
              <Badge key={v} label={v} variant="green" />
            ))}
          </View>

          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.description}>{recipe.description}</Text>

          {/* Quick Metrics */}
          <View style={styles.metricsCard}>
            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>⏱️</Text>
              <Text style={styles.metricValue}>{recipe.prepTimeMinutes + recipe.cookTimeMinutes}m</Text>
              <Text style={styles.metricLabel}>Total Time</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>🔥</Text>
              <Text style={styles.metricValue}>{recipe.calories}</Text>
              <Text style={styles.metricLabel}>Calories</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>🍗</Text>
              <Text style={styles.metricValue}>{recipe.proteinGrams}g</Text>
              <Text style={styles.metricLabel}>Protein</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>🥑</Text>
              <Text style={styles.metricValue}>{recipe.fatGrams}g</Text>
              <Text style={styles.metricLabel}>Fats</Text>
            </View>
          </View>

          {/* Community Reactions */}
          <View style={styles.reactionsRow}>
            <Text style={styles.communityText}>Community rating:</Text>
            <View style={styles.voteButtonGroup}>
              <TouchableOpacity
                style={styles.voteBtn}
                onPress={() => handleVote('up')}
              >
                <Text style={styles.voteBtnText}>👍 {upvotes}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.voteBtn}
                onPress={() => handleVote('down')}
              >
                <Text style={styles.voteBtnText}>👎 {downvotes}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Ingredients ({recipe.ingredients.length})
            </Text>
            <View style={styles.ingredientsBox}>
              {recipe.ingredients.map((ing, idx) => {
                const checked = checkedIngredients[idx];
                return (
                  <TouchableOpacity
                    key={`${ing.name}_${idx}`}
                    style={[styles.ingredientRow, checked && styles.ingredientChecked]}
                    onPress={() => toggleIngredientCheck(idx)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                      {checked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.ingredientIcon}>{ing.icon || '🥘'}</Text>
                    <Text
                      style={[styles.ingredientName, checked && styles.strikethrough]}
                    >
                      {ing.name}
                    </Text>
                    <Text style={styles.ingredientQty}>
                      {ing.quantity} {ing.unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.stepsBox}>
              {recipe.instructions.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FAF9F5',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  favButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  favButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  favText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  scroll: {
    paddingBottom: 40,
  },
  heroImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#E5E7EB',
  },
  content: {
    padding: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#F0ECE4',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  communityText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  voteButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  voteBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  voteBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  ingredientsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0ECE4',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  ingredientChecked: {
    backgroundColor: '#FAFBFB',
    opacity: 0.6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ingredientIcon: {
    fontSize: 16,
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  ingredientQty: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  stepsBox: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0ECE4',
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E7F2EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#0D5C3A',
    fontWeight: '700',
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
