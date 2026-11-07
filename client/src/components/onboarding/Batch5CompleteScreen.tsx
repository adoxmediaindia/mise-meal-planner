import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton.js';
import { TrialReminderPreference } from '../../types/index.js';

interface Batch5CompleteScreenProps {
  userName: string;
  language: string;
  age: string | null;
  goal: string | null;
  countryName: string;
  currency: string;
  householdSize: number;
  cookingDays: string[];
  budget: number;
  currencySymbol: string;
  moods: string[];
  dietary: string[];
  allergies: string[];
  appliances: string[];
  trialReminder: TrialReminderPreference;
  selectedPlan: string;
  generatedPlan?: any;
  onReview: () => void;
}

export const Batch5CompleteScreen: React.FC<Batch5CompleteScreenProps> = ({
  userName,
  language,
  age,
  goal,
  countryName,
  currency,
  householdSize,
  cookingDays,
  budget,
  currencySymbol,
  moods,
  dietary,
  allergies,
  appliances,
  trialReminder,
  selectedPlan,
  generatedPlan,
  onReview,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between py-6 text-center animate-fadeIn">
      <div className="flex flex-col items-center pt-2">
        <div className="w-16 h-16 rounded-full bg-[#9ed034]/20 flex items-center justify-center text-[#8bc020] mb-3">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1
          data-testid="batch5-complete-heading"
          className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] mb-1"
        >
          Batch 5 Complete!
        </h1>
        <p className="text-xs sm:text-sm text-[#6b6b6b] max-w-sm mb-4 leading-relaxed">
          All 25 onboarding screens completed for{' '}
          <span className="font-semibold text-[#1a1a1a]">{userName || 'Chef'}</span>. Your weekly meal plan has been generated and free trial configured.
        </p>

        {/* 25-Screen Summary Table */}
        <div className="w-full bg-white rounded-2xl p-4 border border-[#eaeae6] text-left text-xs sm:text-sm space-y-2 mb-3 max-h-[50vh] overflow-y-auto shadow-2xs">
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Language (Screen 1):</span>
            <span className="font-bold text-[#1a1a1a]">{language.toUpperCase()}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Name (Screen 3):</span>
            <span className="font-bold text-[#1a1a1a]">{userName || 'Chef'}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Age (Screen 4):</span>
            <span className="font-bold text-[#1a1a1a]">{age || '—'}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Goal (Screen 5):</span>
            <span className="font-bold text-[#1a1a1a]">{goal || '—'}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Country / Currency (Screen 12):</span>
            <span className="font-bold text-[#1a1a1a]">{countryName} ({currency})</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Household (Screen 13):</span>
            <span className="font-bold text-[#1a1a1a]">{householdSize} {householdSize === 1 ? 'person' : 'people'}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Cooking Days (Screen 14):</span>
            <span className="font-bold text-[#1a1a1a]">{cookingDays.length} days</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Weekly Budget (Screen 15):</span>
            <span className="font-bold text-[#1a1a1a]">{currencySymbol}{budget}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Moods (Screen 17):</span>
            <span className="font-bold text-[#1a1a1a]">{moods.join(', ')}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Dietary Needs (Screen 18):</span>
            <span className="font-bold text-[#1a1a1a]">{dietary.join(', ')}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Allergies (Screen 19):</span>
            <span className="font-bold text-[#1a1a1a]">{allergies.join(', ')}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Appliances (Screen 20):</span>
            <span className="font-bold text-[#1a1a1a]">{appliances.join(', ')}</span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Generated Plan (Screen 22):</span>
            <span className="font-bold text-[#5c8511]">
              {generatedPlan?.dinners?.length || cookingDays.length} dinners generated
            </span>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span className="text-[#8c8c88]">Trial Reminder (Screen 24):</span>
            <span className="font-bold text-[#1a1a1a]">
              {trialReminder === '1_day_before' ? '1 day before (Recommended)' : '2 days before'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8c8c88]">Selected Tier:</span>
            <span className="font-bold text-[#1a1a1a]">
              {selectedPlan === 'mise_free'
                ? 'Meltto Starter (Free Forever)'
                : selectedPlan === 'mise_pro_monthly'
                ? 'Meltto Pro Monthly'
                : 'Meltto Pro Annual'}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#8c8c88] italic max-w-sm">
          Strict guardrail: Flow terminates safely at Screen 25. onboardingCompleted remains false until user checkout/registration.
        </p>
      </div>

      <div className="pt-4">
        <PrimaryButton testId="review-batch5-btn" onClick={onReview}>
          Review Selections
        </PrimaryButton>
      </div>
    </div>
  );
};
