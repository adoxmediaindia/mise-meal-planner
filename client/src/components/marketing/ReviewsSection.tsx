import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

export const ReviewsSection: React.FC = () => {
  const { t } = useLanguage();

  const reviews = [
    {
      title: t('reviewsSection.r1Title', 'ok this actually helped??'),
      body: t('reviewsSection.r1Body', 'didnt think i needed another app but grocery spend is definitely down. idk maybe $25–30? wife sends me the list now so im not just wandering aldi adding stuff'),
      user: t('reviewsSection.r1User', 'aldishopper_tx'),
      avatar: 'A',
    },
    {
      title: t('reviewsSection.r2Title', 'Normal food not chef food'),
      body: t('reviewsSection.r2Body', "Everything's doable after work which is basically my only requirement lol. no random ingredients my kids refuse to touch"),
      user: t('reviewsSection.r2User', 'mike.r1987'),
      avatar: 'M',
    },
    {
      title: t('reviewsSection.r3Title', 'the list is the best part'),
      body: t('reviewsSection.r3Body', 'pick walmart, get the plan, text the list to my husband. we kept buying the same stuff twice every week before this'),
      user: t('reviewsSection.r3User', 'k.martinez88'),
      avatar: 'K',
    },
    {
      title: t('reviewsSection.r4Title', 'cancelled hellofresh'),
      body: t('reviewsSection.r4Body', 'same general idea but without tiny portions and the crazy bill. does what i need it to do'),
      user: t('reviewsSection.r4User', 'tiredoftakeout'),
      avatar: 'T',
    },
    {
      title: t('reviewsSection.r5Title', 'husband cooks now somehow'),
      body: t('reviewsSection.r5Body', 'steps are clear enough that he stopped defaulting to doordash like twice a week. didnt see that coming'),
      user: t('reviewsSection.r5User', 'jen_mpls'),
      avatar: 'J',
    },
    {
      title: t('reviewsSection.r6Title', 'fast enough after work'),
      body: t('reviewsSection.r6Body', 'most stuff is ~30 mins. thats literally why i kept paying for it nothing fancy'),
      user: t('reviewsSection.r6User', 'weeknightdad92'),
      avatar: 'W',
    },
  ];

  return (
    <section className="section" id="reviews">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{t('reviewsSection.eyebrow', '★★★★★ Loved by home cooks')}</span>
          <h2>{t('reviewsSection.title', 'Real weeknights, sorted')}</h2>
          <p>{t('reviewsSection.sub', 'A few words from people who let mise plan their week.')}</p>
        </div>

        <div className="review-grid">
          {reviews.map((r, index) => (
            <div key={index} className="review">
              <div className="stars">★★★★★</div>
              <h4>{r.title}</h4>
              <p>“{r.body}”</p>
              <div className="who">
                <div className="avatar">{r.avatar}</div>
                <span>{r.user}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
