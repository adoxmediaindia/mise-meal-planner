import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.js';
import { StoreBadge } from '../common/StoreBadge.js';
import { PhoneMockup } from '../common/PhoneMockup.js';
import { ArrowRight } from 'lucide-react';

export const Hero: React.FC = () => {
  const { t, regional } = useLanguage();

  return (
    <section className="relative pt-8 pb-12 sm:pt-14 sm:pb-16 overflow-hidden">
      {/* Decorative blurred background blobs */}
      <div className="absolute top-[-140px] right-[-100px] w-[380px] sm:w-[480px] h-[380px] sm:h-[480px] rounded-full bg-[#9ed034]/25 blur-[60px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-100px] left-[-80px] w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full bg-[#ffe678]/35 blur-[70px] pointer-events-none -z-10" />

      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          {/* Hero Copy Left */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 font-sans font-bold text-xs uppercase tracking-wider text-[#8bc020] bg-[#9ed034]/15 px-3.5 py-1.5 rounded-full mb-5">
              <span>{t('hero.eyebrow', '🥗 Welcome to mise')}</span>
            </div>

            <h1 className="font-serif font-semibold text-[38px] sm:text-[56px] lg:text-[72px] leading-[1.06] tracking-[-0.02em] text-[#2a2a2a] mb-5">
              <span>{t('hero.titleLead', 'Eat well,')}</span>
              <br />
              <span className="text-[#8bc020]">{t('hero.titleAccent', 'stress less.')}</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-[19px] text-[#6b6b6b] leading-relaxed max-w-[500px] mx-auto lg:mx-0 mb-8">
              {t(
                'hero.sub',
                "mise is a meal planner for weekly meal planning and meal prep. Plan dinners around your budget, your cravings, and what's already in your kitchen. Build your week and one smart shopping list in about five minutes."
              )}
            </p>

            {/* Action buttons & store badges */}
            <div className="flex flex-col items-center lg:items-start gap-4 mb-6">
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 w-full" id="download">
                <StoreBadge platform="apple" />
                <StoreBadge platform="google" />
              </div>

              {/* Web App Quick Access */}
              <div className="pt-2">
                <Link
                  to="/app/plan"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#1f2a06] bg-[#9ed034]/20 hover:bg-[#9ed034]/30 px-5 py-2.5 rounded-full transition-all border border-[#9ed034]/40"
                >
                  <span>Launch Interactive Web Application</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust Stars */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#6b6b6b] pt-2">
                <span className="text-[#f4b740] tracking-widest text-base">★★★★★</span>
                <span>{regional.heroTrust || t('regional.heroTrust', 'Loved by busy home cooks across the US & beyond')}</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Right (3-Phone Showcase) */}
          <div className="relative flex justify-center items-center min-h-[420px] sm:min-h-[500px] w-full max-w-[520px] mx-auto">
            {/* Left Phone (Behind, angled) */}
            <div className="hidden sm:block absolute left-0 bottom-4 w-[230px] sm:w-[245px] -rotate-12 opacity-95 transition-transform hover:-rotate-6 hover:scale-105 z-0 duration-300">
              <PhoneMockup
                src="/assets/screens/en/preferences-vibes.png"
                alt="Preferences vibes screen"
              />
            </div>

            {/* Center Floating Phone */}
            <div className="relative w-[260px] sm:w-[285px] z-10">
              <PhoneMockup
                src="/assets/screens/en/plan-overview.png"
                alt="Plan overview screen"
                floating={true}
              />
            </div>

            {/* Right Phone (Behind, angled) */}
            <div className="hidden sm:block absolute right-0 bottom-4 w-[230px] sm:w-[245px] rotate-12 opacity-95 transition-transform hover:rotate-6 hover:scale-105 z-0 duration-300">
              <PhoneMockup
                src="/assets/screens/en/explore-by-cuisine.png"
                alt="Explore by cuisine screen"
              />
            </div>

            {/* Floating pill chips */}
            <div className="absolute top-4 left-2 sm:left-4 z-20 bg-white rounded-full px-3.5 py-2 text-xs sm:text-sm font-bold shadow-[0_12px_32px_rgba(42,42,42,0.12)] flex items-center gap-2 border border-black/5 animate-float-slow">
              <span className="text-base">🛒</span>
              <span>{t('hero.chipList', 'One shopping list')}</span>
            </div>

            <div
              className="absolute bottom-6 right-2 sm:right-4 z-20 bg-[#ddf4ff] rounded-full px-3.5 py-2 text-xs sm:text-sm font-bold shadow-[0_12px_32px_rgba(42,42,42,0.12)] flex items-center gap-2 border border-[#7dd3fc]/30 animate-float-slow"
              style={{ animationDelay: '1.5s' }}
            >
              <span className="text-base">{regional.chipBudgetEmoji || '💵'}</span>
              <span>{t('hero.chipBudget', 'Under budget')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
