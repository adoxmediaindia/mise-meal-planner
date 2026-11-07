import React from 'react';

interface NotificationBellIllustrationProps {
  className?: string;
  size?: number;
}

export const NotificationBellIllustration: React.FC<NotificationBellIllustrationProps> = ({
  className = '',
  size = 180,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="3D reminder notification bell"
    >
      {/* Soft warm floor glow shadow */}
      <div
        className="absolute bottom-2 rounded-full bg-[#f59e0b]/20 blur-xl pointer-events-none"
        style={{ width: size * 0.7, height: size * 0.25 }}
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          {/* Bell 3D Body Gradient */}
          <linearGradient id="bellBodyGrad" x1="40" y1="20" x2="120" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="35%" stopColor="#FBBF24" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Bell Rim Gradient */}
          <linearGradient id="bellRimGrad" x1="20" y1="120" x2="140" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Clapper Gradient */}
          <linearGradient id="clapperGrad" x1="70" y1="130" x2="90" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Red Notification Badge Gradient */}
          <linearGradient id="badgeGrad" x1="100" y1="40" x2="125" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="40%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>

          {/* Highlight Specular */}
          <linearGradient id="highlightGrad" x1="55" y1="35" x2="70" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Clapper (Bottom center) */}
        <circle cx="80" cy="132" r="14" fill="url(#clapperGrad)" />
        <ellipse cx="80" cy="138" rx="8" ry="4" fill="#78350F" opacity="0.4" />

        {/* Bell Body */}
        <path
          d="M80 24C60 24 50 48 46 80C42 108 28 118 28 124C28 127 31 129 38 129H122C129 129 132 127 132 124C132 118 118 108 114 80C110 48 100 24 80 24Z"
          fill="url(#bellBodyGrad)"
        />

        {/* Specular curved highlight on left curve */}
        <path
          d="M74 32C64 36 57 52 54 78C52 94 44 108 40 116C43 118 48 116 52 106C56 86 63 46 74 32Z"
          fill="url(#highlightGrad)"
        />

        {/* Bell Rim Bottom Flange */}
        <path
          d="M26 123C26 120 40 118 80 118C120 118 134 120 134 123C134 127 120 131 80 131C40 131 26 127 26 123Z"
          fill="url(#bellRimGrad)"
        />
        <ellipse cx="80" cy="126" rx="46" ry="4" fill="#92400E" opacity="0.3" />

        {/* Top Handle Loop */}
        <path
          d="M72 26C72 17 88 17 88 26"
          stroke="#F59E0B"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Red Notification Badge */}
        <g filter="drop-shadow(0px 3px 6px rgba(239, 68, 68, 0.45))">
          <circle cx="114" cy="54" r="16" fill="url(#badgeGrad)" />
          {/* Subtle 3D shine on red sphere */}
          <ellipse cx="110" cy="49" rx="5" ry="3" fill="#FFFFFF" opacity="0.75" />
        </g>
      </svg>
    </div>
  );
};
