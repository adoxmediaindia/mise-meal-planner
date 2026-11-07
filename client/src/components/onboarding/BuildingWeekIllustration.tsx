import React from 'react';

interface BuildingWeekIllustrationProps {
  className?: string;
  size?: number;
}

export const BuildingWeekIllustration: React.FC<BuildingWeekIllustrationProps> = ({
  className = '',
  size = 260,
}) => {
  // 9 food items placed equidistant around a circle
  const items = [
    { emoji: '🥑', angle: 0, label: 'Avocado', delay: '0s' },
    { emoji: '🍅', angle: 40, label: 'Tomatoes', delay: '0.2s' },
    { emoji: '🫑', angle: 80, label: 'Red Pepper', delay: '0.4s' },
    { emoji: '🍃', angle: 120, label: 'Spinach', delay: '0.6s' },
    { emoji: '🍆', angle: 160, label: 'Aubergine', delay: '0.8s' },
    { emoji: '🧄', angle: 200, label: 'Garlic', delay: '1.0s' },
    { emoji: '🌽', angle: 240, label: 'Corn', delay: '1.2s' },
    { emoji: '🥒', angle: 280, label: 'Cucumber', delay: '1.4s' },
    { emoji: '🍋', angle: 320, label: 'Lemon', delay: '1.6s' },
  ];

  const radius = size * 0.38;
  const center = size / 2;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Fresh ingredients building your weekly plan"
    >
      {/* Background Soft Glow Ring */}
      <div
        className="absolute rounded-full bg-gradient-to-tr from-[#9ed034]/10 via-[#8bc020]/5 to-transparent blur-xl pointer-events-none"
        style={{ width: size * 0.9, height: size * 0.9 }}
      />

      {/* Rotating / Orbiting Ring of Vegetables */}
      <div className="absolute inset-0 animate-[spin_24s_linear_infinite]">
        {items.map((item, idx) => {
          // Calculate (x, y) coordinates on circumference (0 deg is top: 12 o'clock)
          const rad = ((item.angle - 90) * Math.PI) / 180;
          const x = center + radius * Math.cos(rad);
          const y = center + radius * Math.sin(rad);

          return (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
              style={{
                left: `${x}px`,
                top: `${y}px`,
              }}
            >
              {/* Counter-rotate each emoji so it stays upright while orbiting */}
              <div
                className="w-10 h-10 rounded-full bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#f0f0eb] flex items-center justify-center text-xl sm:text-2xl animate-[spin_24s_linear_infinite_reverse]"
                title={item.label}
              >
                {item.emoji}
              </div>
            </div>
          );
        })}
      </div>

      {/* Central Meltto Brand Logo & Emblem */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none animate-pulse">
        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#f7f9f2] to-[#eef6dc] border-2 border-[#9ed034]/30 shadow-[0_6px_20px_rgba(158,208,52,0.22)] flex items-center justify-center mb-1">
          {/* Fresh Salad Bowl SVG */}
          <svg
            className="w-11 h-11"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Salad greens & carrot in bowl */}
            <path
              d="M20 28C18 20 28 14 34 20C40 14 48 20 44 28"
              fill="#9ED034"
              opacity="0.9"
            />
            <path
              d="M32 16L36 24L30 24Z"
              fill="#F97316"
            />
            <circle cx="26" cy="22" r="3" fill="#EF4444" />
            <circle cx="39" cy="23" r="3.5" fill="#EF4444" />
            {/* Ceramic Bowl */}
            <path
              d="M12 28C12 42 22 50 32 50C42 50 52 42 52 28H12Z"
              fill="#8BC020"
            />
            <ellipse cx="32" cy="28" rx="20" ry="4" fill="#9ED034" />
            <path
              d="M22 50C25 53 39 53 42 50"
              stroke="#6F9D13"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="text-xl font-black tracking-tight text-[#6f9d13] lowercase">
          meltto
        </span>
      </div>
    </div>
  );
};
