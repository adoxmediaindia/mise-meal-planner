import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

export const ShowcaseB: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="section">
      <div className="container showcase showcase--reverse">
        <div className="showcase-media">
          <div className="phone">
            <img
              src="/assets/screens/en/recipe-detail.png"
              alt="A mise recipe with clear steps"
            />
          </div>
        </div>
        <div className="showcase-copy">
          <span className="eyebrow">{t('showcaseB.eyebrow', 'Recipes that get cooked')}</span>
          <h2>{t('showcaseB.title', 'Normal food, clear steps, no chef nonsense')}</h2>
          <p>
            {t(
              'showcaseB.body',
              'Every recipe is written for a real weeknight, with sensible ingredients, honest timings and steps anyone can follow.'
            )}
          </p>
          <ul className="tick-list">
            <li>{t('showcaseB.tick1', 'Realistic prep and cook times up front')}</li>
            <li>{t('showcaseB.tick2', 'Short, sensible ingredient lists you can buy anywhere')}</li>
            <li>{t('showcaseB.tick3', 'Clear steps with no assumed culinary knowledge')}</li>
            <li>{t('showcaseB.tick4', 'Scale servings up or down with automatic ingredient math')}</li>
          </ul>
        </div>
      </div>
    </section>
  );
};
