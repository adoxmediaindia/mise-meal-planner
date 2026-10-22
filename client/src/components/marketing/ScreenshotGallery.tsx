import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';
import { PhoneMockup } from '../common/PhoneMockup.js';

export const ScreenshotGallery: React.FC = () => {
  const { t } = useLanguage();

  const screens = [
    { src: '/assets/screens/en/plan-overview.png', alt: 'Weekly plan overview' },
    { src: '/assets/screens/en/preferences-vibes.png', alt: 'Meal vibe picker' },
    { src: '/assets/screens/en/explore-by-cuisine.png', alt: 'Explore by cuisine' },
    { src: '/assets/screens/en/recipe-detail.png', alt: 'Recipe detail' },
    { src: '/assets/screens/en/preferences-setup.png', alt: 'Setting up preferences in mise' },
    { src: '/assets/screens/en/spaghetti-bolognese-recipe-detail.png', alt: 'Spaghetti bolognese recipe' },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="max-w-[640px] mx-auto text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center font-sans font-bold text-xs uppercase tracking-wider text-[#8bc020] bg-[#9ed034]/15 px-3.5 py-1.5 rounded-full mb-4">
            {t('gallery.eyebrow', 'Take a look')}
          </span>
          <h2 className="font-serif font-semibold text-[32px] sm:text-[44px] text-[#2a2a2a] leading-tight mb-4">
            {t('gallery.title', 'Beautifully simple, start to finish')}
          </h2>
          <p className="text-base sm:text-lg text-[#6b6b6b]">
            {t('gallery.sub', 'Swipe through the app.')}
          </p>
        </div>
      </div>

      {/* Snap Scroll Gallery */}
      <div className="flex gap-6 overflow-x-auto px-6 py-4 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
        <div className="flex-shrink-0 w-2" />
        {screens.map((screen, index) => (
          <div key={index} className="flex-shrink-0 w-[240px] sm:w-[270px] snap-center">
            <PhoneMockup src={screen.src} alt={screen.alt} />
          </div>
        ))}
        <div className="flex-shrink-0 w-2" />
      </div>
    </section>
  );
};
