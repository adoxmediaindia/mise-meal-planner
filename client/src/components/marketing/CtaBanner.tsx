import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';
import { StoreBadge } from '../common/StoreBadge.js';

export const CtaBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-20">
      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#9ed034] to-[#8bc020] rounded-[36px] px-6 sm:px-12 py-16 sm:py-20 text-center text-[#1c2705] shadow-[0_16px_40px_rgba(158,208,52,0.35)]">
          {/* Decorative blurry white blobs */}
          <div className="absolute top-[-100px] left-[-60px] w-72 h-72 rounded-full bg-white/20 blur-md pointer-events-none" />
          <div className="absolute bottom-[-120px] right-[-50px] w-80 h-80 rounded-full bg-white/20 blur-md pointer-events-none" />

          <div className="relative z-10 max-w-[620px] mx-auto">
            <h2 className="font-serif font-semibold text-[32px] sm:text-[48px] leading-tight mb-4 text-[#1c2705]">
              {t('cta.title', "Your week's dinners, sorted tonight")}
            </h2>
            <p className="text-base sm:text-xl text-[#2c3a0c] mb-8 leading-relaxed">
              {t(
                'cta.sub',
                'Download mise and get a personalised plan and shopping list in about five minutes.'
              )}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <StoreBadge platform="apple" />
              <StoreBadge platform="google" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
