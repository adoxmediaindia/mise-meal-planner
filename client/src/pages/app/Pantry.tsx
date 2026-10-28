import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { IPantryItem, IPantryRecipeMatch, SupermarketAisle } from '../../types/index.js';
import { Button } from '../../components/common/Button.js';
import { AllergyBanner } from '../../components/common/AllergyBanner.js';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  Trash2,
  Edit2,
  Minus,
  Sparkles,
  ShoppingBag,
  ChefHat,
  X,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES: SupermarketAisle[] = [
  'Fresh Produce',
  'Meat & Seafood',
  'Dairy & Refrigerated',
  'Bakery',
  'Pantry & Grains',
  'Spices & Condiments',
  'Frozen',
];

export const Pantry: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'suggestions'>('inventory');

  // Inventory State
  const [items, setItems] = useState<IPantryItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expired' | 'expiring_soon' | 'fresh'>('all');

  // Suggestions State
  const [suggestions, setSuggestions] = useState<IPantryRecipeMatch[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsFilter, setSuggestionsFilter] = useState<'all' | 'ready' | 'missing1_2'>('all');
  const [addingGroceryRecipeId, setAddingGroceryRecipeId] = useState<string | null>(null);
  const [grocerySuccessMessage, setGrocerySuccessMessage] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IPantryItem | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [modalUnit, setModalUnit] = useState('');
  const [modalCategory, setModalCategory] = useState<SupermarketAisle>('Pantry & Grains');
  const [modalExpiry, setModalExpiry] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Consume Modal State
  const [consumingItem, setConsumingItem] = useState<IPantryItem | null>(null);
  const [consumeAmount, setConsumeAmount] = useState<number>(1);
  const [isConsuming, setIsConsuming] = useState(false);

  // Chef Mise AI Leftovers Modal State
  const [isChefMiseModalOpen, setIsChefMiseModalOpen] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredientInput, setCustomIngredientInput] = useState('');
  const [leftoverMaxTime, setLeftoverMaxTime] = useState<number>(30);
  const [leftoverNotes, setLeftoverNotes] = useState('');
  const [isGeneratingLeftover, setIsGeneratingLeftover] = useState(false);
  const [leftoverError, setLeftoverError] = useState<string | null>(null);
  const [isLeftoverUpgradeRequired, setIsLeftoverUpgradeRequired] = useState(false);
  const [generatedRecipeResult, setGeneratedRecipeResult] = useState<any | null>(null);

  const handleOpenChefMiseModal = () => {
    // Pre-populate with top pantry items
    const defaultIngredients = items.slice(0, 5).map((i) => i.name);
    setSelectedIngredients(defaultIngredients);
    setCustomIngredientInput('');
    setLeftoverError(null);
    setIsLeftoverUpgradeRequired(false);
    setGeneratedRecipeResult(null);
    setIsChefMiseModalOpen(true);
  };

  const handleToggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleAddCustomIngredient = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customIngredientInput.trim();
    if (trimmed && !selectedIngredients.includes(trimmed)) {
      setSelectedIngredients((prev) => [...prev, trimmed]);
      setCustomIngredientInput('');
    }
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
      const res = await api.generateLeftoverRecipe({
        ingredients: selectedIngredients,
        maxCookTimeMinutes: leftoverMaxTime,
        additionalNotes: leftoverNotes || undefined,
      });
      setGeneratedRecipeResult(res.data);
    } catch (err: any) {
      if (err.status === 403 || err.response?.data?.code === 'UPGRADE_REQUIRED') {
        setIsLeftoverUpgradeRequired(true);
        setLeftoverError(err.response?.data?.error || 'Weekly AI generation quota reached. Upgrade to Pro for 50 AI queries/week.');
      } else {
        setLeftoverError(err.message || 'Failed to generate leftover recipe.');
      }
    } finally {
      setIsGeneratingLeftover(false);
    }
  };

  // Load Inventory
  const fetchInventory = async () => {
    setIsLoadingItems(true);
    try {
      const res = await api.getPantryItems({
        search: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setItems(res.data);
    } catch (err: any) {
      console.error('Failed to load pantry items:', err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Load Suggestions
  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const res = await api.getPantryRecipeSuggestions({ limit: 30 });
      setSuggestions(res.data);
    } catch (err: any) {
      console.error('Failed to load pantry suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [searchQuery, selectedCategory, statusFilter]);

  useEffect(() => {
    if (activeTab === 'suggestions') {
      fetchSuggestions();
    }
  }, [activeTab]);

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setModalName('');
    setModalQuantity(1);
    setModalUnit('');
    setModalCategory('Pantry & Grains');
    setModalExpiry('');
    setModalNotes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (item: IPantryItem) => {
    setEditingItem(item);
    setModalName(item.name);
    setModalQuantity(item.quantity);
    setModalUnit(item.unit || '');
    setModalCategory(item.category);
    setModalExpiry(
      item.expiryDate ? new Date(item.expiryDate).toISOString().slice(0, 10) : ''
    );
    setModalNotes(item.notes || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) {
      setModalError('Please enter an item name');
      return;
    }
    if (modalQuantity <= 0) {
      setModalError('Quantity must be greater than 0');
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      if (editingItem) {
        const id = editingItem._id || editingItem.id!;
        await api.updatePantryItem(id, {
          name: modalName.trim(),
          quantity: Number(modalQuantity),
          unit: modalUnit.trim(),
          category: modalCategory,
          expiryDate: modalExpiry ? new Date(modalExpiry).toISOString() : null,
          notes: modalNotes.trim() || undefined,
        });
      } else {
        await api.addPantryItem({
          name: modalName.trim(),
          quantity: Number(modalQuantity),
          unit: modalUnit.trim(),
          category: modalCategory,
          expiryDate: modalExpiry ? new Date(modalExpiry).toISOString() : null,
          notes: modalNotes.trim() || undefined,
        });
      }
      setIsModalOpen(false);
      await fetchInventory();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (item: IPantryItem) => {
    const id = item._id || item.id!;
    if (confirm(`Remove "${item.name}" from your pantry?`)) {
      try {
        await api.deletePantryItem(id);
        await fetchInventory();
      } catch (err: any) {
        alert(err.message || 'Failed to delete item');
      }
    }
  };

  // Open Consume Modal
  const handleOpenConsume = (item: IPantryItem) => {
    setConsumingItem(item);
    setConsumeAmount(Math.min(1, item.quantity));
  };

  // Submit Consume
  const handleConsume = async () => {
    if (!consumingItem) return;
    const id = consumingItem._id || consumingItem.id!;
    setIsConsuming(true);
    try {
      await api.consumePantryItem(id, consumeAmount);
      setConsumingItem(null);
      await fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Failed to consume item');
    } finally {
      setIsConsuming(false);
    }
  };

  // Add missing ingredients to grocery
  const handleAddMissingToGrocery = async (recipeId: string) => {
    setAddingGroceryRecipeId(recipeId);
    setGrocerySuccessMessage(null);
    try {
      const res = await api.addMissingIngredientsToGrocery(recipeId);
      setGrocerySuccessMessage(res.message);
      setTimeout(() => setGrocerySuccessMessage(null), 4000);
      await fetchSuggestions();
    } catch (err: any) {
      alert(err.message || 'Failed to add ingredients to grocery list');
    } finally {
      setAddingGroceryRecipeId(null);
    }
  };

  // Counts for alert banner
  const expiredCount = items.filter((i) => i.isExpired).length;
  const expiringSoonCount = items.filter((i) => i.isExpiringSoon && !i.isExpired).length;

  // Filtered suggestions
  const displayedSuggestions = suggestions.filter((match) => {
    if (suggestionsFilter === 'ready') return match.canCookFully;
    if (suggestionsFilter === 'missing1_2') return match.missingIngredients.length <= 2;
    return true;
  });

  return (
    <div className="space-y-5 animate-fadeIn pb-14">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-xs font-bold uppercase tracking-widest text-[#9a9a94]">
            Pantry Inventory &amp; Matcher
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#2a2a2a] mt-0.5">
            kitchen pantry
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenChefMiseModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#E0D4FF] border border-[#cfbefb] text-[#3c2a68] text-xs font-bold shadow-xs hover:bg-[#d6c5fe] transition-all cursor-pointer"
            title="Generate recipe from leftover ingredients with AI"
          >
            <Sparkles className="w-4 h-4 text-[#633bba]" />
            <span>Ask Chef Mise AI</span>
          </button>

          {activeTab === 'inventory' ? (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1f2a06] text-white text-xs font-bold shadow-xs hover:bg-[#2e3e09] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={fetchSuggestions}
              disabled={isLoadingSuggestions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-[#6b6b6b] hover:text-[#2a2a2a] shadow-xs hover:border-[#8bc020] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
              <span>Refresh Matches</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Tabs */}
      <div className="flex bg-white/70 backdrop-blur-xs p-1 rounded-2xl border border-[#2a2a2a]/6 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-[#1f2a06] text-white shadow-xs'
              : 'text-[#6b6b6b] hover:text-[#2a2a2a]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Inventory ({items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'suggestions'
              ? 'bg-[#1f2a06] text-white shadow-xs'
              : 'text-[#6b6b6b] hover:text-[#2a2a2a]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#9ed034]" />
          <span>Cook with Pantry</span>
        </button>
      </div>

      {/* Global Success / Alert Banner */}
      {grocerySuccessMessage && (
        <div className="p-3 bg-[#9ed034]/20 border border-[#9ed034] rounded-2xl text-xs font-bold text-[#1f2a06] flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-[#8bc020] flex-shrink-0" />
          <span>{grocerySuccessMessage}</span>
          <Link
            to="/app/grocery-list"
            className="ml-auto underline font-black hover:text-black flex items-center gap-1"
          >
            <span>View Grocery List</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: INVENTORY                                         */}
      {/* ======================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Expiry Warning Callout (if any expired or expiring soon) */}
          {(expiredCount > 0 || expiringSoonCount > 0) && (
            <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-[#2a2a2a]">
                <div className="font-bold text-amber-900">
                  {expiredCount > 0 && `${expiredCount} item${expiredCount > 1 ? 's' : ''} expired! `}
                  {expiringSoonCount > 0 && `${expiringSoonCount} item${expiringSoonCount > 1 ? 's' : ''} expiring within 3 days.`}
                </div>
                <div className="text-amber-800/80 mt-0.5">
                  Use them up soon to avoid food waste and save on your weekly budget.
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {expiredCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        statusFilter === 'expired'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                      }`}
                    >
                      Filter Expired ({expiredCount})
                    </button>
                  )}
                  {expiringSoonCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter(statusFilter === 'expiring_soon' ? 'all' : 'expiring_soon')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        statusFilter === 'expiring_soon'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200'
                      }`}
                    >
                      Filter Expiring Soon ({expiringSoonCount})
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search & Category Filter Bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search ingredients in your pantry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-[#2a2a2a] placeholder-gray-400 focus:outline-none focus:border-[#9ed034] shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category horizontal scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#1f2a06] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-[#6b6b6b] hover:text-[#2a2a2a]'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#9ed034] text-[#1f2a06] font-black shadow-xs'
                      : 'bg-white border border-gray-200 text-[#6b6b6b] hover:text-[#2a2a2a]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Items Listing */}
          {isLoadingItems ? (
            <div className="text-center py-12 text-[#6b6b6b] text-sm">
              Loading pantry ingredients...
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-2.5">
              {items.map((item) => {
                const id = item._id || item.id!;
                return (
                  <div
                    key={id}
                    className="bg-white rounded-[20px] p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(42,42,42,0.04)] border border-[#2a2a2a]/6 flex items-center justify-between gap-3 hover:border-gray-300 transition-all group"
                  >
                    {/* Icon & Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                        {item.icon || '🥫'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-sans font-bold text-sm text-[#2a2a2a] truncate">
                            {item.name}
                          </h3>

                          {/* Category Badge */}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {item.category}
                          </span>

                          {/* Expiry Status Badge */}
                          {item.isExpired ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Expired
                            </span>
                          ) : item.isExpiringSoon ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.daysUntilExpiry === 0
                                ? 'Expires today'
                                : `Expires in ${item.daysUntilExpiry}d`}
                            </span>
                          ) : item.expiryDate ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              Fresh ({item.daysUntilExpiry}d left)
                            </span>
                          ) : null}
                        </div>

                        {/* Quantity & Notes */}
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6b6b6b]">
                          <span className="font-bold text-[#1f2a06]">
                            {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                          </span>
                          {item.notes && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="truncate italic text-gray-500">{item.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Consume quick button */}
                      <button
                        type="button"
                        onClick={() => handleOpenConsume(item)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-200 text-[#6b6b6b] hover:bg-gray-50 hover:text-black transition-all cursor-pointer"
                        title="Consume / adjust quantity"
                      >
                        Use
                      </button>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                        title="Edit item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[24px] p-8 text-center border border-[#2a2a2a]/6 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#9ed034]/20 flex items-center justify-center text-2xl">
                🥫
              </div>
              <h3 className="font-serif font-bold text-lg text-[#2a2a2a]">
                {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                  ? 'No matching pantry items'
                  : 'Your pantry is currently empty'}
              </h3>
              <p className="text-xs text-[#6b6b6b] max-w-sm mx-auto">
                {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search query or category filters.'
                  : 'Add ingredients you have at home (pasta, olive oil, garlic, spices) to get smart recipe suggestions and auto-deduct from your grocery list.'}
              </p>
              <div>
                <Button onClick={handleOpenAddModal}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Pantry Item
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: COOK WITH PANTRY (SMART RECIPE SUGGESTIONS)       */}
      {/* ======================================================== */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          {/* Sub-filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            <button
              type="button"
              onClick={() => setSuggestionsFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                suggestionsFilter === 'all'
                  ? 'bg-[#1f2a06] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-[#6b6b6b] hover:text-[#2a2a2a]'
              }`}
            >
              All Matches ({suggestions.length})
            </button>
            <button
              type="button"
              onClick={() => setSuggestionsFilter('ready')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                suggestionsFilter === 'ready'
                  ? 'bg-[#9ed034] text-[#1f2a06] font-black shadow-xs'
                  : 'bg-white border border-gray-200 text-[#6b6b6b] hover:text-[#2a2a2a]'
              }`}
            >
              Ready to Cook (100% in Pantry)
            </button>
            <button
              type="button"
              onClick={() => setSuggestionsFilter('missing1_2')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                suggestionsFilter === 'missing1_2'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-xs'
                  : 'bg-white border border-gray-200 text-[#6b6b6b] hover:text-[#2a2a2a]'
              }`}
            >
              Missing ≤ 2 Items
            </button>
          </div>

          {/* Suggestions List */}
          {isLoadingSuggestions ? (
            <div className="text-center py-12 text-[#6b6b6b] text-sm">
              Analyzing pantry inventory against recipes...
            </div>
          ) : displayedSuggestions.length > 0 ? (
            <div className="space-y-4">
              {displayedSuggestions.map((match) => {
                const recipe = match.recipe;
                const isReady = match.canCookFully;
                const isAdding = addingGroceryRecipeId === recipe._id;

                return (
                  <div
                    key={recipe._id}
                    className="bg-white rounded-[24px] p-4 sm:p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3.5 hover:border-gray-300 transition-all"
                  >
                    {/* Recipe Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {recipe.image && (
                          <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-gray-100"
                          />
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/app/recipes/${recipe._id}`}
                            className="font-serif font-bold text-base sm:text-lg text-[#2a2a2a] hover:text-[#8bc020] transition-colors line-clamp-1"
                          >
                            {recipe.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1 text-xs text-[#6b6b6b]">
                            <span>⏱️ {recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins</span>
                            <span>•</span>
                            <span>🍴 {recipe.servings} servings</span>
                            <span>•</span>
                            <span className="capitalize">{recipe.cuisine}</span>
                          </div>
                        </div>
                      </div>

                      {/* Match Badge */}
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isReady
                              ? 'bg-[#9ed034]/20 text-[#1f2a06] border border-[#9ed034]'
                              : match.matchPercentage >= 70
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-gray-100 text-[#6b6b6b]'
                          }`}
                        >
                          {isReady ? '100% Ready' : `${match.matchPercentage}% Match`}
                        </span>
                        {!isReady && (
                          <span className="text-[10px] text-gray-500 mt-1">
                            {match.missingIngredients.length} item{match.missingIngredients.length > 1 ? 's' : ''} missing
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Breakdown of available vs missing ingredients */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
                      {/* In Pantry */}
                      <div>
                        <div className="font-bold text-[#1f2a06] flex items-center gap-1.5 mb-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-[#8bc020]" />
                          <span>In Your Pantry ({match.availableIngredients.length})</span>
                        </div>
                        {match.availableIngredients.length > 0 ? (
                          <ul className="space-y-1 text-gray-600 pl-5 list-disc text-[11px]">
                            {match.availableIngredients.slice(0, 4).map((ing, idx) => (
                              <li key={idx} className="truncate">
                                {ing.name} ({ing.quantity}{ing.unit ? ` ${ing.unit}` : ''})
                              </li>
                            ))}
                            {match.availableIngredients.length > 4 && (
                              <li className="text-gray-400">
                                +{match.availableIngredients.length - 4} more
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">No exact matches</p>
                        )}
                      </div>

                      {/* Missing */}
                      <div>
                        <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Missing to Buy ({match.missingIngredients.length})</span>
                        </div>
                        {match.missingIngredients.length > 0 ? (
                          <ul className="space-y-1 text-gray-600 pl-5 list-disc text-[11px]">
                            {match.missingIngredients.slice(0, 4).map((ing, idx) => (
                              <li key={idx} className="truncate">
                                <span className="font-semibold text-gray-800">{ing.name}</span>{' '}
                                ({ing.deficitQuantity}{ing.unit ? ` ${ing.unit}` : ''})
                                {ing.estimatedCost > 0 && (
                                  <span className="text-gray-400"> ~${ing.estimatedCost.toFixed(2)}</span>
                                )}
                              </li>
                            ))}
                            {match.missingIngredients.length > 4 && (
                              <li className="text-gray-400">
                                +{match.missingIngredients.length - 4} more
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-emerald-700 font-bold">
                            You have all ingredients! Ready to cook!
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        to={`/app/recipes/${recipe._id}`}
                        className="text-xs font-bold text-[#6b6b6b] hover:text-[#2a2a2a] flex items-center gap-1 transition-colors"
                      >
                        <ChefHat className="w-4 h-4 text-[#8bc020]" />
                        <span>View Recipe</span>
                      </Link>

                      {!isReady && (
                        <button
                          type="button"
                          onClick={() => handleAddMissingToGrocery(recipe._id)}
                          disabled={isAdding}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1f2a06] text-white text-xs font-bold hover:bg-[#2e3e09] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>
                            {isAdding
                              ? 'Adding items...'
                              : `Add ${match.missingIngredients.length} Missing to Grocery`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[24px] p-8 text-center border border-[#2a2a2a]/6 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-2xl">
                🍳
              </div>
              <h3 className="font-serif font-bold text-lg text-[#2a2a2a]">
                No recipe matches for this filter
              </h3>
              <p className="text-xs text-[#6b6b6b] max-w-sm mx-auto">
                Add more staple items to your pantry or try viewing recipes across all categories in Explore.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <Button onClick={() => setActiveTab('inventory')}>
                  Go to Inventory
                </Button>
                <Link
                  to="/app/explore"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-gray-300 text-xs font-bold text-[#2a2a2a] hover:bg-gray-50"
                >
                  Explore All Recipes
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strict Allergen Exclusion Guarantee Banner */}
      <AllergyBanner compact={true} />

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PANTRY ITEM                            */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-xl text-[#2a2a2a]">
                {editingItem ? 'Edit Pantry Item' : 'Add Pantry Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-[#6b6b6b] mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Olive Oil, Brown Rice, Eggs"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2a2a2a] focus:outline-none focus:border-[#9ed034]"
                  required
                />
              </div>

              {/* Quantity & Unit Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6b6b6b] mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={modalQuantity}
                    onChange={(e) => setModalQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2a2a2a] focus:outline-none focus:border-[#9ed034]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6b6b6b] mb-1">
                    Unit (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. g, ml, cup, can"
                    value={modalUnit}
                    onChange={(e) => setModalUnit(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2a2a2a] focus:outline-none focus:border-[#9ed034]"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-[#6b6b6b] mb-1">
                  Category / Aisle
                </label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value as SupermarketAisle)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2a2a2a] focus:outline-none focus:border-[#9ed034]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-[#6b6b6b] mb-1">
                  Expiry Date (optional)
                </label>
                <input
                  type="date"
                  value={modalExpiry}
                  onChange={(e) => setModalExpiry(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2a2a2a] focus:outline-none focus:border-[#9ed034]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#6b6b6b] mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. opened last week, top shelf"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2a2a2a] focus:outline-none focus:border-[#9ed034]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <Button type="submit" isLoading={isSaving}>
                  {editingItem ? 'Update Item' : 'Add to Pantry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONSUME / USE QUANTITY                            */}
      {/* ======================================================== */}
      {consumingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-2xl animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-[#2a2a2a]">
                Use "{consumingItem.name}"
              </h3>
              <button
                type="button"
                onClick={() => setConsumingItem(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6b6b6b]">
              Currently have: <strong>{consumingItem.quantity}{consumingItem.unit ? ` ${consumingItem.unit}` : ''}</strong>.
              Enter how much you used:
            </p>

            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={consumingItem.quantity}
                value={consumeAmount}
                onChange={(e) => setConsumeAmount(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2a2a2a] focus:outline-none focus:border-[#9ed034]"
              />
              {consumingItem.unit ? <span className="text-xs font-bold text-gray-500">{consumingItem.unit}</span> : null}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConsumingItem(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <Button onClick={handleConsume} isLoading={isConsuming}>
                Confirm Use
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CHEF MISE AI LEFTOVERS GENERATOR                  */}
      {/* ======================================================== */}
      {isChefMiseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-xl w-full p-6 shadow-2xl animate-scaleUp space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#9333EA] text-white flex items-center justify-center shadow-xs">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2a2a2a]">
                    Chef Mise AI Leftovers
                  </h3>
                  <p className="text-xs text-gray-500">
                    Transform what's in your pantry into a fresh dinner
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChefMiseModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!generatedRecipeResult ? (
              <div className="space-y-4">
                {/* Ingredients selector */}
                <div>
                  <label className="block text-xs font-bold text-[#2a2a2a] uppercase tracking-wider mb-1.5">
                    Select Leftover Ingredients
                  </label>
                  {items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200 mb-2">
                      {items.map((item) => {
                        const isSelected = selectedIngredients.includes(item.name);
                        return (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => handleToggleIngredient(item.name)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#9333EA] text-white shadow-xs'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom ingredient input */}
                  <form onSubmit={handleAddCustomIngredient} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an extra ingredient (e.g. Garlic, Pasta, Eggs)..."
                      value={customIngredientInput}
                      onChange={(e) => setCustomIngredientInput(e.target.value)}
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[#2a2a2a] focus:outline-none focus:border-[#9333EA]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomIngredient}
                      className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 cursor-pointer"
                    >
                      Add
                    </button>
                  </form>

                  {/* Selected ingredients list */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <span className="text-[11px] font-bold text-gray-400 self-center">Included:</span>
                    {selectedIngredients.map((ing) => (
                      <span
                        key={ing}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF5FF] border border-[#E9D5FF] text-xs font-semibold text-[#6B21A8]"
                      >
                        {ing}
                        <button
                          type="button"
                          onClick={() => handleToggleIngredient(ing)}
                          className="hover:text-red-500 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {selectedIngredients.length === 0 && (
                      <span className="text-xs text-gray-400 italic">No ingredients selected yet</span>
                    )}
                  </div>
                </div>

                {/* Time selector */}
                <div>
                  <label className="block text-xs font-bold text-[#2a2a2a] uppercase tracking-wider mb-1.5">
                    Max Cooking Time
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setLeftoverMaxTime(mins)}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          leftoverMaxTime === mins
                            ? 'bg-[#9333EA] text-white border-[#9333EA] shadow-xs'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {mins} mins
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special notes */}
                <div>
                  <label className="block text-xs font-bold text-[#2a2a2a] uppercase tracking-wider mb-1">
                    Special Request (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., kid-friendly, one-pot dinner, spicy..."
                    value={leftoverNotes}
                    onChange={(e) => setLeftoverNotes(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[#2a2a2a] focus:outline-none focus:border-[#9333EA]"
                  />
                </div>

                {/* Error Banner */}
                {leftoverError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold">Generation failed</p>
                      <p>{leftoverError}</p>
                      {isLeftoverUpgradeRequired && (
                        <Link
                          to="/app/account"
                          className="inline-block mt-2 font-bold text-[#8bc020] hover:underline"
                        >
                          Upgrade to Mise Pro for 50 AI queries / week &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-gray-400">
                    Your allergy & dietary restrictions are always enforced.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsChefMiseModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <Button
                      onClick={handleGenerateLeftoverRecipe}
                      isLoading={isGeneratingLeftover}
                      disabled={selectedIngredients.length === 0}
                      className="bg-[#9333EA] hover:bg-[#7E22CE] text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      {isGeneratingLeftover ? 'Cooking...' : 'Generate Recipe'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Generated Recipe View */
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      generatedRecipeResult.isAiGenerated
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {generatedRecipeResult.isAiGenerated ? 'Chef Mise AI Recipe' : 'Safe Catalog Match (Fallback)'}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {generatedRecipeResult.recipe.cuisine} • {generatedRecipeResult.recipe.prepTimeMinutes + generatedRecipeResult.recipe.cookTimeMinutes} mins
                  </span>
                </div>

                <div>
                  <h4 className="font-serif text-xl font-bold text-[#2a2a2a]">
                    {generatedRecipeResult.recipe.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {generatedRecipeResult.recipe.description}
                  </p>
                </div>

                {/* Macro Summary */}
                <div className="grid grid-cols-4 gap-2 p-2.5 bg-gray-50 rounded-xl text-center">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Calories</span>
                    <span className="text-xs font-bold text-[#2a2a2a]">{generatedRecipeResult.recipe.calories}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Protein</span>
                    <span className="text-xs font-bold text-[#2a2a2a]">{generatedRecipeResult.recipe.proteinGrams}g</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Carbs</span>
                    <span className="text-xs font-bold text-[#2a2a2a]">{generatedRecipeResult.recipe.carbsGrams}g</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Fat</span>
                    <span className="text-xs font-bold text-[#2a2a2a]">{generatedRecipeResult.recipe.fatGrams}g</span>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Ingredients ({generatedRecipeResult.recipe.ingredients.length})
                  </h5>
                  <ul className="text-xs space-y-1 max-h-36 overflow-y-auto p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    {generatedRecipeResult.recipe.ingredients.map((ing: any, idx: number) => (
                      <li key={idx} className="flex justify-between text-gray-700">
                        <span>• {ing.name}</span>
                        <span className="font-medium text-gray-500">{ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Instructions
                  </h5>
                  <ol className="text-xs space-y-1.5 max-h-40 overflow-y-auto p-2.5 bg-gray-50 rounded-xl border border-gray-100 list-decimal list-inside text-gray-700">
                    {generatedRecipeResult.recipe.instructions.map((step: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="font-medium text-gray-800">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setGeneratedRecipeResult(null)}
                    className="text-xs font-bold text-[#9333EA] hover:underline cursor-pointer"
                  >
                    &larr; Create another recipe
                  </button>
                  <Button onClick={() => setIsChefMiseModalOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
