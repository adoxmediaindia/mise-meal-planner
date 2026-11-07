import React, { useEffect, useState, useRef } from 'react';
import { BuildingWeekIllustration } from './BuildingWeekIllustration.js';
import { api } from '../../services/api.js';
import { Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton.js';

interface BuildingWeekScreenProps {
  userName: string;
  preferences: {
    supermarket?: string;
    householdSize?: number;
    cookingDays?: string[];
    weeklyBudget?: number;
    dietaryNeeds?: string[];
    allergies?: string[];
    equipment?: string[];
    vibes?: string[];
  };
  isAuthenticated: boolean;
  savedPlan?: any;
  onGenerationSuccess: (plan: any) => void;
}

export const BuildingWeekScreen: React.FC<BuildingWeekScreenProps> = ({
  userName,
  preferences,
  isAuthenticated,
  savedPlan,
  onGenerationSuccess,
}) => {
  const [stage, setStage] = useState<number>(savedPlan ? 3 : 1);
  const [isGenerating, setIsGenerating] = useState<boolean>(!savedPlan);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasStartedRef = useRef<boolean>(false);

  const displayName = userName.trim() || 'Chef';

  const runPlanGeneration = async () => {
    setIsGenerating(true);
    setErrorMessage('');
    setStage(1);

    try {
      // Step 1: Matching meals to shop + budget
      const t1 = setTimeout(() => setStage(2), 650);
      // Step 2: Lining up dinners for the week
      const t2 = setTimeout(() => setStage(3), 1300);

      let planResult;
      if (isAuthenticated) {
        const res = await api.generatePlan();
        planResult = res.data;
      } else {
        const previewRes = await api.generatePreviewPlan({
          supermarket: preferences.supermarket || 'Aldi',
          householdSize: preferences.householdSize || 2,
          cookingDays: preferences.cookingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          weeklyBudget: preferences.weeklyBudget || 50,
          dietaryNeeds: preferences.dietaryNeeds || ['None'],
          allergies: preferences.allergies || ['None'],
          equipment: preferences.equipment || ['Stovetop'],
          vibes: preferences.vibes || ['Speedy Meals'],
        });
        planResult = previewRes.data;
      }

      clearTimeout(t1);
      clearTimeout(t2);

      setStage(3);
      setIsGenerating(false);

      // Brief delay so user sees all 3 items checked before advancing
      setTimeout(() => {
        onGenerationSuccess(planResult);
      }, 700);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'We could not generate your meal plan. Please check your connection and retry.'
      );
      setIsGenerating(false);
      hasStartedRef.current = false;
    }
  };

  useEffect(() => {
    if (savedPlan) {
      setStage(3);
      setIsGenerating(false);
      return;
    }
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    runPlanGeneration();
  }, [savedPlan]);

  const items = [
    { id: 1, label: 'matching meals to your shop + budget' },
    { id: 2, label: 'lining up dinners for the week' },
    { id: 3, label: 'putting together your grocery list' },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between py-2 sm:py-4 text-center animate-fadeIn">
      {/* Top Heading */}
      <div className="text-left mb-2">
        <h1
          data-testid="building-week-heading"
          className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight leading-tight"
        >
          {displayName}, we're building your week...
        </h1>
      </div>

      {/* Centered Food Orb Animation */}
      <div className="my-auto flex flex-col items-center justify-center py-2">
        <BuildingWeekIllustration size={230} className="mb-4" />

        {/* Checklist Card */}
        <div
          data-testid="building-progress-checklist"
          className="w-full max-w-sm bg-white rounded-3xl p-5 border border-[#eaeae6] shadow-sm text-left space-y-3.5 select-none"
        >
          {items.map((item) => {
            const isCompleted = stage > item.id || (!isGenerating && stage >= item.id && !errorMessage);
            const isInProgress = stage === item.id && isGenerating && !errorMessage;

            return (
              <div key={item.id} className="flex items-center gap-3">
                {isCompleted ? (
                  <span
                    data-testid={`checklist-item-${item.id}-done`}
                    className="w-5 h-5 rounded-full bg-[#9ed034] text-white flex items-center justify-center shrink-0"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                ) : isInProgress ? (
                  <span
                    data-testid={`checklist-item-${item.id}-loading`}
                    className="w-5 h-5 rounded-full bg-[#9ed034]/20 flex items-center justify-center shrink-0"
                  >
                    <Loader2 className="w-3.5 h-3.5 text-[#6f9d13] animate-spin" />
                  </span>
                ) : (
                  <span
                    data-testid={`checklist-item-${item.id}-pending`}
                    className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0"
                  />
                )}
                <span
                  className={`text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                    isCompleted
                      ? 'text-[#1a1a1a]'
                      : isInProgress
                      ? 'text-[#6f9d13]'
                      : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error Notice & Retry Button */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl max-w-sm w-full text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-red-700 font-medium mb-2">{errorMessage}</p>
              <button
                type="button"
                data-testid="retry-generation-btn"
                onClick={runPlanGeneration}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white font-bold text-xs hover:bg-red-700 active:scale-95"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Generation</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status / Advance Button */}
      <div className="pt-3">
        {savedPlan && !isGenerating && (
          <PrimaryButton testId="continue-building-btn" onClick={() => onGenerationSuccess(savedPlan)}>
            continue
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};
