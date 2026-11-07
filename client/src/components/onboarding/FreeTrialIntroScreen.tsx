import React from 'react';
import { AppMockupPreview } from './AppMockupPreview.js';
import { PrimaryButton } from './PrimaryButton.js';

interface FreeTrialIntroScreenProps {
  userName: string;
  supermarket: string;
  currencySymbol: string;
  estimatedCost: number;
  dinners?: Array<{ title: string; cookTime?: number; emoji?: string }>;
  onContinue: () => void;
}

export const FreeTrialIntroScreen: React.FC<FreeTrialIntroScreenProps> = ({
  userName,
  supermarket,
  currencySymbol,
  estimatedCost,
  dinners,
  onContinue,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between py-2 sm:py-4 items-center text-center animate-fadeIn">
      {/* Top Heading in Brand Green */}
      <div className="pt-1 mb-3">
        <h1
          data-testid="free-trial-intro-heading"
          className="text-2xl sm:text-3xl font-extrabold text-[#7db51e] tracking-tight leading-snug lowercase max-w-xs mx-auto"
        >
          we want you to try meltto for free!
        </h1>
      </div>

      {/* Center Phone Mockup Preview */}
      <div className="my-auto py-1">
        <AppMockupPreview
          userName={userName || 'Chef!'}
          supermarket={supermarket || 'Aldi'}
          currencySymbol={currencySymbol || '$'}
          estimatedCost={estimatedCost || 38.5}
          recipes={dinners}
        />
      </div>

      {/* Bottom Continue CTA */}
      <div className="pt-4 w-full">
        <PrimaryButton testId="continue-free-trial-intro-btn" onClick={onContinue}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
};
