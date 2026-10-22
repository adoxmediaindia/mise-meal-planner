import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

export const SupermarketMarquee: React.FC = () => {
  const { t, regional } = useLanguage();

  const stores = regional.marqueeStores || [
    'Walmart',
    'Aldi',
    'Kroger',
    'Costco',
    'Publix',
    'Safeway',
    'H-E-B',
    'Whole Foods',
    "Trader Joe's",
    'Food Lion',
    'Sprouts',
  ];

  // Double the list for seamless infinite looping
  const doubled = [...stores, ...stores];

  return (
    <section className="py-10 overflow-hidden" aria-label="Supported supermarkets">
      <div className="w-full max-w-[1120px] mx-auto px-5 text-center mb-4">
        <p className="text-sm sm:text-base font-semibold text-[#6b6b6b]">
          {t('marquee.heading', 'Built around the supermarkets you already shop at')}
        </p>
      </div>

      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex gap-10 sm:gap-14 w-max animate-marquee py-3">
          {doubled.map((store, index) => (
            <span
              key={`${store}-${index}`}
              className="font-serif text-xl sm:text-2xl font-semibold text-[#9a9a94] whitespace-nowrap select-none hover:text-[#2a2a2a] transition-colors"
            >
              {store}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
