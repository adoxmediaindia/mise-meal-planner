import React from 'react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  header,
  footer,
  className = '',
}) => {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-between selection:bg-[#9ed034]/20 selection:text-[#1a1a1a]">
      <div className="w-full max-w-[480px] mx-auto px-5 sm:px-6 flex flex-col flex-1 pb-6">
        {header && <div className="pt-2">{header}</div>}
        <main className={`flex-1 flex flex-col justify-between ${className}`}>
          {children}
        </main>
        {footer && <footer className="pt-4">{footer}</footer>}
      </div>
    </div>
  );
};
