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
    <section className="section--tight" aria-label="Supported supermarkets">
      <div className="container">
        <p
          style={{
            textAlign: 'center',
            color: 'var(--muted)',
            fontWeight: 600,
            marginBottom: '6px',
            fontSize: '15px',
          }}
        >
          {t('marquee.heading', 'Built around the supermarkets you already shop at')}
        </p>
      </div>

      <div className="marquee">
        <div className="marquee-track" id="marqueeTrack">
          {doubled.map((store, index) => (
            <span key={`${store}-${index}`}>{store}</span>
          ))}
        </div>
      </div>
    </section>
  );
};
