import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { IRecipe, Cuisine, MealVibe } from '../../types/index.js';
import { Search, Clock, Flame, Plus } from 'lucide-react';

export const Explore: React.FC = () => {
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | 'All'>('All');
  const [selectedVibe, setSelectedVibe] = useState<MealVibe | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const cuisines: { name: Cuisine; subtitle: string; image: string }[] = [
    {
      name: 'Italian',
      subtitle: 'Pasta • Risotto • Gnocchi',
      image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Asian',
      subtitle: 'Noodles • Curry • Stir-fry',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Mexican',
      subtitle: 'Tacos • Burritos • Fajitas',
      image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Indian',
      subtitle: 'Curry • Tikka • Tandoori',
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Mediterranean',
      subtitle: 'Gyros • Halloumi • Falafel',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'British',
      subtitle: 'Pies • Roasts • Comforts',
      image: 'https://images.unsplash.com/photo-1584947897537-8e6840902c52?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const vibes: MealVibe[] = [
    'Speedy Meals',
    'Low Calorie',
    'Family Favs',
    'Healthy Comfort',
    'Fakeaway',
    'Gut Friendly',
    'Protein Packed',
    'British Staples',
  ];

  useEffect(() => {
    setIsLoading(true);
    const params: Record<string, string> = {};
    if (selectedCuisine !== 'All') params.cuisine = selectedCuisine;
    if (selectedVibe !== 'All') params.vibe = selectedVibe;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    api
      .getRecipes(params)
      .then((res) => {
        setRecipes(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedCuisine, selectedVibe, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Title */}
      <div>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#2a2a2a]">
          Explore by cuisine
        </h1>
        <p className="text-xs sm:text-sm text-[#6b6b6b] mt-0.5">
          Browse recipes from around the world and pull favorites into your plan.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by recipe, cuisine, ingredient..."
          className="w-full bg-white pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#8bc020] shadow-xs"
        />
      </div>

      {/* Cuisine Cards matching explore-by-cuisine.png */}
      <div className="grid grid-cols-2 gap-3.5">
        {cuisines.map((c) => {
          const isSelected = selectedCuisine === c.name;
          return (
            <div
              key={c.name}
              onClick={() => setSelectedCuisine(isSelected ? 'All' : c.name)}
              className={`bg-white rounded-[24px] overflow-hidden shadow-[0_4px_16px_rgba(42,42,42,0.06)] border transition-all cursor-pointer select-none group ${
                isSelected
                  ? 'border-[#9ed034] ring-2 ring-[#9ed034]'
                  : 'border-[#2a2a2a]/6 hover:shadow-md'
              }`}
            >
              <div className="w-full h-28 overflow-hidden bg-gray-100">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3.5">
                <h3 className="font-sans font-black text-base text-[#2a2a2a] leading-tight">
                  {c.name}
                </h3>
                <p className="text-[11px] font-semibold text-[#888] truncate mt-0.5">
                  {c.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vibe filter pills */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">
          Filter by vibe
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setSelectedVibe('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedVibe === 'All'
                ? 'bg-[#9ed034] text-[#1f2a06]'
                : 'bg-white border border-gray-200 text-[#6b6b6b]'
            }`}
          >
            All Vibes
          </button>
          {vibes.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSelectedVibe(selectedVibe === v ? 'All' : v)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedVibe === v
                  ? 'bg-[#9ed034] text-[#1f2a06]'
                  : 'bg-white border border-gray-200 text-[#6b6b6b]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Grid Results */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">
            Recipes ({recipes.length})
          </span>
          {(selectedCuisine !== 'All' || selectedVibe !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSelectedCuisine('All');
                setSelectedVibe('All');
              }}
              className="text-xs font-bold text-[#8bc020] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-[#6b6b6b]">Loading recipes...</div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {recipes.map((r) => (
              <Link
                key={r._id}
                to={`/app/recipes/${r._id}`}
                className="bg-white rounded-[22px] p-3 border border-gray-100 shadow-[0_4px_16px_rgba(42,42,42,0.05)] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="relative w-full h-32 rounded-[16px] overflow-hidden bg-gray-100 mb-2.5">
                  <img
                    src={r.image}
                    alt={r.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {r.vibes?.[0] && (
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#2a2a2a] backdrop-blur-xs">
                      {r.vibes[0]}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-sans font-bold text-sm text-[#2a2a2a] truncate group-hover:text-[#8bc020] transition-colors">
                    {r.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-[#888] mt-1.5 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{r.cookTimeMinutes}m</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{r.calories} kcal</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-[#6b6b6b] border border-gray-200">
            No recipes found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
