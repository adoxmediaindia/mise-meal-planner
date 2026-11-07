import React, { useState } from 'react';
import { NotificationBellIllustration } from './NotificationBellIllustration.js';
import { PrimaryButton } from './PrimaryButton.js';
import { Check } from 'lucide-react';
import { TrialReminderPreference } from '../../types/index.js';

interface TrialReminderScreenProps {
  initialPreference?: TrialReminderPreference;
  onContinue: (pref: TrialReminderPreference) => void;
}

export const TrialReminderScreen: React.FC<TrialReminderScreenProps> = ({
  initialPreference = '1_day_before',
  onContinue,
}) => {
  const [selected, setSelected] = useState<TrialReminderPreference>(initialPreference);

  return (
    <div className="flex-1 flex flex-col justify-between py-2 sm:py-4 text-center animate-fadeIn">
      {/* Top Heading & Copy */}
      <div className="mb-2">
        <h1
          data-testid="trial-reminder-heading"
          className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight leading-tight mb-2"
        >
          Trial Reminder Preference
        </h1>
        <p className="text-xs sm:text-sm text-[#6b6b6b] max-w-xs mx-auto leading-relaxed">
          Select your preferred reminder window. This preference will be saved to your profile for when notifications are configured.
        </p>
      </div>

      {/* 3D Notification Bell Visual */}
      <div className="my-auto py-2 flex flex-col items-center">
        <NotificationBellIllustration size={150} className="mb-4" />

        {/* Selection Cards */}
        <div className="w-full space-y-3">
          {/* Option 1: 1 day before */}
          <button
            type="button"
            data-testid="reminder-option-1-day"
            onClick={() => setSelected('1_day_before')}
            className={`w-full bg-white rounded-2xl p-4 border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
              selected === '1_day_before'
                ? 'border-[#9ed034] ring-2 ring-[#9ed034]/20 shadow-sm'
                : 'border-[#eaeae6] hover:border-gray-300'
            }`}
          >
            <div>
              <span className="font-extrabold text-sm sm:text-base text-[#1a1a1a] block">
                1 day before
              </span>
              <span className="text-xs text-[#7db51e] font-medium block mt-0.5">
                Preference: 1 day notice
              </span>
            </div>
            {selected === '1_day_before' ? (
              <span className="w-5 h-5 rounded-full bg-[#9ed034] text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border border-gray-300 shrink-0" />
            )}
          </button>

          {/* Option 2: 2 days before */}
          <button
            type="button"
            data-testid="reminder-option-2-days"
            onClick={() => setSelected('2_days_before')}
            className={`w-full bg-white rounded-2xl p-4 border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
              selected === '2_days_before'
                ? 'border-[#9ed034] ring-2 ring-[#9ed034]/20 shadow-sm'
                : 'border-[#eaeae6] hover:border-gray-300'
            }`}
          >
            <div>
              <span className="font-extrabold text-sm sm:text-base text-[#1a1a1a] block">
                2 days before
              </span>
              <span className="text-xs text-[#6b6b6b] font-medium block mt-0.5">
                Preference: 2 days notice
              </span>
            </div>
            {selected === '2_days_before' ? (
              <span className="w-5 h-5 rounded-full bg-[#9ed034] text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border border-gray-300 shrink-0" />
            )}
          </button>
        </div>

        {/* Supporting Assurance Text */}
        <p className="text-xs text-[#8c8c88] mt-4 font-medium">
          Preference saved to profile. Notification scheduling is currently inactive.
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="pt-4">
        <PrimaryButton testId="continue-trial-reminder-btn" onClick={() => onContinue(selected)}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
};
