import React from 'react';

interface SelectionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  mutedUnselected?: boolean;
  onClick: () => void;
  className?: string;
  testId?: string;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  title,
  subtitle,
  icon,
  selected = false,
  mutedUnselected = false,
  onClick,
  className = '',
  testId,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={selected}
      className={`w-full bg-white rounded-[24px] p-4 sm:p-5 flex items-center gap-4 text-left border-2 transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.99] ${
        selected
          ? 'border-[#9ed034] bg-white ring-1 ring-[#9ed034]/40 shadow-[0_4px_16px_rgba(158,208,52,0.15)]'
          : 'border-[#eaeae6] hover:border-gray-300'
      } ${className}`}
    >
      {icon && (
        <div className="flex-shrink-0 flex items-center justify-center text-2xl sm:text-3xl w-10">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div
          className={`text-lg sm:text-xl font-bold leading-tight ${
            selected
              ? 'text-[#1a1a1a]'
              : mutedUnselected
              ? 'text-[#9a9a94]'
              : 'text-[#2a2a2a]'
          }`}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-[#8c8c88] font-medium mt-0.5 leading-snug">
            {subtitle}
          </div>
        )}
      </div>
    </button>
  );
};
