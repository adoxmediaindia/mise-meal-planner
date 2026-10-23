import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

export const StatsSection: React.FC = () => {
  const { t, regional } = useLanguage();

  return (
    <section className="section--tight">
      <div className="container">
        <div className="stats">
          <div className="stat">
            <div className="num">{t('stats.timeNum', '5 mins')}</div>
            <div className="label">{t('stats.timeLabel', "to a full week's plan")}</div>
          </div>

          <div className="stat">
            <div className="num">{t('stats.dinnersNum', 'Up to 7')}</div>
            <div className="label">{t('stats.dinnersLabel', 'dinners every week')}</div>
          </div>

          <div className="stat">
            <div className="num">{t('stats.listNum', '1')}</div>
            <div className="label">{t('stats.listLabel', 'smart shopping list')}</div>
          </div>

          <div className="stat">
            <div className="num" id="statSaving">
              {regional.statSaving || t('regional.statSaving', '$30+')}
            </div>
            <div className="label">{t('stats.savingLabel', 'typical weekly saving*')}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
