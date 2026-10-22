import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';
import { PhoneMockup } from '../common/PhoneMockup.js';

export const ShowcaseB: React.FC = () => {
  const { t } = useLanguage();

  const ticks = [
    t('showcaseB.tick1', 'Realistic prep and cook times up front'),
    t('showcaseB.tick2', 'Ingredients reused across the week to cut waste'),
    t('showcaseB.tick3', 'Explore by cuisine when you want to mix it up'),
    t('showcaseB.tick4', 'Scales to the size of your household'),
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy & Ticks on Left (Desktop) */}
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center font-sans font-bold text-xs uppercase tracking-wider text-[#8bc020] bg-[#9ed034]/15 px-3.5 py-1.5 rounded-full mb-4">
              {t('showcaseB.eyebrow', 'Recipes that get cooked')}
            </span>
            <h2 className="font-serif font-semibold text-[30px] sm:text-[42px] text-[#2a2a2a] leading-tight mb-4">
              {t('showcaseB.title', 'Normal food, clear steps, no chef nonsense')}
            </h2>
            <p className="text-base sm:text-lg text-[#6b6b6b] leading-relaxed mb-6">
              {t(
                'showcaseB.body',
                'Every recipe is written for a real weeknight, with sensible ingredients, honest timings and steps anyone can follow.'
              )}
            </p>

            <ul className="space-y-3.5">
              {ticks.map((tick, index) => (
                <li key={index} className="flex items-start gap-3.5 text-[15px] sm:text-base font-medium text-[#2a2a2a]">
                  <span className="w-6 h-6 rounded-full bg-[#9ed034]/20 text-[#8bc020] font-bold flex items-center justify-center flex-shrink-0 text-sm mt-0.5">
                    ✓
                  </span>
                  <span>{tick}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Phone Media on Right */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="w-[270px] sm:w-[300px]">
              <PhoneMockup
                src="/assets/screens/en/recipe-detail.png"
                alt="A mise recipe with clear steps"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
