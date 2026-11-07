import React from 'react';
import { CountryCode } from '../../types/index.js';

interface CountryFlagProps {
  countryCode: CountryCode;
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ countryCode, className = '' }) => {
  const baseClasses = `w-11 h-7 rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-black/10 flex-shrink-0 ${className}`;

  switch (countryCode) {
    case 'US':
      return (
        <svg viewBox="0 0 60 40" className={baseClasses} aria-label="United States flag">
          {/* 13 Stripes */}
          {[...Array(13)].map((_, i) => (
            <rect
              key={i}
              y={(i * 40) / 13}
              width="60"
              height={40 / 13}
              fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'}
            />
          ))}
          {/* Blue Canton */}
          <rect width="25" height="21.5" fill="#3C3B6E" />
          {/* Stars Representation */}
          <g fill="#FFFFFF" opacity="0.9">
            <circle cx="5" cy="4" r="1.2" />
            <circle cx="12" cy="4" r="1.2" />
            <circle cx="19" cy="4" r="1.2" />
            <circle cx="8.5" cy="8" r="1.2" />
            <circle cx="15.5" cy="8" r="1.2" />
            <circle cx="5" cy="12" r="1.2" />
            <circle cx="12" cy="12" r="1.2" />
            <circle cx="19" cy="12" r="1.2" />
            <circle cx="8.5" cy="16" r="1.2" />
            <circle cx="15.5" cy="16" r="1.2" />
          </g>
        </svg>
      );

    case 'EU':
      return (
        <svg viewBox="0 0 60 40" className={baseClasses} aria-label="European Union flag">
          <rect width="60" height="40" fill="#003399" />
          {/* 12 Stars in circle */}
          <g fill="#FFCC00" transform="translate(30, 20)">
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x = 11 * Math.sin(angle);
              const y = -11 * Math.cos(angle);
              return <polygon key={i} points="0,-1.5 0.5,-0.5 1.5,-0.5 0.7,0.2 1,1.2 0,0.6 -1,1.2 -0.7,0.2 -1.5,-0.5 -0.5,-0.5" transform={`translate(${x}, ${y})`} />;
            })}
          </g>
        </svg>
      );

    case 'GB':
      return (
        <svg viewBox="0 0 60 40" className={baseClasses} aria-label="United Kingdom flag">
          <rect width="60" height="40" fill="#012169" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="7" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3.5" />
          <path d="M30,0 v40 M0,20 h60" stroke="#FFFFFF" strokeWidth="11" />
          <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="6" />
        </svg>
      );

    case 'AU':
      return (
        <svg viewBox="0 0 60 40" className={baseClasses} aria-label="Australia flag">
          <rect width="60" height="40" fill="#00008B" />
          {/* Mini Union Jack canton */}
          <g transform="scale(0.5)">
            <rect width="60" height="40" fill="#012169" />
            <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="7" />
            <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3.5" />
            <path d="M30,0 v40 M0,20 h60" stroke="#FFFFFF" strokeWidth="11" />
            <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
          {/* Commonwealth star & Southern Cross */}
          <g fill="#FFFFFF">
            <polygon points="15,26 16,29 19,29 17,31 18,34 15,32 12,34 13,31 11,29 14,29" />
            <circle cx="48" cy="10" r="1.4" />
            <circle cx="53" cy="18" r="1.4" />
            <circle cx="48" cy="30" r="1.4" />
            <circle cx="42" cy="21" r="1.4" />
            <circle cx="45" cy="24" r="1" />
          </g>
        </svg>
      );

    case 'CA':
      return (
        <svg viewBox="0 0 60 40" className={baseClasses} aria-label="Canada flag">
          <rect width="15" height="40" fill="#D80027" />
          <rect x="15" width="30" height="40" fill="#FFFFFF" />
          <rect x="45" width="15" height="40" fill="#D80027" />
          {/* Maple Leaf */}
          <path
            d="M30 11 L31.5 17 L34.5 16 L33.5 19 L37 20 L35 22.5 L36 24.5 L33 24 L31 27 L30.5 29 L29.5 29 L29 27 L27 24 L24 24.5 L25 22.5 L23 20 L26.5 19 L25.5 16 L28.5 17 Z"
            fill="#D80027"
          />
        </svg>
      );

    case 'NZ':
      return (
        <svg viewBox="0 0 60 40" className={baseClasses} aria-label="New Zealand flag">
          <rect width="60" height="40" fill="#00247D" />
          {/* Mini Union Jack canton */}
          <g transform="scale(0.5)">
            <rect width="60" height="40" fill="#012169" />
            <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="7" />
            <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3.5" />
            <path d="M30,0 v40 M0,20 h60" stroke="#FFFFFF" strokeWidth="11" />
            <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
          {/* 4 Red stars with white borders */}
          <g fill="#CC142B" stroke="#FFFFFF" strokeWidth="0.8">
            <circle cx="48" cy="11" r="1.8" />
            <circle cx="53" cy="20" r="1.8" />
            <circle cx="48" cy="30" r="1.8" />
            <circle cx="42" cy="21" r="1.8" />
          </g>
        </svg>
      );

    case 'BR':
      return (
        <svg viewBox="0 0 60 40" className={baseClasses} aria-label="Brazil flag">
          <rect width="60" height="40" fill="#009739" />
          <polygon points="30,5 54,20 30,35 6,20" fill="#FED100" />
          <circle cx="30" cy="20" r="7.5" fill="#002776" />
          <path d="M23 20 Q30 16 37 19" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
        </svg>
      );

    case 'IN':
      return (
        <svg viewBox="0 0 60 40" className={baseClasses} aria-label="India flag">
          <rect width="60" height="13.33" fill="#FF9933" />
          <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
          <rect y="26.66" width="60" height="13.34" fill="#138808" />
          <circle cx="30" cy="20" r="4.2" stroke="#000080" strokeWidth="1" fill="none" />
          <circle cx="30" cy="20" r="1.2" fill="#000080" />
        </svg>
      );

    default:
      return null;
  }
};
