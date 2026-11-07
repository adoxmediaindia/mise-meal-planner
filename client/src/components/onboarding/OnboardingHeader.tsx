import React from 'react';
import { BackButton } from './BackButton.js';
import { ProgressBar } from './ProgressBar.js';

interface OnboardingHeaderProps {
  onBack?: () => void;
  progress?: number; // 0 to 100
  showBack?: boolean;
  className?: string;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  onBack,
  progress,
  showBack = true,
  className = '',
}) => {
  return (
    <header className={`flex items-center gap-4 py-4 w-full ${className}`}>
      {showBack && onBack ? (
        <BackButton onClick={onBack} />
      ) : (
        <div className="w-11 h-11" />
      )}

      {progress !== undefined ? (
        <div className="flex-1 pr-2">
          <ProgressBar progress={progress} />
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </header>
  );
};
