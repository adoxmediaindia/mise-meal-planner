import React from 'react';

interface StopwatchIllustrationProps {
  className?: string;
  size?: number;
}

export const StopwatchIllustration: React.FC<StopwatchIllustrationProps> = ({
  className = '',
  size = 140,
}) => {
  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <svg
        width={size}
        height={size * 1.15}
        viewBox="0 0 120 138"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Stopwatch Illustration"
        className="drop-shadow-sm"
      >
        <defs>
          <linearGradient id="bezelGrad" x1="20" y1="20" x2="100" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D9DCE0" />
            <stop offset="50%" stopColor="#BEC5CB" />
            <stop offset="100%" stopColor="#9FA7AF" />
          </linearGradient>
          <linearGradient id="dialGrad" x1="60" y1="28" x2="60" y2="112" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5F6F8" />
          </linearGradient>
          <filter id="softShadow" x="0" y="8" width="120" height="130" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Top Loop */}
        <path
          d="M48 14 C48 7, 72 7, 72 14"
          stroke="#9FA7AF"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Top Crown / Pusher */}
        <rect x="54" y="12" width="12" height="12" rx="2.5" fill="#7D868F" />
        <rect x="52" y="10" width="16" height="4" rx="2" fill="#5E676F" />

        {/* Side Button at 1:30 */}
        <g transform="rotate(32 60 70)">
          <rect x="55" y="15" width="10" height="8" rx="2" fill="#8C949D" />
        </g>

        {/* Outer Bezel */}
        <circle cx="60" cy="70" r="46" fill="url(#bezelGrad)" filter="url(#softShadow)" />
        <circle cx="60" cy="70" r="42" fill="#FFFFFF" stroke="#CCD1D7" strokeWidth="1.5" />

        {/* Inner Dial Face */}
        <circle cx="60" cy="70" r="38" fill="url(#dialGrad)" />

        {/* Dial Tick Marks */}
        {/* 12 major hour ticks */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="60"
            y1={deg % 90 === 0 ? "36" : "38"}
            x2="60"
            y2="42"
            stroke={deg % 90 === 0 ? "#4A525A" : "#8C949D"}
            strokeWidth={deg % 90 === 0 ? "2.2" : "1.2"}
            strokeLinecap="round"
            transform={`rotate(${deg} 60 70)`}
          />
        ))}

        {/* Secondary Sub-ticks */}
        {[6, 12, 18, 24, 36, 42, 48, 54, 66, 72, 78, 84, 96, 102, 108, 114].map((deg) => (
          <line
            key={`sub-${deg}`}
            x1="60"
            y1="39"
            x2="60"
            y2="41"
            stroke="#B5BCC4"
            strokeWidth="0.8"
            strokeLinecap="round"
            transform={`rotate(${deg} 60 70)`}
          />
        ))}

        {/* Needle Hand pointing to 12:00 */}
        <line
          x1="60"
          y1="70"
          x2="60"
          y2="38"
          stroke="#1A1A1A"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Needle tail */}
        <line
          x1="60"
          y1="70"
          x2="60"
          y2="78"
          stroke="#1A1A1A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Center Pin & Ring */}
        <circle cx="60" cy="70" r="4.5" fill="#1A1A1A" />
        <circle cx="60" cy="70" r="2" fill="#FFFFFF" />
      </svg>
    </div>
  );
};
