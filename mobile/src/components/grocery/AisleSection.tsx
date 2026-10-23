import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SupermarketAisle, IShoppingItem } from '../../types';
import { GroceryItemRow } from './GroceryItemRow';

interface AisleSectionProps {
  aisle: SupermarketAisle;
  items: IShoppingItem[];
  onToggleItem: (itemId: string) => void;
}

export const AisleSection: React.FC<AisleSectionProps> = ({
  aisle,
  items,
  onToggleItem,
}) => {
  if (items.length === 0) return null;

  const boughtCount = items.filter((i) => i.isBought).length;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{aisle}</Text>
        <Text style={styles.count}>
          {boughtCount}/{items.length} bought
        </Text>
      </View>

      <View style={styles.itemsCard}>
        {items.map((item) => (
          <GroceryItemRow
            key={item.id}
            item={item}
            onToggle={() => onToggleItem(item.id)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  count: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0ECE4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
});
