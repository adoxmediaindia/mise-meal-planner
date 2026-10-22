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
    <section className="py-16 sm:py-24" id="reviews">
      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="max-w-[640px] mx-auto text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center font-sans font-bold text-xs uppercase tracking-wider text-[#8bc020] bg-[#9ed034]/15 px-3.5 py-1.5 rounded-full mb-4">
            {t('reviewsSection.eyebrow', '★★★★★ Loved by home cooks')}
          </span>
          <h2 className="font-serif font-semibold text-[32px] sm:text-[44px] text-[#2a2a2a] leading-tight mb-4">
            {t('reviewsSection.title', 'Real weeknights, sorted')}
          </h2>
          <p className="text-base sm:text-lg text-[#6b6b6b]">
            {t('reviewsSection.sub', 'A few words from people who let mise plan their week.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r, index) => (
            <div
              key={index}
              className="bg-white rounded-[24px] p-7 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/5 flex flex-col justify-between hover:shadow-[0_12px_32px_rgba(42,42,42,0.1)] transition-all"
            >
              <div>
                <div className="text-[#f4b740] tracking-widest text-sm mb-3">★★★★★</div>
                <h4 className="font-serif font-semibold text-lg sm:text-xl text-[#2a2a2a] mb-2.5">
                  {r.title}
                </h4>
                <p className="text-sm sm:text-[15px] text-[#6b6b6b] leading-relaxed mb-6 italic">
                  “{r.body}”
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#9ed034] text-[#1f2a06] font-bold text-xs flex items-center justify-center">
                  {r.avatar}
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#2a2a2a]">{r.user}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
