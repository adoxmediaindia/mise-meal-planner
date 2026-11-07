import React, { useState, useRef, useEffect } from 'react';

export const WelcomeCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && activeIndex < 2) {
      setActiveIndex((prev) => prev + 1);
    } else if (diff < -50 && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div className="w-full flex flex-col items-center select-none py-2">
      {/* 3-Phone Mockup Showcase with Side Previews */}
      <div
        className="relative w-full flex items-center justify-center overflow-hidden py-3 h-[420px] sm:h-[460px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Side Preview (peeking) */}
        <div
          onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
          className="absolute -left-20 sm:-left-16 w-[180px] sm:w-[210px] h-[370px] sm:h-[400px] bg-[#1a1a1a] rounded-[36px] p-2.5 opacity-60 scale-95 shadow-md hidden sm:block cursor-pointer transition-all hover:opacity-80"
          aria-hidden="true"
        >
          <div className="w-full h-full bg-[#fbfbfa] rounded-[28px] p-2.5 flex flex-col justify-between overflow-hidden text-[10px]">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2" />
            <div className="space-y-1.5 opacity-70">
              <div className="h-10 bg-gray-200 rounded-lg" />
              <div className="h-10 bg-gray-200 rounded-lg" />
              <div className="h-10 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Central Phone Mockup */}
        <div className="relative w-[260px] sm:w-[290px] h-[400px] sm:h-[445px] bg-[#1a1a1a] rounded-[38px] p-2.5 shadow-[0_20px_45px_rgba(0,0,0,0.18)] z-10 flex flex-col">
          {/* Inner Screen */}
          <div className="w-full h-full bg-[#FAF9F5] rounded-[30px] overflow-hidden flex flex-col justify-between text-[#2a2a2a]">
            {/* Top Phone Speaker Bar */}
            <div className="pt-2 px-4 flex justify-center items-center">
              <div className="w-14 h-3 bg-[#1a1a1a] rounded-full" />
            </div>

            {/* Slide Content */}
            <div className="px-3 pt-1 flex-1 overflow-hidden">
              {activeIndex === 0 && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="text-center font-bold text-sm tracking-tight text-[#1a1a1a] mt-1">
                    Chef!
                  </div>

                  {/* Summary row */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-white rounded-xl p-2 border border-gray-100 shadow-xs">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-[#8c8c88]">
                        Est. Cost
                      </div>
                      <div className="text-xs font-bold text-[#1a1a1a]">
                        29.90 <span className="text-[#8c8c88] font-normal">/ 40</span>
                      </div>
                      <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div className="w-3/4 h-full bg-[#9ed034]" />
                      </div>
                    </div>

                    <div className="bg-[#ddf4ff] rounded-xl p-2 border border-sky-100 shadow-xs">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-sky-700">
                        Tap to View
                      </div>
                      <div className="text-[10px] font-bold text-sky-900 leading-tight">
                        Grocery list
                      </div>
                      <div className="text-[8px] text-sky-700">0/34 items bought</div>
                    </div>
                  </div>

                  {/* Days */}
                  <div className="space-y-1.5 pt-0.5">
                    {/* Monday */}
                    <div className="bg-white rounded-xl p-2 border border-gray-100 shadow-xs flex items-center gap-2">
                      <span className="text-xl">🍝</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-bold uppercase text-[#8c8c88] tracking-wider">
                          Monday
                        </span>
                        <div className="text-[11px] font-bold text-[#1a1a1a] truncate leading-tight">
                          Spaghetti Bolognese
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] text-[#8c8c88] mt-0.5">
                          <span className="bg-orange-100 text-orange-700 font-semibold px-1 rounded">Family Favs</span>
                          <span>⏱ 45m</span>
                          <span>👤 2</span>
                        </div>
                      </div>
                    </div>

                    {/* Tuesday */}
                    <div className="bg-white rounded-xl p-2 border border-gray-100 shadow-xs flex items-center gap-2">
                      <span className="text-xl">🍜</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-bold uppercase text-[#8c8c88] tracking-wider">
                          Tuesday
                        </span>
                        <div className="text-[11px] font-bold text-[#1a1a1a] truncate leading-tight">
                          Crispy Pork Noodles
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] text-[#8c8c88] mt-0.5">
                          <span className="bg-purple-100 text-purple-700 font-semibold px-1 rounded">Speedy Meals</span>
                          <span>⏱ 30m</span>
                          <span>👤 2</span>
                        </div>
                      </div>
                    </div>

                    {/* Wednesday */}
                    <div className="bg-white rounded-xl p-2 border border-gray-100 shadow-xs flex items-center gap-2">
                      <span className="text-xl">🍣</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-bold uppercase text-[#8c8c88] tracking-wider">
                          Wednesday
                        </span>
                        <div className="text-[11px] font-bold text-[#1a1a1a] truncate leading-tight">
                          Teriyaki Salmon
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] text-[#8c8c88] mt-0.5">
                          <span className="bg-purple-100 text-purple-700 font-semibold px-1 rounded">Speedy Meals</span>
                          <span>⏱ 35m</span>
                          <span>👤 2</span>
                        </div>
                      </div>
                    </div>

                    {/* Thursday */}
                    <div className="bg-white rounded-xl p-2 border border-gray-100 shadow-xs flex items-center gap-2">
                      <span className="text-xl">🥘</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-bold uppercase text-[#8c8c88] tracking-wider">
                          Thursday
                        </span>
                        <div className="text-[11px] font-bold text-[#1a1a1a] truncate leading-tight">
                          Butter Bean Carbonara
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] text-[#8c8c88] mt-0.5">
                          <span className="bg-pink-100 text-pink-700 font-semibold px-1 rounded">Protein Packed</span>
                          <span>⏱ 35m</span>
                          <span>👤 2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeIndex === 1 && (
                <div className="space-y-2 animate-fadeIn pt-1">
                  <div className="text-center font-bold text-sm tracking-tight text-[#1a1a1a]">
                    Recipe Details
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs space-y-2">
                    <div className="h-20 bg-amber-50 rounded-xl flex items-center justify-center text-4xl">
                      🍜
                    </div>
                    <div className="font-bold text-xs text-[#1a1a1a]">Crispy Pork Noodles</div>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div className="bg-gray-50 rounded p-1">
                        <div className="text-[9px] font-bold text-[#1a1a1a]">770</div>
                        <div className="text-[7px] text-gray-500">kcal</div>
                      </div>
                      <div className="bg-gray-50 rounded p-1">
                        <div className="text-[9px] font-bold text-[#1a1a1a]">65g</div>
                        <div className="text-[7px] text-gray-500">Carbs</div>
                      </div>
                      <div className="bg-gray-50 rounded p-1">
                        <div className="text-[9px] font-bold text-[#1a1a1a]">42g</div>
                        <div className="text-[7px] text-gray-500">Protein</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-[10px] space-y-1">
                    <div className="font-bold text-[#1a1a1a]">Ingredients</div>
                    <div className="text-gray-600 text-[9px] flex justify-between">
                      <span>• Minced Pork</span>
                      <span>250g</span>
                    </div>
                    <div className="text-gray-600 text-[9px] flex justify-between">
                      <span>• Egg Noodles</span>
                      <span>200g</span>
                    </div>
                    <div className="text-gray-600 text-[9px] flex justify-between">
                      <span>• Soy Sauce & Garlic</span>
                      <span>2 tbsp</span>
                    </div>
                  </div>
                </div>
              )}

              {activeIndex === 2 && (
                <div className="space-y-2 animate-fadeIn pt-1">
                  <div className="text-center font-bold text-sm tracking-tight text-[#1a1a1a]">
                    Smart Grocery List
                  </div>
                  <div className="bg-[#ddf4ff] rounded-xl p-2 text-[10px] flex justify-between items-center text-sky-900">
                    <span className="font-bold">Aldi Aisles</span>
                    <span className="font-bold text-[#0d5c3a]">$29.90 (Saved $14)</span>
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="bg-white rounded-xl p-2 border border-gray-100 shadow-xs space-y-1">
                      <div className="font-bold text-[9px] text-[#8c8c88] uppercase">Produce</div>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <span className="w-3.5 h-3.5 rounded border border-[#9ed034] bg-[#9ed034]/20 flex items-center justify-center text-[8px] text-[#0d5c3a]">✓</span>
                        <span>Broccoli florets (300g)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <span className="w-3.5 h-3.5 rounded border border-gray-300" />
                        <span>Spring onions (1 bunch)</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-2 border border-gray-100 shadow-xs space-y-1">
                      <div className="font-bold text-[9px] text-[#8c8c88] uppercase">Meat &amp; Seafood</div>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <span className="w-3.5 h-3.5 rounded border border-gray-300" />
                        <span>Lean Minced Pork (500g)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom App Navigation Mockup Bar */}
            <div className="bg-white border-t border-gray-100 py-1.5 px-3 flex justify-around items-center text-[11px] text-gray-400">
              <span className="text-[#0d5c3a] font-bold">📋</span>
              <span>🍽️</span>
              <span>⚙️</span>
              <span>👤</span>
            </div>
          </div>
        </div>

        {/* Right Side Preview (peeking) */}
        <div
          onClick={() => setActiveIndex((prev) => Math.min(2, prev + 1))}
          className="absolute -right-20 sm:-right-16 w-[180px] sm:w-[210px] h-[370px] sm:h-[400px] bg-[#1a1a1a] rounded-[36px] p-2.5 opacity-60 scale-95 shadow-md hidden sm:block cursor-pointer transition-all hover:opacity-80"
          aria-hidden="true"
        >
          <div className="w-full h-full bg-[#fbfbfa] rounded-[28px] p-2.5 flex flex-col justify-between overflow-hidden text-[10px]">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2" />
            <div className="space-y-1.5 opacity-70">
              <div className="h-10 bg-gray-200 rounded-lg" />
              <div className="h-10 bg-gray-200 rounded-lg" />
              <div className="h-10 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Carousel Pagination Dots */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {[0, 1, 2].map((idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
              idx === activeIndex
                ? 'bg-[#2a2a2a] w-3 h-3'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
