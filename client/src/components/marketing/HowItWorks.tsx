import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

export const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      num: 1,
      title: t('how.step1Title', 'Pick your shop'),
      body: t('how.step1Body', 'Walmart, Aldi, Kroger and dozens more. Prices and lists are tuned to where you actually shop.'),
    },
    {
      num: 2,
      title: t('how.step2Title', 'Set your preferences'),
      body: t('how.step2Body', "Budget, dietary needs, allergies, kitchen kit and the meal vibes you're into."),
    },
    {
      num: 3,
      title: t('how.step3Title', 'Get your plan'),
      body: t('how.step3Body', 'Up to seven dinners for the week with clear recipes and clever ingredient overlap.'),
    },
    {
      num: 4,
      title: t('how.step4Title', 'Shop once'),
      body: t('how.step4Body', 'One consolidated list, grouped how you shop, so nothing gets doubled up or forgotten.'),
    },
  ];

  return (
    <section className="py-16 sm:py-24" id="how">
      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="max-w-[640px] mx-auto text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center font-sans font-bold text-xs uppercase tracking-wider text-[#8bc020] bg-[#9ed034]/15 px-3.5 py-1.5 rounded-full mb-4">
            {t('how.eyebrow', 'How it works')}
          </span>
          <h2 className="font-serif font-semibold text-[32px] sm:text-[44px] text-[#2a2a2a] leading-tight mb-4">
            {t('how.title', 'Dinner sorted in seconds')}
          </h2>
          <p className="text-base sm:text-lg text-[#6b6b6b]">
            {t(
              'how.sub',
              'No spreadsheets, no scrolling recipe blogs. Just tell mise a little about you and it does the planning.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-white rounded-[24px] p-7 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/5 hover:shadow-[0_12px_32px_rgba(42,42,42,0.1)] hover:-translate-y-1 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-[#9ed034] text-[#1f2a06] font-extrabold flex items-center justify-center text-lg mb-5 shadow-sm">
                {step.num}
              </div>
              <h3 className="font-serif font-semibold text-xl text-[#2a2a2a] mb-2.5">
                {step.title}
              </h3>
              <p className="text-sm sm:text-[15px] text-[#6b6b6b] leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
