import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

export const FeaturesGrid: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: '🗓️',
      bg: '#E0D4FF',
      title: t('features.f1Title', 'Weekly meal plans'),
      body: t('features.f1Body', 'Up to seven dinners generated for you every week, ready to cook and easy to tweak.'),
    },
    {
      icon: '🛒',
      bg: '#DDF4FF',
      title: t('features.f2Title', 'One smart list'),
      body: t('features.f2Body', 'All your ingredients combined into a single list, grouped for your supermarket.'),
    },
    {
      icon: '💷',
      bg: '#FFE0BC',
      title: t('features.f3Title', 'Budget-aware'),
      body: t('features.f3Body', 'Set your weekly spend and mise plans meals that keep you inside it.'),
    },
    {
      icon: '🥗',
      bg: '#9BD88F',
      title: t('features.f4Title', 'Diet and allergy filters'),
      body: t('features.f4Body', 'Veggie, vegan, pescatarian, gluten-free and allergen avoidance baked in.'),
    },
    {
      icon: '🔄',
      bg: '#FFA8BC',
      title: t('features.f5Title', 'Swap and regenerate'),
      body: t('features.f5Body', 'Not feeling a meal? Swap it, or regenerate the whole week in a tap.'),
    },
    {
      icon: '🍳',
      bg: '#5EEAD4',
      title: t('features.f6Title', 'Cooks for your kitchen'),
      body: t('features.f6Body', 'Tell mise your equipment and recipes adapt, from air fryer to hob-only and more.'),
    },
    {
      icon: '🌍',
      bg: '#A8B8E8',
      title: t('features.f7Title', 'Explore by cuisine'),
      body: t('features.f7Body', 'Browse a world of recipes and pull favourites straight into your plan.'),
    },
    {
      icon: '♻️',
      bg: '#7DD3FC',
      title: t('features.f8Title', 'Less food waste'),
      body: t('features.f8Body', 'Ingredients are reused across meals where it makes sense, so less ends up in the bin.'),
    },
    {
      icon: '👨‍👩‍👧',
      bg: '#FFD966',
      title: t('features.f9Title', 'Made for households'),
      body: t('features.f9Body', 'Plan for the number of people you feed and share the load with family.'),
    },
  ];

  return (
    <section className="section" id="features" style={{ background: '#fff' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{t('features.eyebrow', 'Features')}</span>
          <h2>{t('features.title', 'Everything you need to eat well this week')}</h2>
          <p>
            {t('features.sub', 'The planning brain of a meal-kit service, without the tiny portions and the big bill.')}
          </p>
        </div>

        <div className="feature-grid">
          {features.map((item, index) => (
            <div key={index} className="feature">
              <div className="icon" style={{ background: item.bg }}>
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
