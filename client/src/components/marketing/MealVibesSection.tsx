import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

export const MealVibesSection: React.FC = () => {
  const { t } = useLanguage();

  const vibes = [
    { emoji: '⚡', label: t('vibesSection.quickEasy', 'Speedy Meals'), bg: '#E0D4FF' },
    { emoji: '⚖️', label: t('vibesSection.lowCalorie', 'Low Calorie'), bg: '#7DD3FC' },
    { emoji: '👨‍👩‍👧', label: t('vibesSection.familyFavourites', 'Family Favs'), bg: '#FFE0BC' },
    { emoji: '🥗', label: t('vibesSection.healthyComfort', 'Healthy Comfort'), bg: '#9BD88F' },
    { emoji: '🍔', label: t('vibesSection.fakeaway', 'Fakeaway'), bg: '#FF9F68' },
    { emoji: '💚', label: t('vibesSection.gutFriendly', 'Gut Friendly'), bg: '#5EEAD4' },
    { emoji: '💪', label: t('vibesSection.highProtein', 'Protein Packed'), bg: '#FFA8BC' },
    { emoji: '🇬🇧', label: t('vibesSection.britishClassics', 'British Staples'), bg: '#A8B8E8' },
  ];

  return (
    <section className="py-16 sm:py-24" id="vibes">
      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="max-w-[640px] mx-auto text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center font-sans font-bold text-xs uppercase tracking-wider text-[#8bc020] bg-[#9ed034]/15 px-3.5 py-1.5 rounded-full mb-4">
            {t('vibesSection.eyebrow', 'Meal vibes')}
          </span>
          <h2 className="font-serif font-semibold text-[32px] sm:text-[44px] text-[#2a2a2a] leading-tight mb-4">
            {t('vibesSection.title', 'Tell mise the mood, get the meals')}
          </h2>
          <p className="text-base sm:text-lg text-[#6b6b6b]">
            {t(
              'vibesSection.sub',
              'Pick a few vibes and your plan leans into exactly what you fancy this week.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {vibes.map((vibe, index) => (
            <div
              key={index}
              className="rounded-[24px] p-6 min-h-[130px] flex flex-col items-center justify-center gap-2.5 text-center transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-1 hover:-rotate-1 hover:shadow-md select-none"
              style={{ backgroundColor: vibe.bg }}
            >
              <span className="text-3xl sm:text-4xl">{vibe.emoji}</span>
              <span className="font-serif font-semibold text-lg sm:text-xl text-[#1f2a06]">
                {vibe.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
