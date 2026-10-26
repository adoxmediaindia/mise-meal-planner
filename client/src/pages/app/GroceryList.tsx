import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../context/PlanContext.js';
import {
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  X,
  Edit2,
} from 'lucide-react';
import { SupermarketAisle } from '../../types/index.js';
import { Button } from '../../components/common/Button.js';

export const GroceryList: React.FC = () => {
  const {
    shoppingList,
    toggleShoppingItem,
    resetShoppingList,
    addCustomShoppingItem,
    editShoppingItem,
    deleteShoppingItem,
    isLoading,
  } = usePlan();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [activeAisleFilter, setActiveAisleFilter] = useState<string>('All');

  // Custom Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemUnit, setItemUnit] = useState('');
  const [itemAisle, setItemAisle] = useState<SupermarketAisle>('Fresh Produce');
  const [itemCost, setItemCost] = useState(0);
  const [itemIcon, setItemIcon] = useState('🛒');
  const [addError, setAddError] = useState<string | null>(null);

  const items = shoppingList?.items || [];
  const itemsBought = shoppingList?.itemsBoughtCount || 0;
  const totalItems = shoppingList?.totalItemsCount || 0;
  const percentage = totalItems > 0 ? Math.round((itemsBought / totalItems) * 100) : 0;

  const allAisles: SupermarketAisle[] = [
    'Fresh Produce',
    'Meat & Seafood',
    'Dairy & Refrigerated',
    'Bakery',
    'Pantry & Grains',
    'Spices & Condiments',
    'Frozen',
  ];

  // Unique aisles present in the current shopping list
  const aisles: SupermarketAisle[] = Array.from(
    new Set(items.map((i) => i.aisle))
  ) as SupermarketAisle[];

  const filteredItems =
    activeAisleFilter === 'All'
      ? items
      : items.filter((i) => i.aisle === activeAisleFilter);

  // Group filtered items by aisle
  const groupedByAisle = filteredItems.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.aisle]) acc[item.aisle] = [];
    acc[item.aisle].push(item);
    return acc;
  }, {});

  const handleCopyList = () => {
    if (items.length === 0) return;
    let text = `🛒 Mise Grocery List (${shoppingList?.supermarket || 'Supermarket'})\n\n`;

    aisles.forEach((aisle) => {
      const aisleItems = items.filter((i) => i.aisle === aisle);
      if (aisleItems.length > 0) {
        text += `[${aisle.toUpperCase()}]\n`;
        aisleItems.forEach((item) => {
          text += `${item.isBought ? '✓ ' : '• '}${item.name} — ${item.totalQuantity} ${item.unit}\n`;
        });
        text += '\n';
      }
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setAddError('Item name is required');
      return;
    }
    setAddError(null);

    try {
      await addCustomShoppingItem({
        name: itemName.trim(),
        totalQuantity: itemQty || 1,
        unit: itemUnit.trim(),
        aisle: itemAisle,
        estimatedCost: itemCost || 0,
        icon: itemIcon || '🛒',
      });
      setIsAddModalOpen(false);
      setItemName('');
      setItemQty(1);
      setItemUnit('');
      setItemCost(0);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add item');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-10">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/plan')}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#2a2a2a] shadow-xs hover:border-[#8bc020] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif font-black text-2xl text-[#2a2a2a]">Grocery List</h1>
            <p className="text-xs font-semibold text-[#8bc020]">
              Tuned for {shoppingList?.supermarket || 'Aldi'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAddError(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1f2a06] text-white text-xs font-bold shadow-xs hover:bg-[#2e3e09] cursor-pointer transition-all"
            title="Add custom item"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Item</span>
          </button>

          <button
            type="button"
            onClick={handleCopyList}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-[#2a2a2a] shadow-xs hover:border-[#8bc020] cursor-pointer transition-all"
            title="Copy list to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#8bc020]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={resetShoppingList}
            className="p-2 rounded-full bg-white border border-gray-200 text-[#6b6b6b] hover:text-red-600 shadow-xs cursor-pointer"
            title="Reset/Uncheck all items"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Box */}
      <div className="bg-white rounded-[24px] p-4 sm:p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">
            Shopping Progress
          </span>
          <span className="font-sans font-bold text-sm text-[#2a2a2a]">
            {itemsBought} of {totalItems} items ({percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[#9ed034] h-full rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Aisle Filter Pills */}
      {aisles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setActiveAisleFilter('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeAisleFilter === 'All'
                ? 'bg-[#9ed034] text-[#1f2a06]'
                : 'bg-white border border-gray-200 text-[#6b6b6b] hover:border-gray-300'
            }`}
          >
            All Aisles ({totalItems})
          </button>
          {aisles.map((aisle) => (
            <button
              key={aisle}
              type="button"
              onClick={() => setActiveAisleFilter(aisle)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeAisleFilter === aisle
                  ? 'bg-[#9ed034] text-[#1f2a06]'
                  : 'bg-white border border-gray-200 text-[#6b6b6b] hover:border-gray-300'
              }`}
            >
              {aisle}
            </button>
          ))}
        </div>
      )}

      {/* Items Grouped by Aisle */}
      {isLoading ? (
        <div className="text-center py-12 text-[#6b6b6b]">Loading grocery list...</div>
      ) : Object.keys(groupedByAisle).length > 0 ? (
        <div className="space-y-5">
          {Object.entries(groupedByAisle).map(([aisleName, aisleItems]) => (
            <div key={aisleName} className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8bc020] px-1">
                {aisleName} ({aisleItems.length})
              </h3>

              <div className="bg-white rounded-[22px] divide-y divide-gray-100 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 overflow-hidden">
                {aisleItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3.5 p-3.5 px-4 hover:bg-gray-50/70 transition-colors select-none group"
                  >
                    {/* Custom Checkbox */}
                    <div
                      onClick={() => toggleShoppingItem(item.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
                        item.isBought
                          ? 'bg-[#9ed034] border-[#9ed034] text-[#1f2a06]'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {item.isBought && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>

                    <span className="text-xl flex-shrink-0">{item.icon || '🛒'}</span>

                    {/* Text content */}
                    <div
                      onClick={() => toggleShoppingItem(item.id)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-sans font-bold text-sm text-[#2a2a2a] transition-all truncate ${
                            item.isBought ? 'line-through text-gray-400 font-normal' : ''
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.isCustom && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                            Custom
                          </span>
                        )}
                      </div>
                      {item.recipeTitles && item.recipeTitles.length > 0 && !item.isCustom && (
                        <div className="text-[11px] text-[#9a9a94] truncate">
                          Used in: {item.recipeTitles.join(', ')}
                        </div>
                      )}
                      {item.pantryNote && (
                        <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5 mt-0.5 inline-block">
                          📦 {item.pantryNote}
                        </div>
                      )}
                    </div>

                    {/* Quantity & Controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className={`text-xs font-bold ${
                          item.isBought ? 'text-gray-300' : 'text-[#6b6b6b]'
                        }`}
                      >
                        {item.totalQuantity} {item.unit}
                      </div>

                      {/* Delete button (always available, especially useful for custom items) */}
                      <button
                        type="button"
                        onClick={() => deleteShoppingItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[24px] p-8 text-center text-[#6b6b6b] border border-gray-200">
          No items in shopping list. Generate a meal plan or add custom items to get started!
        </div>
      )}

      {/* ADD CUSTOM ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#2a2a2a]">Add Custom Item</h3>
                <p className="text-xs text-[#6b6b6b]">Add non-recipe groceries to your list</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddCustomItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#2a2a2a] mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milk, Kitchen Roll, Eggs"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8bc020]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2a2a2a] mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={itemQty}
                    onChange={(e) => setItemQty(parseFloat(e.target.value) || 1)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2a2a2a] mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. bottle, pack, g"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2a2a2a] mb-1">Aisle</label>
                  <select
                    value={itemAisle}
                    onChange={(e) => setItemAisle(e.target.value as SupermarketAisle)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    {allAisles.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2a2a2a] mb-1">Est. Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemCost}
                    onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2a2a2a] mb-1">Emoji Icon</label>
                <div className="flex gap-2">
                  {['🛒', '🥛', '🍞', '🍎', '🥩', '🧻', '☕', '🧼'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setItemIcon(emoji)}
                      className={`text-xl p-1.5 rounded-lg border transition-all ${
                        itemIcon === emoji ? 'border-[#9ed034] bg-[#9ed034]/20' : 'border-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full">
                  Add to Grocery List
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
