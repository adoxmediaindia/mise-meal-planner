import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.js';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Link to="/" className="brand" aria-label="mise home">
              <img src="/assets/mise-logo.png" alt="mise" />
            </Link>
            <p>
              {t(
                'footer.about',
                'Personalised weekly meal plans and one smart shopping list, built around your budget and your supermarket. Eat well, stress less.'
              )}
            </p>
          </div>

          <div className="footer-col">
            <h5>{t('footer.product', 'Product')}</h5>
            <a href="/#how">{t('nav.how', 'How it works')}</a>
            <a href="/#features">{t('nav.features', 'Features')}</a>
            <a href="/#vibes">{t('footer.mealVibes', 'Meal vibes')}</a>
            <a href="/#reviews">{t('nav.reviews', 'Reviews')}</a>
          </div>

          <div className="footer-col">
            <h5>{t('footer.getApp', 'Get the app')}</h5>
            <a
              href="https://apps.apple.com/app/id6777471316"
              target="_blank"
              rel="noreferrer"
            >
              {t('hero.appStoreBig', 'App Store')}
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.gregorytaylor.shopping"
              target="_blank"
              rel="noreferrer"
            >
              {t('hero.playStoreBig', 'Google Play')}
            </a>
            <a href="/#faq">{t('nav.faq', 'FAQ')}</a>
            <Link to="/app/plan" style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>
              Web Application
            </Link>
          </div>

          <div className="footer-col">
            <h5>{t('footer.company', 'Company')}</h5>
            <Link to="/support">{t('footer.support', 'Support')}</Link>
            <Link to="/privacy">{t('footer.privacy', 'Privacy Policy')}</Link>
            <Link to="/terms">{t('footer.terms', 'Terms of Service')}</Link>
            <a href="mailto:support@misemealplanner.com">{t('footer.contact', 'Contact')}</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {currentYear} {t('footer.rights', 'TEGS Labs Ltd. All rights reserved.')}
          </span>
          <span>
            {t('footer.madeIn', 'Made with 🥬 in the UK · *Savings vary by household and shop.')}
          </span>
        </div>
      </div>
    </footer>
  );
};
