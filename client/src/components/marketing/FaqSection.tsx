import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.js';

export const FaqSection: React.FC = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: t('faqSection.q1', 'Which supermarkets does mise support?'),
      a: (
        <p>
          {t(
            'faqSection.a1',
            'mise is built around major supermarkets including Walmart, Aldi, Kroger, Costco, Publix, Safeway and more, with support for stores across several countries. Your plan and shopping list are tuned to the shop you choose.'
          )}
        </p>
      ),
    },
    {
      q: t('faqSection.q2', 'Can it handle dietary needs and allergies?'),
      a: (
        <p>
          {t(
            'faqSection.a2',
            "Yes. Set preferences like vegetarian, vegan, pescatarian or gluten-free and flag allergens to avoid. Please always check ingredient labels before cooking. mise can't guarantee allergen safety."
          )}
        </p>
      ),
    },
    {
      q: t('faqSection.q3', 'How much does mise cost?'),
      a: (
        <p>
          {t(
            'faqSection.a3',
            'mise is a subscription. You can explore the app and see how it works, with full planning unlocked by a subscription managed through the App Store or Google Play. Cancel anytime from your store account.'
          )}
        </p>
      ),
    },
    {
      q: t('faqSection.q4', 'Do I have to cook every meal on my plan?'),
      a: (
        <p>
          {t(
            'faqSection.a4',
            "Not at all. Plan as many or as few nights as you like, up to seven. Swap any meal you don't fancy, regenerate the whole week, or just cook the ones you like. Your shopping list updates to match."
          )}
        </p>
      ),
    },
    {
      q: t('faqSection.q5', 'Will it really save me money?'),
      a: (
        <p>
          {t(
            'faqSection.a5',
            'Most people save by planning ahead, buying only what they need and reusing ingredients across meals. Savings vary by household and shop.'
          )}
        </p>
      ),
    },
    {
      q: t('faqSection.q6', 'Is my data private?'),
      a: (
        <p>
          We only use your preferences to build your plans and never sell your personal information. See our{' '}
          <Link to="/privacy" className="text-[#8bc020] underline font-semibold">
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
      ),
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 sm:py-24 bg-white" id="faq">
      <div className="w-full max-w-[760px] mx-auto px-5 sm:px-6">
        <div className="text-center mb-12">
          <span className="inline-flex items-center font-sans font-bold text-xs uppercase tracking-wider text-[#8bc020] bg-[#9ed034]/15 px-3.5 py-1.5 rounded-full mb-4">
            {t('faqSection.eyebrow', 'FAQ')}
          </span>
          <h2 className="font-serif font-semibold text-[32px] sm:text-[44px] text-[#2a2a2a] leading-tight">
            {t('faqSection.title', 'Good to know')}
          </h2>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-[#fafaf8] rounded-2xl border border-[#2a2a2a]/6 px-6 py-1 transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full py-4 text-left font-bold text-[16px] sm:text-[17px] text-[#2a2a2a] flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span
                    className={`text-2xl font-light text-[#8bc020] transition-transform duration-200 select-none ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-5 pt-1 text-sm sm:text-[15px] text-[#6b6b6b] leading-relaxed border-t border-[#2a2a2a]/5 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
