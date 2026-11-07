import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { usePlan } from '../../context/PlanContext';
import { useAuth } from '../../context/AuthContext';
import { AisleSection } from '../../components/grocery/AisleSection';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { CurrencyCode, SupermarketAisle } from '../../types';
import { formatCurrency } from '../../utils/currency';

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
    preferences,
    isLoading,
    offlinePendingCount,
    fetchShoppingList,
    toggleShoppingItem,
    resetShoppingList,
    addCustomShoppingItem,
    deleteShoppingItem,
    syncOfflineChanges,
  } = usePlan();
  const { user } = useAuth();
  const currencyCode: CurrencyCode =
    preferences?.currencyCode || user?.currencyCode || user?.weeklyBudgetCurrency || 'USD';

  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Custom Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const [unitInput, setUnitInput] = useState('');
  const [aisleInput, setAisleInput] = useState<SupermarketAisle>('Fresh Produce');
  const [costInput, setCostInput] = useState('2.50');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

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

  const handleCopyList = async () => {
    if (!shoppingList || !shoppingList.items || shoppingList.items.length === 0) return;

    let text = `🛒 MELTTO GROCERY LIST (${shoppingList.supermarket || 'Supermarket'})\n`;
    text += `Total Estimated Cost: ${formatCurrency(shoppingList.totalEstimatedCost, currencyCode)}\n\n`;

    AISLES.forEach((aisle) => {
      const aisleItems = shoppingList.items.filter((i) => i.aisle === aisle);
      if (aisleItems.length > 0) {
        text += `[${aisle.toUpperCase()}]\n`;
        aisleItems.forEach((item) => {
          const status = item.isBought ? '[x]' : '[ ]';
          text += `${status} ${item.name} (${item.totalQuantity} ${item.unit || ''}) - ${formatCurrency(item.estimatedCost, currencyCode)}\n`;
        });
        text += '\n';
      }
    });

    try {
      await Share.share({
        message: text,
        title: `Meltto Grocery List - ${shoppingList.supermarket}`,
      });
    } catch (err: any) {
      Alert.alert('Share Grocery List', text);
    }
  };

  const handleAddCustomItem = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Required', 'Please enter an item name');
      return;
    }
    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Required', 'Please enter a valid quantity');
      return;
    }
    const estCost = parseFloat(costInput) || 0;

    setIsSubmittingItem(true);
    try {
      await addCustomShoppingItem({
        name: nameInput.trim(),
        totalQuantity: qty,
        unit: unitInput.trim() || undefined,
        aisle: aisleInput,
        estimatedCost: estCost,
      });
      setIsAddModalOpen(false);
      setNameInput('');
      setQuantityInput('1');
      setUnitInput('');
      setCostInput('2.50');
      Alert.alert('Added', 'Custom item added to grocery list');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add custom item');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleDeleteCustomItem = (itemId: string) => {
    Alert.alert('Remove Custom Item', 'Delete this item from your shopping list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteShoppingItem(itemId),
      },
    ]);
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
              <Text style={styles.costBadgeText}>{formatCurrency(totalEstimatedCost, currencyCode)}</Text>
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

        {/* Action Buttons Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolBtnPrimary}
            onPress={() => setIsAddModalOpen(true)}
          >
            <Text style={styles.toolBtnPrimaryText}>+ Add Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtnSecondary}
            onPress={handleCopyList}
          >
            <Text style={styles.toolBtnSecondaryText}>📋 Copy / Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtnSecondary}
            onPress={handleConfirmReset}
          >
            <Text style={styles.toolBtnSecondaryText}>↺ Reset</Text>
          </TouchableOpacity>
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
              currencyCode={currencyCode}
              onToggleItem={toggleShoppingItem}
              onDeleteItem={handleDeleteCustomItem}
            />
          );
        })}
      </ScrollView>

      {/* ==================================================== */}
      {/* ADD CUSTOM ITEM MODAL                                */}
      {/* ==================================================== */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add Custom Item</Text>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Item name (e.g., Oat Milk, Kitchen Foil)"
              placeholderTextColor="#9CA3AF"
              value={nameInput}
              onChangeText={setNameInput}
            />

            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginRight: 8 }]}
                placeholder="Quantity (e.g. 1)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={quantityInput}
                onChangeText={setQuantityInput}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="Unit (e.g. carton, roll)"
                placeholderTextColor="#9CA3AF"
                value={unitInput}
                onChangeText={setUnitInput}
              />
            </View>

            <Text style={styles.modalFieldLabel}>Supermarket Aisle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalAisleScroll}>
              {AISLES.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.smallPill, aisleInput === a && styles.smallPillActive]}
                  onPress={() => setAisleInput(a)}
                >
                  <Text
                    style={[
                      styles.smallPillText,
                      aisleInput === a && styles.smallPillTextActive,
                    ]}
                  >
                    {a}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.modalInput}
              placeholder={`Estimated Cost (e.g. ${formatCurrency(2.5, currencyCode)})`}
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={costInput}
              onChangeText={setCostInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddModalOpen(false)}
                disabled={isSubmittingItem}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddCustomItem}
                disabled={isSubmittingItem}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {isSubmittingItem ? 'Adding...' : 'Add to List'}
                </Text>
              </TouchableOpacity>
            </View>
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
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
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
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toolBtnPrimary: {
    flex: 1.2,
    backgroundColor: '#0D5C3A',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  toolBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  toolBtnSecondary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  toolBtnSecondaryText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 12,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  modalRow: {
    flexDirection: 'row',
  },
  modalFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 6,
    marginTop: 4,
  },
  modalAisleScroll: {
    marginBottom: 12,
  },
  smallPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
  },
  smallPillActive: {
    backgroundColor: '#0D5C3A',
  },
  smallPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  smallPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalSubmitBtn: {
    backgroundColor: '#0D5C3A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
