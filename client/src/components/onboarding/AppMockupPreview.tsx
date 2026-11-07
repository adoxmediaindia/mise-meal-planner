import React from 'react';

interface AppMockupPreviewProps {
  supermarket?: string;
  currencySymbol?: string;
  estimatedCost?: number;
  userName?: string;
  recipes?: Array<{ title: string; cookTime?: number; emoji?: string }>;
}

export const AppMockupPreview: React.FC<AppMockupPreviewProps> = ({
  supermarket = 'Aldi',
  currencySymbol = '$',
  estimatedCost = 38.5,
  userName = 'Chef!',
  recipes = [
    { title: 'Spicy Sausage & Tomato Rigatoni', cookTime: 25, emoji: '🍝' },
    { title: 'Crispy Lemon Garlic Chicken', cookTime: 30, emoji: '🍗' },
    { title: 'Sesame Ginger Beef Stir-fry', cookTime: 20, emoji: '🥢' },
    { title: 'Creamy Spinach & Feta Orzo', cookTime: 25, emoji: '🥣' },
  ],
}) => {
  return (
    <div className="relative mx-auto w-[270px] sm:w-[290px] select-none">
      {/* Smartphone Outer Shell */}
      <div className="relative rounded-[42px] bg-[#2d2538] p-2.5 shadow-[0_20px_50px_rgba(45,37,56,0.35)] border-4 border-[#3f354f]">
        {/* Dynamic Island / Top Camera Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-end pr-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a24] border border-[#2a2a38]" />
        </div>

        {/* Screen Display */}
        <div className="relative rounded-[32px] bg-[#fbfbf9] overflow-hidden pt-7 pb-3 px-3.5 border border-gray-100 flex flex-col font-sans">
          {/* Status Bar */}
          <div className="flex justify-between items-center text-[10px] text-gray-800 font-semibold mb-2.5 px-1">
            <span>13:02</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px]">5G</span>
              <div className="w-4 h-2 border border-gray-800 rounded-xs p-[0.5px]">
                <div className="h-full w-2.5 bg-gray-800 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* App Header Greeting */}
          <div className="mb-2.5 px-0.5">
            <span className="text-[9px] tracking-wider uppercase font-bold text-gray-400">
              Good Afternoon
            </span>
            <h4 className="text-base font-extrabold text-[#1a1a1a] leading-tight">
              {userName}
            </h4>
            <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-[#eef7db] border border-[#9ed034]/40">
              <span className="text-[10px]">🛒</span>
              <span className="text-[10px] font-bold text-[#5c8511]">
                planned for {supermarket}
              </span>
            </div>
          </div>

          {/* Overview Metric Cards */}
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            {/* Cost Card */}
            <div className="bg-white rounded-xl p-2 border border-gray-200/80 shadow-2xs">
              <span className="text-[8px] font-bold uppercase text-gray-400 block">
                Est. Cost
              </span>
              <span className="text-xs font-black text-[#1a1a1a]">
                {currencySymbol}{estimatedCost.toFixed(2)}
              </span>
              <div className="w-full bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-[#9ed034] h-full w-3/4 rounded-full" />
              </div>
            </div>

            {/* Grocery Card */}
            <div className="bg-white rounded-xl p-2 border border-gray-200/80 shadow-2xs">
              <span className="text-[8px] font-bold uppercase text-gray-400 block">
                Tap to view
              </span>
              <span className="text-[11px] font-extrabold text-[#1a1a1a] leading-tight block truncate">
                Grocery list
              </span>
              <span className="text-[8.5px] text-gray-500 block mt-0.5 font-medium">
                0/18 items bought
              </span>
            </div>
          </div>

          {/* Recipe List */}
          <div className="space-y-1.5 mb-2">
            {recipes.slice(0, 4).map((recipe, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-1.5 border border-[#c4e377] flex items-center gap-2 shadow-2xs"
              >
                <div className="w-9 h-9 rounded-lg bg-[#f4f7ea] flex items-center justify-center text-lg shrink-0">
                  {recipe.emoji || '🥘'}
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-[10.5px] font-bold text-[#1a1a1a] truncate leading-tight">
                    {recipe.title}
                  </h5>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8.5px] text-[#6f9d13] font-semibold">
                      ⏱️ {recipe.cookTime || 25}m
                    </span>
                    <span className="text-[8px] text-gray-400">•</span>
                    <span className="text-[8.5px] text-gray-500">Dinner</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mini Bottom Tab Bar */}
          <div className="mt-auto pt-1.5 border-t border-gray-200/60 flex justify-around items-center text-[8px] font-semibold text-gray-400">
            <div className="flex flex-col items-center text-[#6f9d13]">
              <span className="text-xs">📋</span>
              <span className="font-bold">plan</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs">❤️</span>
              <span>favourites</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs">⚙️</span>
              <span>settings</span>
            </div>
          </div>

          {/* Home Bar Indicator */}
          <div className="w-20 h-1 bg-gray-300 rounded-full mx-auto mt-2" />
        </div>
      </div>
    </div>
  );
};
