import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IShoppingItem } from '../../types';

interface GroceryItemRowProps {
  item: IShoppingItem;
  onToggle: () => void;
}

export const GroceryItemRow: React.FC<GroceryItemRowProps> = ({
  item,
  onToggle,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      style={[styles.row, item.isBought && styles.rowBought]}
    >
      {/* Checkbox indicator */}
      <View style={[styles.checkbox, item.isBought && styles.checkboxBought]}>
        {item.isBought && <Text style={styles.checkmark}>✓</Text>}
      </View>

      {/* Item Icon */}
      <Text style={styles.icon}>{item.icon || '🛒'}</Text>

      {/* Info & Quantity */}
      <View style={styles.info}>
        <Text
          style={[styles.name, item.isBought && styles.nameBought]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={styles.subtext}>
          {item.totalQuantity} {item.unit}
          {item.recipeTitles?.length ? ` • for ${item.recipeTitles[0]}` : ''}
        </Text>
        {item.pantryNote && (
          <Text style={styles.pantryNoteText}>📦 {item.pantryNote}</Text>
        )}
      </View>

      {/* Estimated Cost */}
      <Text style={[styles.cost, item.isBought && styles.costBought]}>
        ${item.estimatedCost.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  rowBought: {
    backgroundColor: '#FAFBFB',
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBought: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  nameBought: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  subtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  pantryNoteText: {
    fontSize: 11,
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  cost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  costBought: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
});
