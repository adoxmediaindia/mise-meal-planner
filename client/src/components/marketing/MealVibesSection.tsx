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
    <section className="section" id="vibes">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{t('vibesSection.eyebrow', 'Meal vibes')}</span>
          <h2>{t('vibesSection.title', 'Tell mise the mood, get the meals')}</h2>
          <p>
            {t(
              'vibesSection.sub',
              'Pick a few vibes and your plan leans into exactly what you fancy this week.'
            )}
          </p>
        </div>

        <div className="vibe-grid">
          {vibes.map((vibe, index) => (
            <div
              key={index}
              className="vibe"
              style={{ backgroundColor: vibe.bg }}
            >
              <span className="vibe-emoji">{vibe.emoji}</span>
              <span>{vibe.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
