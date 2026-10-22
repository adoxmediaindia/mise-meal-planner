import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Language } from '../../types/index.js';

export const Nav: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-[#fafaf8]/85 backdrop-blur-md border-b border-[#2a2a2a]/6 transition-colors">
      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6 min-h-[64px] flex items-center justify-between relative py-2">
        {/* Brand Logo with exact clip geometry */}
        <Link to="/" className="relative block flex-shrink-0 w-[108px] h-[34px] overflow-hidden" aria-label="mise home">
          <img
            src="/assets/mise-logo.png"
            alt="mise"
            className="absolute max-w-none w-[153px] h-[153px] -left-[22px] -top-[36px]"
          />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="/#how" className="text-[15px] font-semibold text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors">
            {t('nav.how', 'How it works')}
          </a>
          <a href="/#features" className="text-[15px] font-semibold text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors">
            {t('nav.features', 'Features')}
          </a>
          <a href="/#vibes" className="text-[15px] font-semibold text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors">
            {t('nav.vibes', 'Vibes')}
          </a>
          <a href="/#reviews" className="text-[15px] font-semibold text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors">
            {t('nav.reviews', 'Reviews')}
          </a>
          <a href="/#faq" className="text-[15px] font-semibold text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors">
            {t('nav.faq', 'FAQ')}
          </a>
        </nav>

        {/* CTA and Language Switcher */}
        <div className="flex items-center gap-3">
          {/* Language Menu */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#2a2a2a]/15 rounded-full bg-white text-[#2a2a2a] text-xs sm:text-sm font-semibold shadow-sm hover:border-[#2a2a2a]/30 transition-all cursor-pointer"
              aria-haspopup="listbox"
              aria-expanded={langMenuOpen}
            >
              <span>{currentLangObj.flag}</span>
              <span className="hidden sm:inline">{currentLangObj.label}</span>
            </button>

            {langMenuOpen && (
              <div
                className="absolute top-[calc(100%+8px)] right-0 min-w-[150px] p-1.5 bg-white rounded-2xl border border-[#2a2a2a]/10 shadow-[0_12px_32px_rgba(42,42,42,0.1)] z-50"
                role="listbox"
              >
                {languages.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLanguage(item.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                      language === item.code ? 'bg-[#9ed034]/20 text-[#8bc020]' : 'hover:bg-[#9ed034]/10 text-[#2a2a2a]'
                    }`}
                  >
                    <span>{item.flag}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* App Link Button */}
          {isAuthenticated ? (
            <Link
              to="/app/plan"
              className="hidden sm:inline-flex items-center justify-center font-bold text-sm sm:text-base px-5 py-2.5 rounded-full bg-[#9ed034] text-[#1f2a06] shadow-[0_6px_18px_rgba(158,208,52,0.4)] hover:bg-[#8bc020] hover:-translate-y-0.5 transition-all"
            >
              Open Plan ({user?.name.split(' ')[0]})
            </Link>
          ) : (
            <Link
              to="/auth/login"
              className="hidden sm:inline-flex items-center justify-center font-bold text-sm sm:text-base px-5 py-2.5 rounded-full bg-[#9ed034] text-[#1f2a06] shadow-[0_6px_18px_rgba(158,208,52,0.4)] hover:bg-[#8bc020] hover:-translate-y-0.5 transition-all"
            >
              {t('nav.getApp', 'Get the app')}
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#2a2a2a] focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-full bg-[#2a2a2a] rounded transition-transform ${
                  mobileOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-[#2a2a2a] rounded transition-opacity ${
                  mobileOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-[#2a2a2a] rounded transition-transform ${
                  mobileOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#2a2a2a]/10 px-6 py-5 shadow-lg flex flex-col gap-3 animate-fadeIn">
          <a
            href="/#how"
            onClick={() => setMobileOpen(false)}
            className="text-base font-semibold text-[#2a2a2a] py-2 border-b border-gray-100"
          >
            {t('nav.how', 'How it works')}
          </a>
          <a
            href="/#features"
            onClick={() => setMobileOpen(false)}
            className="text-base font-semibold text-[#2a2a2a] py-2 border-b border-gray-100"
          >
            {t('nav.features', 'Features')}
          </a>
          <a
            href="/#vibes"
            onClick={() => setMobileOpen(false)}
            className="text-base font-semibold text-[#2a2a2a] py-2 border-b border-gray-100"
          >
            {t('nav.vibes', 'Vibes')}
          </a>
          <a
            href="/#reviews"
            onClick={() => setMobileOpen(false)}
            className="text-base font-semibold text-[#2a2a2a] py-2 border-b border-gray-100"
          >
            {t('nav.reviews', 'Reviews')}
          </a>
          <a
            href="/#faq"
            onClick={() => setMobileOpen(false)}
            className="text-base font-semibold text-[#2a2a2a] py-2 border-b border-gray-100"
          >
            {t('nav.faq', 'FAQ')}
          </a>
          <div className="pt-2">
            {isAuthenticated ? (
              <Link
                to="/app/plan"
                className="w-full text-center block font-bold px-5 py-3 rounded-full bg-[#9ed034] text-[#1f2a06] shadow-md"
              >
                Go to Meal Plan
              </Link>
            ) : (
              <Link
                to="/auth/login"
                className="w-full text-center block font-bold px-5 py-3 rounded-full bg-[#9ed034] text-[#1f2a06] shadow-md"
              >
                Sign In / Get Started
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
