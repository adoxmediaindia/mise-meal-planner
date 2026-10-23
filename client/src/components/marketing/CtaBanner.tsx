import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';
import { StoreBadge } from '../common/StoreBadge.js';

export const CtaBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="section">
      <div className="container">
        <div className="cta">
          <span className="cta-blob a"></span>
          <span className="cta-blob b"></span>
          <div className="cta-inner">
            <h2>{t('cta.title', "Your week's dinners, sorted tonight")}</h2>
            <p>
              {t(
                'cta.sub',
                'Download mise and get a personalised plan and shopping list in about five minutes.'
              )}
            </p>
            <div className="store-badges">
              <StoreBadge platform="apple" />
              <StoreBadge platform="google" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
