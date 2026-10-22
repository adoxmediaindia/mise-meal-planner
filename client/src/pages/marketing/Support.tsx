import React from 'react';
import { Nav } from '../../components/marketing/Nav.js';
import { Footer } from '../../components/marketing/Footer.js';

export const Support: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8] text-[#2a2a2a]">
      <Nav />
      <main className="flex-1">
        {/* Page Hero */}
        <section className="relative pt-16 pb-10 text-center overflow-hidden">
          <div className="absolute top-[-100px] right-[-80px] w-80 h-80 rounded-full bg-[#9ed034]/20 blur-3xl pointer-events-none" />
          <div className="w-full max-w-[760px] mx-auto px-5">
            <span className="inline-flex items-center font-sans font-bold text-xs uppercase tracking-wider text-[#8bc020] bg-[#9ed034]/15 px-3.5 py-1.5 rounded-full mb-4">
              We're here to help
            </span>
            <h1 className="font-serif font-semibold text-4xl sm:text-5xl text-[#2a2a2a] mb-3">
              Support
            </h1>
            <p className="text-base sm:text-lg text-[#6b6b6b]">
              Questions, bugs, subscriptions or data requests — reach us any time.
            </p>
          </div>
        </section>

        {/* Content Prose */}
        <section className="pb-24">
          <div className="w-full max-w-[760px] mx-auto px-5 space-y-8">
            <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/5">
              <h2 className="font-serif font-semibold text-2xl text-[#2a2a2a] mb-3">
                Contact us
              </h2>
              <p className="text-[#444] text-[15px] sm:text-base leading-relaxed">
                Email{' '}
                <a
                  href="mailto:support@misemealplanner.com"
                  className="text-[#8bc020] font-bold underline"
                >
                  support@misemealplanner.com
                </a>{' '}
                for bugs, subscription questions, feedback, legal enquiries, or account and data deletion requests. We'll get back to you as soon as we can.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="font-serif font-semibold text-2xl text-[#2a2a2a]">
                Common questions
              </h2>

              <div className="space-y-2">
                <h3 className="font-serif font-semibold text-lg sm:text-xl text-[#2a2a2a]">
                  How do I change my meal plan?
                </h3>
                <p className="text-[#6b6b6b] text-sm sm:text-base leading-relaxed">
                  Open your current week and tap <strong>Regenerate plan</strong>, or swap individual meals from the recipe screen.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-semibold text-lg sm:text-xl text-[#2a2a2a]">
                  How does the shopping list work?
                </h3>
                <p className="text-[#6b6b6b] text-sm sm:text-base leading-relaxed">
                  mise combines ingredients across your week's recipes into one smart list, grouped for your chosen supermarket.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-semibold text-lg sm:text-xl text-[#2a2a2a]">
                  How do I manage or cancel my subscription?
                </h3>
                <p className="text-[#6b6b6b] text-sm sm:text-base leading-relaxed">
                  On iPhone, open your Apple subscription settings. On Android, open Google Play subscriptions. Or manage in your account settings.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-semibold text-lg sm:text-xl text-[#2a2a2a]">
                  How do I delete my account or data?
                </h3>
                <p className="text-[#6b6b6b] text-sm sm:text-base leading-relaxed">
                  Email{' '}
                  <a href="mailto:support@misemealplanner.com" className="text-[#8bc020] underline font-medium">
                    support@misemealplanner.com
                  </a>{' '}
                  or tap "Delete Account" under app Settings.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-semibold text-lg sm:text-xl text-[#2a2a2a]">
                  Allergies and dietary requirements
                </h3>
                <p className="text-[#6b6b6b] text-sm sm:text-base leading-relaxed">
                  mise uses the preferences you set during onboarding to filter recipes. Always check ingredient labels and recipes before cooking — we cannot guarantee allergen safety.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
