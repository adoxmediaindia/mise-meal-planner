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
          <Link to="/privacy" style={{ color: 'var(--primary-dark)', textDecoration: 'underline', fontWeight: 600 }}>
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
    <section className="section" id="faq" style={{ background: '#fff' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{t('faqSection.eyebrow', 'FAQ')}</span>
          <h2>{t('faqSection.title', 'Good to know')}</h2>
        </div>

        <div className="faq">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  padding: '4px 24px',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  style={{
                    width: '100%',
                    padding: '20px 0',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    fontSize: '17px',
                    color: 'var(--text)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span
                    style={{
                      fontSize: '24px',
                      color: 'var(--primary-dark)',
                      fontWeight: 400,
                      transform: isOpen ? 'rotate(45deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div
                    style={{
                      color: 'var(--muted)',
                      fontSize: '15.5px',
                      lineHeight: '1.6',
                      paddingBottom: '20px',
                    }}
                  >
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
