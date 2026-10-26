import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { mobileApi } from '../../services/api';
import { IPantryItem, IPantryRecipeMatch, IRecipe, SupermarketAisle } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

const CATEGORIES: SupermarketAisle[] = [
  'Fresh Produce',
  'Meat & Seafood',
  'Dairy & Refrigerated',
  'Bakery',
  'Pantry & Grains',
  'Spices & Condiments',
  'Frozen',
];

interface PantryScreenProps {
  onSelectRecipe?: (recipe: IRecipe) => void;
}

export const PantryScreen: React.FC<PantryScreenProps> = ({ onSelectRecipe }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'suggestions'>('inventory');

  // Inventory state
  const [items, setItems] = useState<IPantryItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<IPantryRecipeMatch[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [addingRecipeId, setAddingRecipeId] = useState<string | null>(null);

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const [unitInput, setUnitInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<SupermarketAisle>('Pantry & Grains');
  const [expiryInput, setExpiryInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consume Modal state
  const [consumingItem, setConsumingItem] = useState<IPantryItem | null>(null);
  const [consumeAmount, setConsumeAmount] = useState('1');

  const fetchInventory = async () => {
    try {
      const res = await mobileApi.getPantryItems({
        search: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      setItems(res.data);
    } catch (err: any) {
      console.error('Failed to fetch pantry items:', err);
    } finally {
      setIsLoadingItems(false);
      setRefreshing(false);
    }
  };

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const res = await mobileApi.getPantryRecipeSuggestions({ limit: 25 });
      setSuggestions(res.data);
    } catch (err: any) {
      console.error('Failed to fetch pantry recipe suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (activeTab === 'suggestions') {
      fetchSuggestions();
    }
  }, [activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'inventory') {
      await fetchInventory();
    } else {
      await fetchSuggestions();
    }
  };

  const handleAddItem = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Required', 'Please enter an item name');
      return;
    }
    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Required', 'Please enter a valid quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      await mobileApi.addPantryItem({
        name: nameInput.trim(),
        quantity: qty,
        unit: unitInput.trim() || undefined,
        category: categoryInput,
        expiryDate: expiryInput.trim() ? new Date(expiryInput.trim()).toISOString() : null,
        notes: notesInput.trim() || undefined,
      });
      setIsAddModalOpen(false);
      setNameInput('');
      setQuantityInput('1');
      setUnitInput('');
      setExpiryInput('');
      setNotesInput('');
      await fetchInventory();
      Alert.alert('Success', 'Item added to pantry');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = (item: IPantryItem) => {
    const id = item._id || item.id!;
    Alert.alert('Remove Item', `Delete "${item.name}" from your pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileApi.deletePantryItem(id);
            await fetchInventory();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const handleConsumeSubmit = async () => {
    if (!consumingItem) return;
    const amount = parseFloat(consumeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount to consume');
      return;
    }

    const id = consumingItem._id || consumingItem.id!;
    try {
      await mobileApi.consumePantryItem(id, amount);
      setConsumingItem(null);
      await fetchInventory();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update quantity');
    }
  };

  const handleAddMissingToGrocery = async (recipeId: string) => {
    setAddingRecipeId(recipeId);
    try {
      const res = await mobileApi.addMissingIngredientsToGrocery(recipeId);
      Alert.alert('Grocery Updated', res.message || 'Added missing ingredients to your grocery list.');
      await fetchSuggestions();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add missing ingredients');
    } finally {
      setAddingRecipeId(null);
    }
  };

  const expiredCount = items.filter((i) => i.isExpired).length;
  const expiringSoonCount = items.filter((i) => i.isExpiringSoon && !i.isExpired).length;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>PANTRY &amp; INVENTORY</Text>
          <Text style={styles.headerTitle}>My Pantry</Text>
        </View>

        {activeTab === 'inventory' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddModalOpen(true)}
          >
            <Text style={styles.addButtonText}>+ Add Item</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'inventory' && styles.tabButtonActive]}
          onPress={() => setActiveTab('inventory')}
        >
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
            🥫 Inventory ({items.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'suggestions' && styles.tabButtonActive]}
          onPress={() => setActiveTab('suggestions')}
        >
          <Text style={[styles.tabText, activeTab === 'suggestions' && styles.tabTextActive]}>
            ✨ Cook with Pantry
          </Text>
        </TouchableOpacity>
      </View>

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
        {/* ==================================================== */}
        {/* INVENTORY TAB                                        */}
        {/* ==================================================== */}
        {activeTab === 'inventory' && (
          <View style={styles.section}>
            {/* Expiry Warning Callout */}
            {(expiredCount > 0 || expiringSoonCount > 0) && (
              <View style={styles.warningCard}>
                <Text style={styles.warningTitle}>⚠️ Expiry Alert</Text>
                <Text style={styles.warningBody}>
                  {expiredCount > 0 && `${expiredCount} item(s) expired. `}
                  {expiringSoonCount > 0 && `${expiringSoonCount} item(s) expiring within 3 days.`}
                </Text>
              </View>
            )}

            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search pantry ingredients..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterPill, selectedCategory === 'all' && styles.filterPillActive]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={[styles.filterPillText, selectedCategory === 'all' && styles.filterPillTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterPill, selectedCategory === cat && styles.filterPillActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.filterPillText, selectedCategory === cat && styles.filterPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Items List */}
            {isLoadingItems ? (
              <LoadingState message="Loading your pantry..." />
            ) : items.length > 0 ? (
              <View style={styles.itemsCard}>
                {items.map((item) => {
                  const id = item._id || item.id!;
                  return (
                    <View key={id} style={styles.itemRow}>
                      <Text style={styles.itemIcon}>{item.icon || '🥫'}</Text>

                      <View style={styles.itemInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.isExpired ? (
                            <View style={[styles.badge, styles.badgeExpired]}>
                              <Text style={styles.badgeExpiredText}>Expired</Text>
                            </View>
                          ) : item.isExpiringSoon ? (
                            <View style={[styles.badge, styles.badgeExpiring]}>
                              <Text style={styles.badgeExpiringText}>
                                {item.daysUntilExpiry === 0 ? 'Today' : `${item.daysUntilExpiry}d`}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={styles.itemQuantity}>
                          {item.quantity} {item.unit} • {item.category}
                        </Text>
                        {item.notes ? (
                          <Text style={styles.itemNotes} numberOfLines={1}>
                            {item.notes}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.useButton}
                          onPress={() => {
                            setConsumingItem(item);
                            setConsumeAmount(Math.min(1, item.quantity).toString());
                          }}
                        >
                          <Text style={styles.useButtonText}>Use</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteItem(item)}
                        >
                          <Text style={styles.deleteButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <EmptyState
                icon="🥫"
                title="Pantry is empty"
                description="Add staple ingredients like pasta, garlic, or olive oil to match with delicious recipes."
                actionTitle="+ Add First Item"
                onAction={() => setIsAddModalOpen(true)}
              />
            )}
          </View>
        )}

        {/* ==================================================== */}
        {/* COOK WITH PANTRY TAB                                 */}
        {/* ==================================================== */}
        {activeTab === 'suggestions' && (
          <View style={styles.section}>
            {isLoadingSuggestions ? (
              <LoadingState message="Matching pantry items with recipes..." />
            ) : suggestions.length > 0 ? (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((match) => {
                  const recipe = match.recipe;
                  const isAdding = addingRecipeId === recipe._id;

                  return (
                    <View key={recipe._id} style={styles.recipeCard}>
                      <View style={styles.recipeHeader}>
                        <View style={styles.recipeTitleCol}>
                          <TouchableOpacity
                            onPress={() => onSelectRecipe && onSelectRecipe(recipe)}
                          >
                            <Text style={styles.recipeTitle}>{recipe.title}</Text>
                          </TouchableOpacity>
                          <Text style={styles.recipeMeta}>
                            ⏱️ {recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins • {recipe.cuisine}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.matchBadge,
                            match.canCookFully ? styles.matchBadgeFull : styles.matchBadgePartial,
                          ]}
                        >
                          <Text
                            style={[
                              styles.matchBadgeText,
                              match.canCookFully
                                ? styles.matchBadgeTextFull
                                : styles.matchBadgeTextPartial,
                            ]}
                          >
                            {match.canCookFully ? '100% Ready' : `${match.matchPercentage}% Match`}
                          </Text>
                        </View>
                      </View>

                      {/* Ingredients Breakdown */}
                      <View style={styles.ingredientsBox}>
                        <Text style={styles.ingredientsSectionTitle}>
                          ✅ In Pantry ({match.availableIngredients.length}):
                        </Text>
                        <Text style={styles.ingredientsListText}>
                          {match.availableIngredients.length > 0
                            ? match.availableIngredients
                                .map((i) => `${i.name} (${i.quantity} ${i.unit})`)
                                .join(', ')
                            : 'None'}
                        </Text>

                        {match.missingIngredients.length > 0 && (
                          <>
                            <Text style={[styles.ingredientsSectionTitle, { marginTop: 6 }]}>
                              🛒 Missing ({match.missingIngredients.length}):
                            </Text>
                            <Text style={styles.missingListText}>
                              {match.missingIngredients
                                .map((i) => `${i.name} (${i.deficitQuantity} ${i.unit})`)
                                .join(', ')}
                            </Text>
                          </>
                        )}
                      </View>

                      {/* Action buttons */}
                      <View style={styles.cardActions}>
                        {onSelectRecipe && (
                          <TouchableOpacity
                            style={styles.viewRecipeBtn}
                            onPress={() => onSelectRecipe(recipe)}
                          >
                            <Text style={styles.viewRecipeBtnText}>View Recipe</Text>
                          </TouchableOpacity>
                        )}

                        {!match.canCookFully && (
                          <TouchableOpacity
                            style={styles.addGroceryBtn}
                            disabled={isAdding}
                            onPress={() => handleAddMissingToGrocery(recipe._id)}
                          >
                            <Text style={styles.addGroceryBtnText}>
                              {isAdding
                                ? 'Adding...'
                                : `+ Add ${match.missingIngredients.length} Missing to Grocery`}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <EmptyState
                icon="🍳"
                title="No recipe matches"
                description="Add more staple ingredients to your pantry to see matched recipes."
                actionTitle="Go to Inventory"
                onAction={() => setActiveTab('inventory')}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* ADD ITEM MODAL */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Pantry Item</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Item name (e.g., Pasta, Olive Oil)"
              placeholderTextColor="#9CA3AF"
              value={nameInput}
              onChangeText={setNameInput}
            />

            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="Quantity (e.g. 2)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={quantityInput}
                onChangeText={setQuantityInput}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1, marginLeft: 8 }]}
                placeholder="Unit (g, ml, can)"
                placeholderTextColor="#9CA3AF"
                value={unitInput}
                onChangeText={setUnitInput}
              />
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Expiry Date (YYYY-MM-DD optional)"
              placeholderTextColor="#9CA3AF"
              value={expiryInput}
              onChangeText={setExpiryInput}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Notes (optional)"
              placeholderTextColor="#9CA3AF"
              value={notesInput}
              onChangeText={setNotesInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                disabled={isSubmitting}
                onPress={handleAddItem}
              >
                <Text style={styles.modalSaveText}>
                  {isSubmitting ? 'Saving...' : 'Add to Pantry'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CONSUME MODAL */}
      {consumingItem && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Use {consumingItem.name}</Text>
              <Text style={styles.modalSubtitle}>
                Have: {consumingItem.quantity} {consumingItem.unit}. Enter amount used:
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Amount"
                keyboardType="numeric"
                value={consumeAmount}
                onChangeText={setConsumeAmount}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setConsumingItem(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleConsumeSubmit}
                >
                  <Text style={styles.modalSaveText}>Confirm Use</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8CA365',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#0D5C3A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#EBE8DE',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginTop: 8,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  warningBody: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#111827',
    marginBottom: 8,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeExpired: {
    backgroundColor: '#FEE2E2',
  },
  badgeExpiredText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
  },
  badgeExpiring: {
    backgroundColor: '#FEF3C7',
  },
  badgeExpiringText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  useButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  useButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  deleteButton: {
    padding: 6,
  },
  deleteButtonText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  suggestionsContainer: {
    gap: 12,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    marginBottom: 10,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recipeTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  recipeMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  matchBadgeFull: {
    backgroundColor: '#DCFCE7',
  },
  matchBadgePartial: {
    backgroundColor: '#FEF3C7',
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  matchBadgeTextFull: {
    color: '#15803D',
  },
  matchBadgeTextPartial: {
    color: '#B45309',
  },
  ingredientsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  ingredientsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  ingredientsListText: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 1,
  },
  missingListText: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  viewRecipeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewRecipeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  addGroceryBtn: {
    backgroundColor: '#0D5C3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addGroceryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
    marginBottom: 10,
  },
  modalRow: {
    flexDirection: 'row',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#0D5C3A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalSaveText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
