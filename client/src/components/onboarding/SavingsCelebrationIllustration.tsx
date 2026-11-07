import React from 'react';

interface SavingsCelebrationIllustrationProps {
  className?: string;
  size?: number;
}

export const SavingsCelebrationIllustration: React.FC<SavingsCelebrationIllustrationProps> = ({
  className = '',
  size = 180,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="Exploding mind savings celebration"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Confetti Particles */}
        <circle cx="36" cy="30" r="4.5" fill="#10B981" />
        <circle cx="28" cy="48" r="3.5" fill="#3B82F6" />
        <circle cx="128" cy="28" r="4.5" fill="#6366F1" />
        <circle cx="138" cy="46" r="4" fill="#EC4899" />
        <circle cx="48" cy="18" r="3" fill="#F59E0B" />
        <circle cx="114" cy="16" r="3.5" fill="#10B981" />
        <circle cx="22" cy="74" r="3" fill="#EC4899" />
        <circle cx="140" cy="72" r="3" fill="#F59E0B" />

        {/* Explosive Blast Starburst */}
        <polygon
          points="80,10 94,32 118,22 114,46 136,52 120,70 138,88 116,92 118,112 96,104 80,122 64,104 42,112 44,92 22,88 40,70 24,52 46,46 42,22 66,32"
          fill="#FF4820"
        />

        {/* Outer Cloud of Steam / Mushroom Cloud */}
        <g filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.06))">
          <ellipse cx="80" cy="48" rx="34" ry="24" fill="#BCE0F5" />
          <ellipse cx="62" cy="46" rx="20" ry="18" fill="#D3EDFD" />
          <ellipse cx="98" cy="46" rx="20" ry="18" fill="#D3EDFD" />
          <ellipse cx="80" cy="38" rx="24" ry="18" fill="#E8F6FE" />
          {/* Cloud Stems */}
          <rect x="71" y="52" width="18" height="22" rx="4" fill="#88C7EC" />
          <rect x="74" y="54" width="12" height="18" rx="3" fill="#BCE0F5" />
        </g>

        {/* Emoji Lower Head Base (cut off at brow line) */}
        <path
          d="M 38 74 C 38 74 36 126 80 126 C 124 126 122 74 122 74 Z"
          fill="#FDB022"
        />
        {/* Soft Cheek Glows */}
        <ellipse cx="48" cy="94" rx="7" ry="5" fill="#F79009" opacity="0.35" />
        <ellipse cx="112" cy="94" rx="7" ry="5" fill="#F79009" opacity="0.35" />

        {/* White Eyeballs */}
        <ellipse cx="60" cy="80" rx="11" ry="11" fill="#FFFFFF" />
        <ellipse cx="100" cy="80" rx="11" ry="11" fill="#FFFFFF" />

        {/* Dark Pupils looking upwards */}
        <ellipse cx="60" cy="76" rx="6" ry="6" fill="#18181B" />
        <ellipse cx="100" cy="76" rx="6" ry="6" fill="#18181B" />

        {/* Eye Shine */}
        <circle cx="58" cy="74" r="2" fill="#FFFFFF" />
        <circle cx="98" cy="74" r="2" fill="#FFFFFF" />

        {/* Open Astonished Mouth */}
        <ellipse cx="80" cy="104" rx="8" ry="11" fill="#18181B" />
        <ellipse cx="80" cy="107" rx="5" ry="6" fill="#3F3F46" />
      </svg>
    </div>
  );
};
