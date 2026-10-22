import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.js';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="pt-16 pb-12 sm:pb-16 border-t border-[#2a2a2a]/6 bg-[#fafaf8]">
      <div className="w-full max-w-[1120px] mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-12">
          {/* About Column */}
          <div>
            <Link to="/" className="relative block w-[80px] h-[25px] overflow-hidden mb-4" aria-label="mise home">
              <img
                src="/assets/mise-logo.png"
                alt="mise"
                className="absolute max-w-none w-[113px] h-[113px] -left-[16px] -top-[27px]"
              />
            </Link>
            <p className="text-sm text-[#6b6b6b] leading-relaxed max-w-[280px]">
              {t(
                'footer.about',
                'Personalised weekly meal plans and one smart shopping list, built around your budget and your supermarket. Eat well, stress less.'
              )}
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-[#6b6b6b] mb-4">
              {t('footer.product', 'Product')}
            </h5>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <a href="/#how" className="text-[#2a2a2a] hover:text-[#8bc020] transition-colors">
                  {t('nav.how', 'How it works')}
                </a>
              </li>
              <li>
                <a href="/#features" className="text-[#2a2a2a] hover:text-[#8bc020] transition-colors">
                  {t('nav.features', 'Features')}
                </a>
              </li>
              <li>
                <a href="/#vibes" className="text-[#2a2a2a] hover:text-[#8bc020] transition-colors">
                  {t('footer.mealVibes', 'Meal vibes')}
                </a>
              </li>
              <li>
                <a href="/#reviews" className="text-[#2a2a2a] hover:text-[#8bc020] transition-colors">
                  {t('nav.reviews', 'Reviews')}
                </a>
              </li>
            </ul>
          </div>

          {/* Get App Links */}
          <div>
            <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-[#6b6b6b] mb-4">
              {t('footer.getApp', 'Get the app')}
            </h5>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <a
                  href="https://apps.apple.com/app/id6777471316"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2a2a2a] hover:text-[#8bc020] transition-colors"
                >
                  {t('hero.appStoreBig', 'App Store')}
                </a>
              </li>
              <li>
                <a
                  href="https://play.google.com/store/apps/details?id=com.gregorytaylor.shopping"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2a2a2a] hover:text-[#8bc020] transition-colors"
                >
                  {t('hero.playStoreBig', 'Google Play')}
                </a>
              </li>
              <li>
                <a href="/#faq" className="text-[#2a2a2a] hover:text-[#8bc020] transition-colors">
                  {t('nav.faq', 'FAQ')}
                </a>
              </li>
              <li>
                <Link to="/app/plan" className="text-[#8bc020] font-bold hover:underline">
                  Web Application
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-[#6b6b6b] mb-4">
              {t('footer.company', 'Company')}
            </h5>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/support" className="text-[#2a2a2a] hover:text-[#8bc020] transition-colors">
                  {t('footer.support', 'Support')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[#2a2a2a] hover:text-[#8bc020] transition-colors">
                  {t('footer.privacy', 'Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[#2a2a2a] hover:text-[#8bc020] transition-colors">
                  {t('footer.terms', 'Terms of Service')}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@misemealplanner.com"
                  className="text-[#2a2a2a] hover:text-[#8bc020] transition-colors"
                >
                  {t('footer.contact', 'Contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-6 border-t border-[#2a2a2a]/6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#6b6b6b]">
          <span>© {currentYear} {t('footer.rights', 'TEGS Labs Ltd. All rights reserved.')}</span>
          <span>{t('footer.madeIn', 'Made with 🥬 in the UK · *Savings vary by household and shop.')}</span>
        </div>
      </div>
    </footer>
  );
};
