import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { usePlan } from '../../context/PlanContext';
import { AisleSection } from '../../components/grocery/AisleSection';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { SupermarketAisle } from '../../types';

const AISLES: SupermarketAisle[] = [
  'Fresh Produce',
  'Meat & Seafood',
  'Dairy & Refrigerated',
  'Bakery',
  'Pantry & Grains',
  'Spices & Condiments',
  'Frozen',
];

interface GroceryScreenProps {
  onNavigateToPlan: () => void;
}

export const GroceryScreen: React.FC<GroceryScreenProps> = ({
  onNavigateToPlan,
}) => {
  const {
    shoppingList,
    isLoading,
    offlinePendingCount,
    fetchShoppingList,
    toggleShoppingItem,
    resetShoppingList,
    syncOfflineChanges,
  } = usePlan();

  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShoppingList();
    setRefreshing(false);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    await syncOfflineChanges();
    setSyncing(false);
  };

  const handleConfirmReset = () => {
    Alert.alert(
      'Reset Shopping Checklist?',
      'This will uncheck all items in your grocery list so you can shop again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetShoppingList },
      ]
    );
  };

  if (isLoading && !shoppingList) {
    return <LoadingState message="Consolidating your supermarket checklist..." />;
  }

  if (!shoppingList || !shoppingList.items || shoppingList.items.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Shopping list is empty"
        description="Your smart grocery list will be generated automatically once your dinner plan is created."
        actionTitle="View Meal Plan"
        onAction={onNavigateToPlan}
      />
    );
  }

  const { items, supermarket, totalEstimatedCost, itemsBoughtCount, totalItemsCount } =
    shoppingList;
  const progressPercent =
    totalItemsCount > 0 ? Math.round((itemsBoughtCount / totalItemsCount) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0D5C3A']}
          />
        }
      >
        {/* Store & Progress Banner */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.storeName}>🏪 {supermarket}</Text>
              <Text style={styles.headerSub}>Consolidated weekly ingredients</Text>
            </View>
            <View style={styles.costBadge}>
              <Text style={styles.costBadgeText}>${totalEstimatedCost.toFixed(2)}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Shopping Progress</Text>
              <Text style={styles.progressPercentText}>
                {itemsBoughtCount} of {totalItemsCount} items ({progressPercent}%)
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>
        </View>

        {/* Offline Banner when offline pending mutations exist */}
        {offlinePendingCount > 0 && (
          <View style={styles.offlineBanner}>
            <View style={styles.offlineTextGroup}>
              <Text style={styles.offlineTitle}>📶 Offline Mode Active</Text>
              <Text style={styles.offlineSub}>
                {offlinePendingCount} checkoff{offlinePendingCount > 1 ? 's' : ''} queued locally
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleManualSync}
              disabled={syncing}
              style={styles.syncBtn}
            >
              <Text style={styles.syncBtnText}>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Grouped Aisles */}
        {AISLES.map((aisle) => {
          const aisleItems = items.filter((i) => i.aisle === aisle);
          return (
            <AisleSection
              key={aisle}
              aisle={aisle}
              items={aisleItems}
              onToggleItem={toggleShoppingItem}
            />
          );
        })}

        {/* Reset Button */}
        <TouchableOpacity
          onPress={handleConfirmReset}
          style={styles.resetButton}
        >
          <Text style={styles.resetButtonText}>↺ Reset All Checkboxes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  headerSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  costBadge: {
    backgroundColor: '#E7F2EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  costBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D5C3A',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0D5C3A',
    borderRadius: 4,
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  offlineTextGroup: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  offlineSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#B45309',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 10,
  },
  resetButtonText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
});
