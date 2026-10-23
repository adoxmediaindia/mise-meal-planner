import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';
import { StoreBadge } from '../common/StoreBadge.js';

export const Hero: React.FC = () => {
  const { t, regional } = useLanguage();

  return (
    <section className="hero">
      <span className="blob blob--green"></span>
      <span className="blob blob--yellow"></span>
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">{t('hero.eyebrow', '🥗 Welcome to mise')}</span>
          <h1>
            <span>{t('hero.titleLead', 'Eat well,')}</span>
            <br />
            <span className="accent">{t('hero.titleAccent', 'stress less.')}</span>
          </h1>
          <p className="hero-sub">
            {t(
              'hero.sub',
              "mise is a meal planner for weekly meal planning and meal prep. Plan dinners around your budget, your cravings, and what's already in your kitchen. Build your week and one smart shopping list in about five minutes."
            )}
          </p>

          <div className="hero-actions">
            <div className="store-badges" id="download">
              <StoreBadge platform="apple" />
              <StoreBadge platform="google" />
            </div>

            <div className="hero-trust">
              <span className="stars">★★★★★</span>
              <span id="heroTrustCopy">
                {regional.heroTrust || t('regional.heroTrust', 'Loved by busy home cooks across the US & beyond')}
              </span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="phone phone--behind-left">
            <img
              src="/assets/screens/en/preferences-vibes.png"
              alt="Choosing meal vibes in mise"
            />
          </div>
          <div className="phone phone--main phone--floating">
            <img
              src="/assets/screens/en/plan-overview.png"
              alt="mise weekly meal plan overview"
            />
          </div>
          <div className="phone phone--behind-right">
            <img
              src="/assets/screens/en/explore-by-cuisine.png"
              alt="Explore recipes by cuisine"
            />
          </div>
          <div className="chip chip--tl">
            <span className="chip-emoji">🛒</span>
            <span>{t('hero.chipList', 'One shopping list')}</span>
          </div>
          <div className="chip chip--br">
            <span className="chip-emoji" id="chipBudgetEmoji">
              {regional.chipBudgetEmoji || '💵'}
            </span>
            <span>{t('hero.chipBudget', 'Under budget')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
