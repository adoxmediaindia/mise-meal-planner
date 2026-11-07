import React, { forwardRef } from 'react';

interface TextInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  testId?: string;
}

export const TextInputField = forwardRef<HTMLInputElement, TextInputFieldProps>(
  ({ error, className = '', testId, ...props }, ref) => {
    return (
      <div className="w-full">
        <div
          className={`w-full bg-white rounded-[22px] border-2 transition-all p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
            error
              ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-300'
              : 'border-[#eaeae6] focus-within:border-[#9ed034] focus-within:ring-2 focus-within:ring-[#9ed034]/20'
          } ${className}`}
        >
          <input
            ref={ref}
            data-testid={testId}
            className="w-full bg-transparent text-xl sm:text-2xl text-[#1a1a1a] font-medium placeholder-[#b4b4ae] outline-none"
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500 font-medium px-2">{error}</p>
        )}
      </div>
    );
  }
);

TextInputField.displayName = 'TextInputField';
