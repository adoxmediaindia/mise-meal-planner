import React from 'react';
import { ReferralSource } from '../../types/index.js';

interface ReferralIconProps {
  source: ReferralSource;
  className?: string;
}

export const ReferralIcon: React.FC<ReferralIconProps> = ({ source, className = '' }) => {
  switch (source) {
    case 'Instagram':
      return (
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#C13584] p-[2px] flex items-center justify-center flex-shrink-0 ${className}`}>
          <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#E1306C]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </div>
        </div>
      );
    case 'TikTok':
      return (
        <div className={`w-8 h-8 rounded-xl bg-black flex items-center justify-center flex-shrink-0 ${className}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.884 2.87 2.896 2.896 0 0 1-2.896-2.87 2.896 2.896 0 0 1 2.896-2.884c.306 0 .598.05.871.139v-3.52a6.37 6.37 0 0 0-.871-.061C5.932 9.346 3 12.278 3 15.895 3 19.512 5.932 22.444 9.49 22.444c3.559 0 6.444-2.885 6.444-6.444V9.014a8.188 8.188 0 0 0 4.655 1.442V6.994c-.352 0-.691-.106-1-.308z"/>
          </svg>
        </div>
      );
    case 'YouTube':
      return (
        <div className={`w-8 h-8 rounded-xl bg-[#FF0000] flex items-center justify-center flex-shrink-0 ${className}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
      );
    case 'Facebook':
      return (
        <div className={`w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0 ${className}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
      );
    case 'Word of mouth':
      return (
        <div className={`w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 ${className}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#2A2A2A]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="8" cy="10" r="1" fill="currentColor" />
            <circle cx="12" cy="10" r="1" fill="currentColor" />
            <circle cx="16" cy="10" r="1" fill="currentColor" />
          </svg>
        </div>
      );
    case 'Google Play':
      return (
        <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 ${className}`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M3.6 1.5c-.3.3-.5.7-.5 1.3v18.4c0 .6.2 1 .5 1.3l.1.1 10.3-10.3v-.2L3.7 1.4l-.1.1z"/>
            <path fill="#FBBC04" d="M17.4 15.6l-3.4-3.4v-.4l3.4-3.4.1.1 4 2.3c1.1.6 1.1 1.7 0 2.3l-4.1 2.5z"/>
            <path fill="#EA4335" d="M14 12.2l-10.3 10.3c.4.4 1 .5 1.7.1l12-6.9-3.4-3.5z"/>
            <path fill="#34A853" d="M14 11.8l3.4-3.5-12-6.8c-.7-.4-1.3-.3-1.7.1L14 11.8z"/>
          </svg>
        </div>
      );
    default:
      return null;
  }
};
