import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

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
    <section className="section" style={{ background: '#fff' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{t('gallery.eyebrow', 'Take a look')}</span>
          <h2>{t('gallery.title', 'Beautifully simple, start to finish')}</h2>
          <p>{t('gallery.sub', 'Swipe through the app.')}</p>
        </div>
      </div>

      <div className="gallery">
        {screens.map((screen, index) => (
          <div key={index} className="phone">
            <img src={screen.src} alt={screen.alt} loading="eager" />
          </div>
        ))}
      </div>
    </section>
  );
};
