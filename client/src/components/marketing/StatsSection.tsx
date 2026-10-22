import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

export const StatsSection: React.FC = () => {
  const { t, regional } = useLanguage();

  return (
    <section className="py-10">
      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white rounded-[24px] p-6 sm:p-10 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/5">
          <div className="text-center">
            <div className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#8bc020] mb-1">
              {t('stats.timeNum', '5 mins')}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#6b6b6b]">
              {t('stats.timeLabel', "to a full week's plan")}
            </div>
          </div>

          <div className="text-center">
            <div className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#8bc020] mb-1">
              {t('stats.dinnersNum', 'Up to 7')}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#6b6b6b]">
              {t('stats.dinnersLabel', 'dinners every week')}
            </div>
          </div>

          <div className="text-center">
            <div className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#8bc020] mb-1">
              {t('stats.listNum', '1')}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#6b6b6b]">
              {t('stats.listLabel', 'smart shopping list')}
            </div>
          </div>

          <div className="text-center">
            <div className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#8bc020] mb-1">
              {regional.statSaving || t('regional.statSaving', '$30+')}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#6b6b6b]">
              {t('stats.savingLabel', 'typical weekly saving*')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
