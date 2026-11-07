import React, { useState } from 'react';
import { PrimaryButton } from './PrimaryButton.js';
import { Check, X, ShieldAlert } from 'lucide-react';
import { CurrencyCode } from '../../types/index.js';

interface PricingScreenProps {
  currencyCode?: CurrencyCode;
  isStartingTrial?: boolean;
  onStartTrial: (planId: 'mise_free' | 'mise_pro_yearly' | 'mise_pro_monthly') => void;
}

export const PricingScreen: React.FC<PricingScreenProps> = ({
  currencyCode = 'USD',
  isStartingTrial = false,
  onStartTrial,
}) => {
  const [showAllPlans, setShowAllPlans] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<'mise_free' | 'mise_pro_yearly' | 'mise_pro_monthly'>('mise_free');

  return (
    <div className="flex-1 flex flex-col justify-between py-2 sm:py-4 text-center animate-fadeIn">
      {/* Top Heading & Honest Status */}
      <div>
        <h1
          data-testid="pricing-heading"
          className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2"
        >
          Meltto Subscription
        </h1>

        {/* Clear Stripe Unconfigured Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-4 text-left">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-extrabold text-xs text-amber-800 uppercase tracking-wider">
              Online Checkout Unconfigured
            </span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            Stripe payment gateway and live product price IDs are not configured in this environment. Paid subscription checkout is safely disabled.
          </p>
        </div>

        {/* Active Free Starter Tier Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#eaeae6] mb-4 text-left space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-extrabold text-base text-[#1a1a1a] block">Free Starter Tier</span>
              <span className="text-xs text-[#7db51e] font-bold block mt-0.5">Active for all new users</span>
            </div>
            <span className="text-xs font-extrabold px-2 py-0.5 bg-[#9ed034]/20 text-[#4c6e11] rounded-full">
              Active
            </span>
          </div>
          <ul className="text-xs text-[#4a4a4a] space-y-1.5 pt-1">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#7db51e] shrink-0" />
              <span>Up to 3 weekly meal plans tailored to your budget</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#7db51e] shrink-0" />
              <span>Aisle-sorted smart grocery list</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#7db51e] shrink-0" />
              <span>Strict allergy &amp; dietary restrictions enforced</span>
            </li>
          </ul>
        </div>

        {/* Honest Value Props (No fabricated user counts or review scores) */}
        <div className="grid grid-cols-3 gap-2 my-2 text-center">
          <div className="bg-[#fafaf8] rounded-xl p-2.5 border border-[#eaeae6]">
            <span className="text-base block mb-0.5">🥗</span>
            <span className="text-[11px] font-bold text-[#1a1a1a] block">Custom Meals</span>
            <span className="text-[9px] text-[#8c8c88] block">Personalized</span>
          </div>
          <div className="bg-[#fafaf8] rounded-xl p-2.5 border border-[#eaeae6]">
            <span className="text-base block mb-0.5">🛒</span>
            <span className="text-[11px] font-bold text-[#1a1a1a] block">Smart Shop</span>
            <span className="text-[9px] text-[#8c8c88] block">Aisle Sorted</span>
          </div>
          <div className="bg-[#fafaf8] rounded-xl p-2.5 border border-[#eaeae6]">
            <span className="text-base block mb-0.5">🛡️</span>
            <span className="text-[11px] font-bold text-[#1a1a1a] block">Safe Prep</span>
            <span className="text-[9px] text-[#8c8c88] block">Allergy Checked</span>
          </div>
        </div>
      </div>

      {/* Bottom Conversion Section */}
      <div className="pt-3">
        {/* Notice of unconfigured checkout */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#6b6b6b] font-medium mb-3">
          <span>No checkout required while billing is unconfigured</span>
        </div>

        {/* CTA Button */}
        <PrimaryButton
          testId="start-free-trial-btn"
          onClick={() => onStartTrial(selectedPlan)}
          disabled={isStartingTrial}
        >
          {isStartingTrial ? 'Continuing...' : 'Continue with Free Starter'}
        </PrimaryButton>

        {/* View all plans link */}
        <button
          type="button"
          data-testid="view-all-plans-btn"
          onClick={() => setShowAllPlans(true)}
          className="mt-3 text-xs sm:text-sm text-gray-500 font-semibold underline underline-offset-4 hover:text-gray-800 transition-colors"
        >
          View all plans
        </button>
      </div>

      {/* ======================================================== */}
      {/* ALL PLANS MODAL                                          */}
      {/* ======================================================== */}
      {showAllPlans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-left animate-scaleUp">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-xl text-[#1a1a1a]">Meltto Plans</h3>
              <button
                type="button"
                onClick={() => setShowAllPlans(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6b6b6b] mb-4">
              Overview of available tiers. Live online billing is currently inactive.
            </p>

            <div className="space-y-3 mb-5">
              {/* Plan 1: Free Starter (Active) */}
              <button
                type="button"
                data-testid="select-starter-plan"
                onClick={() => setSelectedPlan('mise_free')}
                className={`w-full p-3.5 rounded-2xl border text-left flex justify-between items-center transition-all ${
                  selectedPlan === 'mise_free'
                    ? 'border-[#9ed034] bg-[#fbfdf7] ring-2 ring-[#9ed034]/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[#1a1a1a]">Meltto Starter</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#eef7db] text-[#5c8511]">
                      Active
                    </span>
                  </div>
                  <span className="text-xs text-[#7db51e] font-bold block mt-0.5">
                    Free Forever
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Up to 3 meal plans per week, 15 pantry staples
                  </span>
                </div>
                {selectedPlan === 'mise_free' && (
                  <span className="w-5 h-5 rounded-full bg-[#9ed034] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </button>

              {/* Plan 2: Pro Annual (Unconfigured) */}
              <div
                data-testid="select-pro-annual-plan"
                className="w-full p-3.5 rounded-2xl border border-gray-200 bg-gray-50 opacity-80"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#1a1a1a]">Meltto Pro Annual</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-gray-200 text-gray-600">
                    Billing Unconfigured
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-bold block mt-0.5">
                  Pricing not configured
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Requires configured Stripe product and price ID
                </span>
              </div>

              {/* Plan 3: Pro Monthly (Unconfigured) */}
              <div
                data-testid="select-pro-monthly-plan"
                className="w-full p-3.5 rounded-2xl border border-gray-200 bg-gray-50 opacity-80"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#1a1a1a]">Meltto Pro Monthly</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-gray-200 text-gray-600">
                    Billing Unconfigured
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-bold block mt-0.5">
                  Pricing not configured
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Requires configured Stripe product and price ID
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllPlans(false)}
              className="w-full py-3 rounded-full text-sm font-bold bg-[#9ed034] text-white hover:bg-[#8bc020] transition-colors"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
