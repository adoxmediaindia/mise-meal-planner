import React from 'react';
import { Nav } from '../../components/marketing/Nav.js';
import { Footer } from '../../components/marketing/Footer.js';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8] text-[#2a2a2a]">
      <Nav />
      <main className="flex-1">
        <section className="pt-16 pb-10 text-center">
          <div className="w-full max-w-[760px] mx-auto px-5">
            <span className="inline-flex items-center font-sans font-bold text-xs uppercase tracking-wider text-[#8bc020] bg-[#9ed034]/15 px-3.5 py-1.5 rounded-full mb-4">
              Legal
            </span>
            <h1 className="font-serif font-semibold text-4xl sm:text-5xl text-[#2a2a2a] mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-[#6b6b6b]">Last updated: 6 June 2026</p>
          </div>
        </section>

        <section className="pb-24">
          <div className="w-full max-w-[760px] mx-auto px-5 space-y-6 text-[#444] text-[15px] sm:text-base leading-relaxed">
            <p>
              TEGS LABS LTD (&ldquo;mise&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) respects your privacy and is committed to protecting your personal data.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, store, and protect your information when you use the mise mobile application, website, and related services (collectively, the &ldquo;Service&rdquo;).
            </p>

            <h2 className="font-serif font-semibold text-2xl text-[#2a2a2a] pt-4">1. Who We Are</h2>
            <p>
              mise is operated by TEGS LABS LTD. Email:{' '}
              <a href="mailto:support@misemealplanner.com" className="text-[#8bc020] underline font-semibold">
                support@misemealplanner.com
              </a>. For the purposes of UK data protection law, TEGS LABS LTD is the data controller of your personal information.
            </p>

            <h2 className="font-serif font-semibold text-2xl text-[#2a2a2a] pt-4">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-1.5 text-sm sm:text-base">
              <li>Name and account login credentials</li>
              <li>Dietary preferences and calorie goals</li>
              <li>Allergies, food preferences, and exclusion lists</li>
              <li>Supermarket preference and kitchen kit equipment</li>
              <li>Saved recipes, favorites, and generated weekly plans</li>
              <li>Customer support enquiries and feedback</li>
            </ul>

            <h2 className="font-serif font-semibold text-2xl text-[#2a2a2a] pt-4">3. Meal Planning Information Disclaimer</h2>
            <p className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-900 text-sm">
              Information regarding dietary preferences, allergies, calorie goals, ingredients you own, and meal selections is used solely to provide personalised meal planning and recipe recommendations. Users remain responsible for verifying ingredients and ensuring meals are suitable for their dietary requirements.
            </p>

            <h2 className="font-serif font-semibold text-2xl text-[#2a2a2a] pt-4">4. Your Data Protection Rights</h2>
            <p>
              Under UK GDPR and European data protection law, you have the right to access, rectify, or erase your personal data, restrict or object to processing, and request data portability. Contact{' '}
              <a href="mailto:support@misemealplanner.com" className="text-[#8bc020] underline font-semibold">
                support@misemealplanner.com
              </a>{' '}
              at any time to exercise these rights.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
