import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

export const ShowcaseA: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="section" style={{ background: '#fff' }}>
      <div className="container showcase">
        <div className="showcase-media">
          <div className="phone">
            <img
              src="/assets/screens/en/preferences-vibes.png"
              alt="Choosing meal vibes in mise"
            />
          </div>
        </div>
        <div className="showcase-copy">
          <span className="eyebrow">{t('showcaseA.eyebrow', 'Personalised')}</span>
          <h2>{t('showcaseA.title', 'A plan built around you, not a generic template')}</h2>
          <p>
            {t(
              'showcaseA.body',
              "mise learns your budget, the people you're feeding, your dietary needs and the vibes you fancy this week. Every plan is yours."
            )}
          </p>
          <ul className="tick-list">
            <li>{t('showcaseA.tick1', 'Budget-aware meals that hit your weekly spend')}</li>
            <li>{t('showcaseA.tick2', 'Diet and allergy safe for veggie, vegan, pescatarian, gluten-free and more')}</li>
            <li>{t('showcaseA.tick3', 'Cooks for your kitchen, from air fryer to hob-only and slow cooker')}</li>
            <li>{t('showcaseA.tick4', "Don't like a meal? Swap it in a tap")}</li>
          </ul>
        </div>
      </div>
    </section>
  );
};
