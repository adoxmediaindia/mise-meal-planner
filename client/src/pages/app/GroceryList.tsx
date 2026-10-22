import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../context/PlanContext.js';
import { ArrowLeft, Copy, Check, RotateCcw } from 'lucide-react';
import { SupermarketAisle } from '../../types/index.js';

export const GroceryList: React.FC = () => {
  const { shoppingList, toggleShoppingItem, resetShoppingList, isLoading } = usePlan();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeAisleFilter, setActiveAisleFilter] = useState<string>('All');

  const items = shoppingList?.items || [];
  const itemsBought = shoppingList?.itemsBoughtCount || 0;
  const totalItems = shoppingList?.totalItemsCount || 0;
  const percentage = totalItems > 0 ? Math.round((itemsBought / totalItems) * 100) : 0;

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
                    onClick={() => toggleShoppingItem(item.id)}
                    className="flex items-center gap-3.5 p-3.5 px-4 hover:bg-gray-50/70 transition-colors cursor-pointer select-none"
                  >
                    {/* Custom Checkbox */}
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 ${
                        item.isBought
                          ? 'bg-[#9ed034] border-[#9ed034] text-[#1f2a06]'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {item.isBought && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>

                    <span className="text-xl flex-shrink-0">{item.icon || '🛒'}</span>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-sans font-bold text-sm text-[#2a2a2a] transition-all truncate ${
                          item.isBought ? 'line-through text-gray-400 font-normal' : ''
                        }`}
                      >
                        {item.name}
                      </div>
                      {item.recipeTitles && item.recipeTitles.length > 0 && (
                        <div className="text-[11px] text-[#9a9a94] truncate">
                          Used in: {item.recipeTitles.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div
                      className={`text-xs font-bold flex-shrink-0 ${
                        item.isBought ? 'text-gray-300' : 'text-[#6b6b6b]'
                      }`}
                    >
                      {item.totalQuantity} {item.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[24px] p-8 text-center text-[#6b6b6b] border border-gray-200">
          No items in shopping list. Generate a meal plan to populate your groceries!
        </div>
      )}
    </div>
  );
};
