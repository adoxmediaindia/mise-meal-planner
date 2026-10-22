import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';
import { PhoneMockup } from '../common/PhoneMockup.js';

export const ShowcaseA: React.FC = () => {
  const { t } = useLanguage();

  const ticks = [
    t('showcaseA.tick1', 'Budget-aware meals that hit your weekly spend'),
    t('showcaseA.tick2', 'Diet and allergy safe for veggie, vegan, pescatarian, gluten-free and more'),
    t('showcaseA.tick3', 'Cooks for your kitchen, from air fryer to hob-only and slow cooker'),
    t('showcaseA.tick4', "Don't like a meal? Swap it in a tap"),
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Phone Media */}
          <div className="flex justify-center">
            <div className="w-[270px] sm:w-[300px]">
              <PhoneMockup
                src="/assets/screens/en/preferences-vibes.png"
                alt="Choosing meal vibes in mise"
              />
            </div>
          </div>

          {/* Copy & Ticks */}
          <div>
            <span className="inline-flex items-center font-sans font-bold text-xs uppercase tracking-wider text-[#8bc020] bg-[#9ed034]/15 px-3.5 py-1.5 rounded-full mb-4">
              {t('showcaseA.eyebrow', 'Personalised')}
            </span>
            <h2 className="font-serif font-semibold text-[30px] sm:text-[42px] text-[#2a2a2a] leading-tight mb-4">
              {t('showcaseA.title', 'A plan built around you, not a generic template')}
            </h2>
            <p className="text-base sm:text-lg text-[#6b6b6b] leading-relaxed mb-6">
              {t(
                'showcaseA.body',
                "mise learns your budget, the people you're feeding, your dietary needs and the vibes you fancy this week. Every plan is yours."
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
        </div>
      </div>
    </section>
  );
};
