import React from 'react';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  testId?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  testId,
}) => {
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      data-testid={testId}
      aria-disabled={disabled}
      className={`w-full h-14 sm:h-15 rounded-full font-bold text-lg sm:text-xl flex items-center justify-center transition-all duration-200 ${
        disabled
          ? 'bg-[#d5ea99] text-white/90 cursor-not-allowed opacity-90'
          : 'bg-[#9ed034] hover:bg-[#8bc020] text-white shadow-[0_8px_22px_rgba(158,208,52,0.35)] active:scale-[0.98] cursor-pointer'
      } ${className}`}
    >
      {children}
    </button>
  );
};
