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
    <section className="py-16 sm:py-24 bg-white" id="features">
      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="max-w-[640px] mx-auto text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center font-sans font-bold text-xs uppercase tracking-wider text-[#8bc020] bg-[#9ed034]/15 px-3.5 py-1.5 rounded-full mb-4">
            {t('features.eyebrow', 'Features')}
          </span>
          <h2 className="font-serif font-semibold text-[32px] sm:text-[44px] text-[#2a2a2a] leading-tight mb-4">
            {t('features.title', 'Everything you need to eat well this week')}
          </h2>
          <p className="text-base sm:text-lg text-[#6b6b6b]">
            {t('features.sub', 'The planning brain of a meal-kit service, without the tiny portions and the big bill.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {features.map((item, index) => (
            <div
              key={index}
              className="bg-[#fafaf8] rounded-[24px] p-8 text-center border border-[#2a2a2a]/5 hover:shadow-[0_12px_32px_rgba(42,42,42,0.1)] hover:-translate-y-1 transition-all"
            >
              <div
                className="w-14 h-14 rounded-[18px] flex items-center justify-center text-3xl mx-auto mb-4.5 shadow-sm"
                style={{ backgroundColor: item.bg }}
              >
                {item.icon}
              </div>
              <h3 className="font-serif font-semibold text-xl text-[#2a2a2a] mb-2.5">
                {item.title}
              </h3>
              <p className="text-sm sm:text-[15px] text-[#6b6b6b] leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
