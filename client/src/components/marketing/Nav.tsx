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
    <header className="nav">
      <div className="container nav-inner">
        {/* Brand Logo with exact clip geometry */}
        <Link to="/" className="brand" aria-label="mise home">
          <img
            src="/assets/mise-logo.png"
            alt="mise"
          />
        </Link>

        {/* Desktop Nav Links */}
        <nav className={`nav-links ${mobileOpen ? 'open' : ''}`} id="navLinks">
          <a
            href="/#how"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.how', 'How it works')}
          </a>
          <a
            href="/#features"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.features', 'Features')}
          </a>
          <a
            href="/#vibes"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.vibes', 'Vibes')}
          </a>
          <a
            href="/#reviews"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.reviews', 'Reviews')}
          </a>
          <a
            href="/#faq"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.faq', 'FAQ')}
          </a>
          {mobileOpen && (
            <div style={{ paddingTop: '12px' }}>
              {isAuthenticated ? (
                <Link
                  to="/app/plan"
                  className="btn btn--primary"
                  style={{ width: '100%', display: 'flex' }}
                >
                  Open Plan ({user?.name.split(' ')[0]})
                </Link>
              ) : (
                <Link
                  to="/auth/login"
                  className="btn btn--primary"
                  style={{ width: '100%', display: 'flex' }}
                >
                  {t('nav.getApp', 'Get the app')}
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* CTA and Language Switcher */}
        <div className="nav-cta">
          {/* Language Menu */}
          <div className="lang-switch" ref={langRef}>
            <button
              type="button"
              id="langBtn"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="lang-switch__btn"
              aria-haspopup="listbox"
              aria-expanded={langMenuOpen}
            >
              <span className="chip-emoji">{currentLangObj.flag}</span>
              <span>{currentLangObj.label}</span>
            </button>

            <div
              className={`lang-switch__menu ${langMenuOpen ? 'open' : ''}`}
              id="langMenu"
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
                  className={`lang-menu__item ${language === item.code ? 'active' : ''}`}
                  style={
                    language === item.code
                      ? { background: 'rgba(158, 208, 52, 0.15)', color: '#8bc020' }
                      : {}
                  }
                >
                  <span className="chip-emoji" style={{ marginRight: '8px' }}>{item.flag}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* App Link Button */}
          {isAuthenticated ? (
            <Link
              to="/app/plan"
              className="btn btn--primary"
            >
              Open Plan ({user?.name.split(' ')[0]})
            </Link>
          ) : (
            <Link
              to="/auth/login"
              className="btn btn--primary"
            >
              {t('nav.getApp', 'Get the app')}
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            className={`nav-toggle ${mobileOpen ? 'open' : ''}`}
            id="navToggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};
