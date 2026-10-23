import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { IDinnerSlot } from '../../types';
import { Badge } from '../common/Badge';

interface DinnerCardProps {
  slot: IDinnerSlot;
  onPressRecipe: () => void;
  onSwap: () => void;
  onToggleCooked: () => void;
}

export const DinnerCard: React.FC<DinnerCardProps> = ({
  slot,
  onPressRecipe,
  onSwap,
  onToggleCooked,
}) => {
  const { day, recipe, isCooked } = slot;

  if (!recipe) return null;

  return (
    <View style={[styles.card, isCooked && styles.cardCooked]}>
      {/* Header: Day & Cooked Status */}
      <View style={styles.header}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayText}>{day}</Text>
        </View>

        <TouchableOpacity
          onPress={onToggleCooked}
          style={[styles.statusPill, isCooked && styles.statusPillCooked]}
        >
          <Text style={styles.statusText}>{isCooked ? '✓ Cooked' : '○ Cook Tonight'}</Text>
        </TouchableOpacity>
      </View>

      {/* Body: Recipe Details (Tappable) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPressRecipe}
        style={styles.body}
      >
        <Image
          source={{ uri: recipe.image }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>⏱️ {recipe.cookTimeMinutes} mins</Text>
            <Text style={styles.metaText}>🔥 {recipe.calories} kcal</Text>
          </View>

          <View style={styles.badgeRow}>
            <Badge label={recipe.cuisine} variant="neutral" />
            {recipe.vibes?.[0] && (
              <Badge label={recipe.vibes[0]} variant="green" />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Footer: Quick Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.swapBtn}
          onPress={onSwap}
        >
          <Text style={styles.swapBtnText}>🔄 Swap Meal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewRecipeBtn}
          onPress={onPressRecipe}
        >
          <Text style={styles.viewRecipeText}>View Recipe →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCooked: {
    opacity: 0.85,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  dayBadge: {
    backgroundColor: '#0D5C3A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  statusPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillCooked: {
    backgroundColor: '#DEF7EC',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  body: {
    flexDirection: 'row',
    padding: 14,
    gap: 14,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
  },
  swapBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  swapBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D5C3A',
  },
  viewRecipeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  viewRecipeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
});
