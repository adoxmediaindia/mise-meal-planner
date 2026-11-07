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
  ActivityIndicator,
} from 'react-native';
import { mobileApi } from '../../services/api';
import {
  IPantryItem,
  IPantryRecipeMatch,
  IRecipe,
  SupermarketAisle,
} from '../../types';
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

const STATUS_FILTERS = [
  { key: 'all', label: 'All Items' },
  { key: 'fresh', label: 'Fresh' },
  { key: 'expiring_soon', label: 'Expiring Soon' },
  { key: 'expired', label: 'Expired' },
];

const COOK_TIME_OPTIONS = [15, 20, 30, 45];

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
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<IPantryRecipeMatch[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [addingRecipeId, setAddingRecipeId] = useState<string | null>(null);

  // Add / Edit Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IPantryItem | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const [unitInput, setUnitInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<SupermarketAisle>('Pantry & Grains');
  const [expiryInput, setExpiryInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Consume Modal state
  const [consumingItem, setConsumingItem] = useState<IPantryItem | null>(null);
  const [consumeAmount, setConsumeAmount] = useState('1');
  const [isConsuming, setIsConsuming] = useState(false);

  // Chef Meltto AI Leftovers Modal state
  const [isAiLeftoversOpen, setIsAiLeftoversOpen] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredientInput, setCustomIngredientInput] = useState('');
  const [leftoverMaxTime, setLeftoverMaxTime] = useState<number>(30);
  const [leftoverNotes, setLeftoverNotes] = useState('');
  const [isGeneratingLeftover, setIsGeneratingLeftover] = useState(false);
  const [leftoverError, setLeftoverError] = useState<string | null>(null);
  const [isLeftoverUpgradeRequired, setIsLeftoverUpgradeRequired] = useState(false);
  const [generatedRecipeResult, setGeneratedRecipeResult] = useState<{
    recipe: IRecipe;
    isAiGenerated: boolean;
    fallback: boolean;
    note?: string;
  } | null>(null);

  const fetchInventory = async () => {
    try {
      const res = await mobileApi.getPantryItems({
        search: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
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
  }, [searchQuery, selectedCategory, selectedStatus]);

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

  const handleOpenAddModal = (itemToEdit?: IPantryItem) => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setNameInput(itemToEdit.name);
      setQuantityInput(itemToEdit.quantity.toString());
      setUnitInput(itemToEdit.unit || '');
      setCategoryInput(itemToEdit.category);
      setExpiryInput(
        itemToEdit.expiryDate
          ? new Date(itemToEdit.expiryDate).toISOString().slice(0, 10)
          : ''
      );
      setNotesInput(itemToEdit.notes || '');
    } else {
      setEditingItem(null);
      setNameInput('');
      setQuantityInput('1');
      setUnitInput('');
      setCategoryInput('Pantry & Grains');
      setExpiryInput('');
      setNotesInput('');
    }
    setIsAddModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Required', 'Please enter an item name');
      return;
    }
    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Required', 'Please enter a valid quantity');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const payload = {
        name: nameInput.trim(),
        quantity: qty,
        unit: unitInput.trim() || undefined,
        category: categoryInput,
        expiryDate: expiryInput.trim() ? new Date(expiryInput.trim()).toISOString() : null,
        notes: notesInput.trim() || undefined,
      };

      if (editingItem) {
        const id = editingItem._id || editingItem.id!;
        await mobileApi.updatePantryItem(id, payload);
        Alert.alert('Success', 'Item updated in pantry');
      } else {
        await mobileApi.addPantryItem(payload);
        Alert.alert('Success', 'Item added to pantry');
      }

      setIsAddModalOpen(false);
      await fetchInventory();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save item');
    } finally {
      setIsSubmittingItem(false);
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

    setIsConsuming(true);
    const id = consumingItem._id || consumingItem.id!;
    try {
      await mobileApi.consumePantryItem(id, amount);
      setConsumingItem(null);
      await fetchInventory();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update quantity');
    } finally {
      setIsConsuming(false);
    }
  };

  const handleAddMissingToGrocery = async (recipeId: string) => {
    setAddingRecipeId(recipeId);
    try {
      const res = await mobileApi.addMissingIngredientsToGrocery(recipeId);
      Alert.alert(
        'Grocery Updated',
        res.message || 'Added missing ingredients to your grocery list.'
      );
      await fetchSuggestions();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add missing ingredients');
    } finally {
      setAddingRecipeId(null);
    }
  };

  // AI Leftovers Logic
  const handleOpenAiLeftovers = () => {
    const defaultIngredients = items.slice(0, 5).map((i) => i.name);
    setSelectedIngredients(defaultIngredients);
    setCustomIngredientInput('');
    setLeftoverError(null);
    setIsLeftoverUpgradeRequired(false);
    setGeneratedRecipeResult(null);
    setIsAiLeftoversOpen(true);
  };

  const handleToggleIngredientChip = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleAddCustomIngredientChip = () => {
    if (!customIngredientInput.trim()) return;
    const val = customIngredientInput.trim();
    if (!selectedIngredients.includes(val)) {
      setSelectedIngredients((prev) => [...prev, val]);
    }
    setCustomIngredientInput('');
  };

  const handleGenerateLeftoverRecipe = async () => {
    if (selectedIngredients.length === 0) {
      setLeftoverError('Please select or add at least 1 ingredient.');
      return;
    }
    setLeftoverError(null);
    setIsLeftoverUpgradeRequired(false);
    setIsGeneratingLeftover(true);
    try {
      const res = await mobileApi.generateLeftoverRecipe({
        ingredients: selectedIngredients,
        maxCookTimeMinutes: leftoverMaxTime,
        additionalNotes: leftoverNotes || undefined,
      });

      const recipeData = res.data?.recipe || res.data;
      setGeneratedRecipeResult({
        recipe: recipeData,
        isAiGenerated: res.isAiGenerated ?? res.data?.isAiGenerated ?? false,
        fallback: res.fallback ?? res.data?.fallback ?? true,
        note: res.note || res.data?.note,
      });
    } catch (err: any) {
      if (err.status === 403 || err.response?.data?.code === 'UPGRADE_REQUIRED') {
        setIsLeftoverUpgradeRequired(true);
        setLeftoverError(
          err.response?.data?.error ||
            'Weekly AI generation quota reached. Upgrade to Pro for 50 AI queries/week.'
        );
      } else {
        setLeftoverError(err.message || 'Failed to generate recipe from leftovers.');
      }
    } finally {
      setIsGeneratingLeftover(false);
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

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.aiLeftoversBtn}
            onPress={handleOpenAiLeftovers}
          >
            <Text style={styles.aiLeftoversBtnText}>✨ AI Leftovers</Text>
          </TouchableOpacity>

          {activeTab === 'inventory' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleOpenAddModal()}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
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
              placeholder="🔍 Search pantry ingredients..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Status Filter Pills */}
            <View style={styles.statusPillsRow}>
              {STATUS_FILTERS.map((sf) => (
                <TouchableOpacity
                  key={sf.key}
                  style={[
                    styles.statusPill,
                    selectedStatus === sf.key && styles.statusPillActive,
                  ]}
                  onPress={() => setSelectedStatus(sf.key)}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      selectedStatus === sf.key && styles.statusPillTextActive,
                    ]}
                  >
                    {sf.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterPill, selectedCategory === 'all' && styles.filterPillActive]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={[styles.filterPillText, selectedCategory === 'all' && styles.filterPillTextActive]}>
                  All Categories
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
                          {item.quantity}{item.unit ? ` ${item.unit}` : ''} • {item.category}
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
                          style={styles.editButton}
                          onPress={() => handleOpenAddModal(item)}
                        >
                          <Text style={styles.editButtonText}>✎</Text>
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
                onAction={() => handleOpenAddModal()}
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
                            ⏱️ {(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} mins • {recipe.cuisine}
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
                                .map((i) => `${i.name} (${i.quantity}${i.unit ? ` ${i.unit}` : ''})`)
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
                                .map((i) => `${i.name} (${i.deficitQuantity}${i.unit ? ` ${i.unit}` : ''})`)
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

      {/* ==================================================== */}
      {/* CHEF MELTTO AI LEFTOVERS MODAL                       */}
      {/* ==================================================== */}
      <Modal visible={isAiLeftoversOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.aiLeftoverSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleGroup}>
                <Text style={styles.modalHeaderSparkle}>✨</Text>
                <View>
                  <Text style={styles.modalSheetTitle}>Chef Meltto AI Leftovers</Text>
                  <Text style={styles.modalSheetSub}>
                    Turn available ingredients into a recipe instantly.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsAiLeftoversOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {!generatedRecipeResult ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Available Ingredients Selection */}
                <Text style={styles.modalFieldLabel}>1. Select Your Ingredients</Text>
                <View style={styles.chipsContainer}>
                  {items.map((i) => {
                    const isSelected = selectedIngredients.includes(i.name);
                    return (
                      <TouchableOpacity
                        key={i._id || i.name}
                        style={[styles.ingredientChip, isSelected && styles.ingredientChipSelected]}
                        onPress={() => handleToggleIngredientChip(i.name)}
                      >
                        <Text
                          style={[
                            styles.ingredientChipText,
                            isSelected && styles.ingredientChipTextSelected,
                          ]}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {i.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Ingredient Input */}
                <View style={styles.customAddRow}>
                  <TextInput
                    style={styles.customAddInput}
                    placeholder="Add extra ingredient (e.g. cooked rice, egg)"
                    placeholderTextColor="#9CA3AF"
                    value={customIngredientInput}
                    onChangeText={setCustomIngredientInput}
                    onSubmitEditing={handleAddCustomIngredientChip}
                  />
                  <TouchableOpacity
                    style={styles.customAddBtn}
                    onPress={handleAddCustomIngredientChip}
                  >
                    <Text style={styles.customAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {/* Selected Ingredients Summary */}
                <Text style={styles.selectedCountText}>
                  Selected ({selectedIngredients.length}):{' '}
                  <Text style={{ fontWeight: '700', color: '#111827' }}>
                    {selectedIngredients.join(', ') || 'None selected'}
                  </Text>
                </Text>

                {/* Max Cook Time */}
                <Text style={styles.modalFieldLabel}>2. Maximum Cook Time</Text>
                <View style={styles.timeOptionsRow}>
                  {COOK_TIME_OPTIONS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOptionPill,
                        leftoverMaxTime === time && styles.timeOptionPillActive,
                      ]}
                      onPress={() => setLeftoverMaxTime(time)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          leftoverMaxTime === time && styles.timeOptionTextActive,
                        ]}
                      >
                        {time} mins
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Additional Notes */}
                <Text style={styles.modalFieldLabel}>3. Custom Notes (Optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="E.g. Kid-friendly, extra spicy, one-pot dish"
                  placeholderTextColor="#9CA3AF"
                  value={leftoverNotes}
                  onChangeText={setLeftoverNotes}
                />

                {/* Error Banner */}
                {leftoverError && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorTitle}>⚠️ Generation Note</Text>
                    <Text style={styles.errorBody}>{leftoverError}</Text>
                    {isLeftoverUpgradeRequired && (
                      <Text style={styles.upgradeNoticeText}>
                        Upgrade to Meltto Pro in Settings for 50 AI queries/week.
                      </Text>
                    )}
                  </View>
                )}

                {/* Generate Button */}
                <TouchableOpacity
                  style={[
                    styles.generateRecipeBtn,
                    (isGeneratingLeftover || selectedIngredients.length === 0) &&
                      styles.generateRecipeBtnDisabled,
                  ]}
                  onPress={handleGenerateLeftoverRecipe}
                  disabled={isGeneratingLeftover || selectedIngredients.length === 0}
                >
                  {isGeneratingLeftover ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.generateRecipeBtnText}> Creating Recipe...</Text>
                    </View>
                  ) : (
                    <Text style={styles.generateRecipeBtnText}>✨ Generate Recipe</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            ) : (
              /* Generated Recipe View */
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.generatedBadgeRow}>
                  <View
                    style={[
                      styles.aiModelBadge,
                      generatedRecipeResult.fallback
                        ? styles.aiModelBadgeFallback
                        : styles.aiModelBadgeGemini,
                    ]}
                  >
                    <Text
                      style={[
                        styles.aiModelBadgeText,
                        generatedRecipeResult.fallback
                          ? styles.aiModelBadgeTextFallback
                          : styles.aiModelBadgeTextGemini,
                      ]}
                    >
                      {generatedRecipeResult.fallback
                        ? '📦 Curated Recipe Match (Fallback)'
                        : '✨ Powered by Gemini AI'}
                    </Text>
                  </View>
                </View>

                {generatedRecipeResult.note && (
                  <Text style={styles.generatedNoteText}>
                    {generatedRecipeResult.note}
                  </Text>
                )}

                <Text style={styles.generatedTitle}>
                  {generatedRecipeResult.recipe.title}
                </Text>

                <Text style={styles.generatedMeta}>
                  ⏱️ {generatedRecipeResult.recipe.cookTimeMinutes} mins • {generatedRecipeResult.recipe.servings || 2} servings • {generatedRecipeResult.recipe.calories || 450} kcal
                </Text>

                <Text style={styles.generatedDesc}>
                  {generatedRecipeResult.recipe.description}
                </Text>

                <Text style={styles.recipeSubhead}>Ingredients</Text>
                <View style={styles.recipeIngredientsBox}>
                  {generatedRecipeResult.recipe.ingredients?.map((ing, idx) => (
                    <Text key={idx} style={styles.recipeIngItem}>
                      • {ing.quantity} {ing.unit} {ing.name}
                    </Text>
                  ))}
                </View>

                <Text style={styles.recipeSubhead}>Step-by-Step Instructions</Text>
                <View style={styles.recipeInstructionsBox}>
                  {generatedRecipeResult.recipe.instructions?.map((step, idx) => (
                    <View key={idx} style={styles.stepRow}>
                      <Text style={styles.stepNum}>{idx + 1}.</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.generatedActions}>
                  <TouchableOpacity
                    style={styles.cookAnotherBtn}
                    onPress={() => setGeneratedRecipeResult(null)}
                  >
                    <Text style={styles.cookAnotherBtnText}>Cook Another</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => setIsAiLeftoversOpen(false)}
                  >
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* ADD / EDIT ITEM MODAL                                */}
      {/* ==================================================== */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Pantry Item' : 'Add Pantry Item'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Item name (e.g. Pasta, Olive Oil)"
              placeholderTextColor="#9CA3AF"
              value={nameInput}
              onChangeText={setNameInput}
            />

            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginRight: 8 }]}
                placeholder="Quantity (e.g. 2)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={quantityInput}
                onChangeText={setQuantityInput}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="Unit (e.g. g, tbsp, cans)"
                placeholderTextColor="#9CA3AF"
                value={unitInput}
                onChangeText={setUnitInput}
              />
            </View>

            <Text style={styles.modalFieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalCategoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.smallPill,
                    categoryInput === cat && styles.smallPillActive,
                  ]}
                  onPress={() => setCategoryInput(cat)}
                >
                  <Text
                    style={[
                      styles.smallPillText,
                      categoryInput === cat && styles.smallPillTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.modalInput}
              placeholder="Expiry Date (YYYY-MM-DD)"
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
                disabled={isSubmittingItem}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveItem}
                disabled={isSubmittingItem}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {isSubmittingItem ? 'Saving...' : 'Save Item'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* CONSUME MODAL                                        */}
      {/* ==================================================== */}
      <Modal visible={!!consumingItem} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.consumeModalContent}>
            <Text style={styles.modalTitle}>Use / Consume Item</Text>
            <Text style={styles.consumeSub}>
              How much {consumingItem?.name} did you use?
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Amount (e.g. 1)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={consumeAmount}
              onChangeText={setConsumeAmount}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setConsumingItem(null)}
                disabled={isConsuming}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleConsumeSubmit}
                disabled={isConsuming}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {isConsuming ? 'Updating...' : 'Confirm Used'}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#10B981',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiLeftoversBtn: {
    backgroundColor: '#E0D4FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  aiLeftoversBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4C1D95',
  },
  addButton: {
    backgroundColor: '#0D5C3A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabButtonActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 20,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 9,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  warningBody: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
    marginBottom: 8,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusPillActive: {
    backgroundColor: '#0D5C3A',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  statusPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontWeight: '700',
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 10,
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
    color: '#1F2937',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeExpired: {
    backgroundColor: '#FEE2E2',
  },
  badgeExpiredText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  badgeExpiring: {
    backgroundColor: '#FEF3C7',
  },
  badgeExpiringText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  itemQuantity: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  useButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#E6F4EA',
  },
  useButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D5C3A',
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  editButtonText: {
    fontSize: 12,
    color: '#4B5563',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
  },

  // Suggestions styles
  suggestionsContainer: {
    gap: 12,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    padding: 14,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
    backgroundColor: '#D1FAE5',
  },
  matchBadgePartial: {
    backgroundColor: '#FEF3C7',
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  matchBadgeTextFull: {
    color: '#065F46',
  },
  matchBadgeTextPartial: {
    color: '#92400E',
  },
  ingredientsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  ingredientsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  ingredientsListText: {
    fontSize: 11,
    color: '#4B5563',
  },
  missingListText: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  viewRecipeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  viewRecipeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  addGroceryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#9ED034',
  },
  addGroceryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2A06',
  },

  // Modal common
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
  consumeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderSparkle: {
    fontSize: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#4C1D95',
  },
  modalSheetSub: {
    fontSize: 11,
    color: '#6B21A8',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  consumeSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
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
    marginTop: 8,
    marginBottom: 6,
  },
  modalCategoryScroll: {
    marginBottom: 10,
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

  // AI Leftovers Sheet
  aiLeftoverSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  ingredientChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ingredientChipSelected: {
    backgroundColor: '#E0D4FF',
    borderColor: '#C4B5FD',
  },
  ingredientChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  ingredientChipTextSelected: {
    color: '#4C1D95',
    fontWeight: '700',
  },
  customAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  customAddInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    backgroundColor: '#F9FAFB',
  },
  customAddBtn: {
    backgroundColor: '#0D5C3A',
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedCountText: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 10,
  },
  timeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  timeOptionPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeOptionPillActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  timeOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  timeOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  errorBody: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2,
  },
  upgradeNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D5C3A',
    marginTop: 4,
  },
  generateRecipeBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  generateRecipeBtnDisabled: {
    opacity: 0.5,
  },
  generateRecipeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Generated Recipe View
  generatedBadgeRow: {
    marginBottom: 8,
  },
  aiModelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiModelBadgeGemini: {
    backgroundColor: '#E0D4FF',
  },
  aiModelBadgeFallback: {
    backgroundColor: '#FEF3C7',
  },
  aiModelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  aiModelBadgeTextGemini: {
    color: '#4C1D95',
  },
  aiModelBadgeTextFallback: {
    color: '#92400E',
  },
  generatedNoteText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  generatedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  generatedMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  generatedDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 12,
  },
  recipeSubhead: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
    marginBottom: 6,
  },
  recipeIngredientsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  recipeIngItem: {
    fontSize: 12,
    color: '#374151',
  },
  recipeInstructionsBox: {
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D5C3A',
    width: 20,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    lineHeight: 17,
  },
  generatedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  cookAnotherBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cookAnotherBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  doneBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0D5C3A',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
