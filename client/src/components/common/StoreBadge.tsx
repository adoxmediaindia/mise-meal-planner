import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

interface StoreBadgeProps {
  platform: 'apple' | 'google';
  href?: string;
  onClick?: () => void;
  className?: string;
}

export const StoreBadge: React.FC<StoreBadgeProps> = ({
  platform,
  href = '#download',
  onClick,
  className = '',
}) => {
  const { t } = useLanguage();

  if (platform === 'apple') {
    return (
      <a
        href={href}
        onClick={onClick}
        className={`inline-flex items-center gap-3 bg-[#1a1a1a] text-white px-5 py-3 rounded-[14px] shadow-[0_4px_16px_rgba(42,42,42,0.06)] hover:shadow-[0_12px_32px_rgba(42,42,42,0.1)] hover:-translate-y-0.5 transition-all select-none ${className}`}
        aria-label="Download on the App Store"
      >
        <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
        </svg>
        <span className="flex flex-col text-left leading-[1.1]">
          <span className="text-[11px] opacity-85">{t('hero.appStoreSmall', 'Download on the')}</span>
          <span className="text-[17px] font-bold font-sans">{t('hero.appStoreBig', 'App Store')}</span>
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      onClick={onClick}
      className={`inline-flex items-center gap-3 bg-[#1a1a1a] text-white px-5 py-3 rounded-[14px] shadow-[0_4px_16px_rgba(42,42,42,0.06)] hover:shadow-[0_12px_32px_rgba(42,42,42,0.1)] hover:-translate-y-0.5 transition-all select-none ${className}`}
      aria-label="Get it on Google Play"
    >
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 512 512" aria-hidden="true">
        <path fill="#00d3ff" d="M48 59.5c-6 4.5-9 11.7-9 21.3v350.4c0 9.6 3 16.8 9 21.3l1.9 1.5L246.7 258v-4L49.9 58z" />
        <path fill="#ffce00" d="M312 323.7l-65.3-65.3v-4.8l65.4-65.4 1.5.9 77.4 44c22.1 12.5 22.1 33.1 0 45.7l-77.4 44z" />
        <path fill="#ff3d47" d="M313.5 322.8L246.7 256 48 454.7c7.3 7.7 19.3 8.6 32.9.9z" />
        <path fill="#00f076" d="M313.5 189.2L80.9 56.5C67.3 48.7 55.3 49.7 48 57.4L246.7 256z" />
      </svg>
      <span className="flex flex-col text-left leading-[1.1]">
        <span className="text-[11px] opacity-85">{t('hero.playStoreSmall', 'Get it on')}</span>
        <span className="text-[17px] font-bold font-sans">{t('hero.playStoreBig', 'Google Play')}</span>
      </span>
    </a>
  );
};
