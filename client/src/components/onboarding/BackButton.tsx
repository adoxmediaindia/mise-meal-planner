import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  className = '',
  ariaLabel = 'Go back to previous screen',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`w-11 h-11 rounded-full bg-white border border-[#2a2a2a]/10 flex items-center justify-center text-[#2a2a2a] shadow-sm hover:bg-gray-50 active:scale-95 transition-all cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-5 h-5 text-[#2a2a2a]" strokeWidth={2.2} />
    </button>
  );
};
