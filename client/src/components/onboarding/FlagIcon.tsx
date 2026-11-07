import React from 'react';
import { OnboardingLanguage } from '../../types/index.js';

interface FlagIconProps {
  language: OnboardingLanguage;
  className?: string;
}

export const FlagIcon: React.FC<FlagIconProps> = ({ language, className = '' }) => {
  switch (language) {
    case 'en':
      return (
        <svg
          viewBox="0 0 60 40"
          className={`w-10 h-7 rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-black/10 flex-shrink-0 ${className}`}
          aria-label="English flag"
        >
          <rect width="60" height="40" fill="#012169" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="7" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3.5" />
          <path d="M30,0 v40 M0,20 h60" stroke="#FFFFFF" strokeWidth="11" />
          <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="6" />
        </svg>
      );
    case 'de':
      return (
        <svg
          viewBox="0 0 60 40"
          className={`w-10 h-7 rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-black/10 flex-shrink-0 ${className}`}
          aria-label="German flag"
        >
          <rect width="60" height="13.33" fill="#000000" />
          <rect y="13.33" width="60" height="13.33" fill="#DD0000" />
          <rect y="26.66" width="60" height="13.34" fill="#FFCE00" />
        </svg>
      );
    case 'sv':
      return (
        <svg
          viewBox="0 0 60 40"
          className={`w-10 h-7 rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-black/10 flex-shrink-0 ${className}`}
          aria-label="Swedish flag"
        >
          <rect width="60" height="40" fill="#006AA7" />
          <rect x="18" width="8" height="40" fill="#FECC00" />
          <rect y="16" width="60" height="8" fill="#FECC00" />
        </svg>
      );
    case 'nl':
      return (
        <svg
          viewBox="0 0 60 40"
          className={`w-10 h-7 rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-black/10 flex-shrink-0 ${className}`}
          aria-label="Dutch flag"
        >
          <rect width="60" height="13.33" fill="#AE1C28" />
          <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
          <rect y="26.66" width="60" height="13.34" fill="#21468B" />
        </svg>
      );
    case 'pt':
      return (
        <svg
          viewBox="0 0 60 40"
          className={`w-10 h-7 rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-black/10 flex-shrink-0 ${className}`}
          aria-label="Portuguese flag"
        >
          <rect width="24" height="40" fill="#046A38" />
          <rect x="24" width="36" height="40" fill="#DA291C" />
          <circle cx="24" cy="20" r="7.5" fill="#FFC72C" />
          <circle cx="24" cy="20" r="4.5" fill="#FFFFFF" stroke="#002B49" strokeWidth="1" />
        </svg>
      );
    case 'es':
      return (
        <svg
          viewBox="0 0 60 40"
          className={`w-10 h-7 rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-black/10 flex-shrink-0 ${className}`}
          aria-label="Spanish flag"
        >
          <rect width="60" height="10" fill="#AA151B" />
          <rect y="10" width="60" height="20" fill="#F1BF00" />
          <rect y="30" width="60" height="10" fill="#AA151B" />
          <circle cx="16" cy="20" r="4" fill="#AA151B" opacity="0.85" />
        </svg>
      );
    case 'fr':
      return (
        <svg
          viewBox="0 0 60 40"
          className={`w-10 h-7 rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-black/10 flex-shrink-0 ${className}`}
          aria-label="French flag"
        >
          <rect width="20" height="40" fill="#002654" />
          <rect x="20" width="20" height="40" fill="#FFFFFF" />
          <rect x="40" width="20" height="40" fill="#ED2939" />
        </svg>
      );
    default:
      return null;
  }
};
