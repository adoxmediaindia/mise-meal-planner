import React from 'react';
import clsx from 'clsx';

interface PhoneMockupProps {
  src?: string;
  alt?: string;
  children?: React.ReactNode;
  className?: string;
  floating?: boolean;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  src,
  alt = 'mise mobile screen',
  children,
  className,
  floating = false,
}) => {
  return (
    <div
      className={clsx(
        'relative bg-[#1a1a1a] rounded-[38px] sm:rounded-[46px] p-2.5 sm:p-3 shadow-[0_24px_60px_rgba(42,42,42,0.14)] select-none',
        floating && 'animate-float-slow',
        className
      )}
    >
      {/* Dynamic Island / Notch */}
      <div className="absolute top-3.5 sm:top-4 left-1/2 -translate-x-1/2 w-[90px] sm:w-[110px] h-[22px] sm:h-[26px] bg-[#1a1a1a] rounded-b-[16px] z-20 pointer-events-none" />

      {/* Screen container */}
      <div className="relative overflow-hidden rounded-[28px] sm:rounded-[34px] bg-[#fafaf8] w-full h-full">
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-auto block select-none pointer-events-none"
            loading="lazy"
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
};
