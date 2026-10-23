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
    <section className="section" id="how">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{t('how.eyebrow', 'How it works')}</span>
          <h2>{t('how.title', 'Dinner sorted in seconds')}</h2>
          <p>
            {t(
              'how.sub',
              'No spreadsheets, no scrolling recipe blogs. Just tell mise a little about you and it does the planning.'
            )}
          </p>
        </div>

        <div className="steps">
          {steps.map((step) => (
            <div key={step.num} className="step">
              <div className="step-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
