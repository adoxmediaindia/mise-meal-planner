import React from 'react';
import { Nav } from '../../components/marketing/Nav.js';
import { Footer } from '../../components/marketing/Footer.js';

export const Terms: React.FC = () => {
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
              Terms of Service
            </h1>
            <p className="text-sm text-[#6b6b6b]">Effective date: 7 October 2026</p>
          </div>
        </section>

        <section className="pb-24">
          <div className="w-full max-w-[760px] mx-auto px-5 space-y-6 text-[#444] text-[15px] sm:text-base leading-relaxed">
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm space-y-2">
              <strong className="block text-amber-950 font-bold">Important allergy notice:</strong>
              <p>
                Mise is a meal-planning tool, not an allergen-safety verification service. Recommendations can contain mistakes, including ingredients inconsistent with allergies you have entered. Always independently check recipes, actual product labels and substitutions before preparing or eating food. An allergy setting or an absent warning does not confirm safety.
              </p>
            </div>

            <h2 className="font-serif font-semibold text-2xl text-[#2a2a2a] pt-4">1. What Mise provides</h2>
            <p>
              Mise helps users generate meal plans, discover recipes, prepare shopping lists, use pantry ingredients and plan shopping around supported retailers. Features, retailers and availability may differ by location and subscription.
            </p>
            <p>
              The Service provides general information and organisational assistance. It does not diagnose or treat conditions, provide personalised medical advice, or certify that food is safe for a particular person. Nutritional estimates are not clinical assessments.
            </p>

            <h2 className="font-serif font-semibold text-2xl text-[#2a2a2a] pt-4">2. Accounts &amp; Use</h2>
            <p>
              Provide accurate account information and keep it up to date. Keep login credentials secure and notify us promptly if you suspect unauthorised access.
            </p>

            <h2 className="font-serif font-semibold text-2xl text-[#2a2a2a] pt-4">
              4. Allergies, dietary requirements and food safety
            </h2>
            <p>
              <strong>4.1 Automated outputs have limitations:</strong> Meal plans, recipes, ingredient suggestions, substitutions and shopping recommendations use software and automated systems. Outputs may be inaccurate, incomplete or inconsistent with information you provided. An item appearing in your plan or shopping list is not confirmation of suitability or safety.
            </p>
            <p>
              <strong>4.2 Allergy settings do not verify safety:</strong> Any allergy, dietary-preference or ingredient-exclusion settings assist meal planning. They do not independently verify the safety of food or replace ingredient checks. Do not rely on Mise as the sole means of managing an allergy, intolerance, coeliac disease or medical dietary requirement.
            </p>
            <p>
              <strong>4.3 Checks before purchasing, preparing or eating:</strong> Review the complete recipe, check the current ingredient declarations on actual packaged products including &ldquo;may contain&rdquo; alerts, and take precautions against allergen cross-contact during preparation and storage.
            </p>

            <h2 className="font-serif font-semibold text-2xl text-[#2a2a2a] pt-4">5. Subscriptions and Billing</h2>
            <p>
              Mise offers optional subscription tiers for full planning and meal customization. You can manage or cancel your subscription at any time via your account settings or app store subscriptions.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
