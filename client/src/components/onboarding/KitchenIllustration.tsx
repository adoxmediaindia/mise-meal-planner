import React from 'react';
import { Check } from 'lucide-react';

export type ApplianceId = 'Stovetop' | 'Oven' | 'Air Fryer' | 'Microwave';

interface KitchenIllustrationProps {
  selectedAppliances: ApplianceId[];
  onToggleAppliance: (appliance: ApplianceId) => void;
  className?: string;
}

export const KitchenIllustration: React.FC<KitchenIllustrationProps> = ({
  selectedAppliances,
  onToggleAppliance,
  className = '',
}) => {
  const isSelected = (app: ApplianceId) => selectedAppliances.includes(app);

  return (
    <div
      className={`relative w-full max-w-[420px] mx-auto aspect-square rounded-3xl overflow-hidden shadow-sm border border-[#EAEAE6] bg-[#FAF8F5] select-none ${className}`}
    >
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full object-cover"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Walls */}
        <rect width="400" height="400" fill="#EFE8DC" />

        {/* Window on right */}
        <rect x="310" y="40" width="80" height="200" fill="#FBFDFE" stroke="#DDD4C5" strokeWidth="4" />
        <line x1="310" y1="120" x2="390" y2="120" stroke="#DDD4C5" strokeWidth="2" />
        <rect x="300" y="30" width="100" height="15" fill="#E8DEC9" />

        {/* Backsplash Tiles (subtle grid) */}
        <g stroke="#E3D7C5" strokeWidth="1" opacity="0.6">
          <line x1="0" y1="140" x2="400" y2="140" />
          <line x1="0" y1="170" x2="400" y2="170" />
          <line x1="0" y1="200" x2="400" y2="200" />
          <line x1="0" y1="230" x2="400" y2="230" />
          <line x1="40" y1="140" x2="40" y2="230" />
          <line x1="90" y1="140" x2="90" y2="230" />
          <line x1="140" y1="140" x2="140" y2="230" />
          <line x1="190" y1="140" x2="190" y2="230" />
          <line x1="240" y1="140" x2="240" y2="230" />
          <line x1="290" y1="140" x2="290" y2="230" />
        </g>

        {/* Wooden Floor */}
        <polygon points="0,320 400,320 400,400 0,400" fill="#CBA074" />
        <line x1="0" y1="360" x2="400" y2="360" stroke="#B88A58" strokeWidth="2" />
        <line x1="90" y1="320" x2="60" y2="400" stroke="#B88A58" strokeWidth="1.5" />
        <line x1="210" y1="320" x2="190" y2="400" stroke="#B88A58" strokeWidth="1.5" />
        <line x1="330" y1="320" x2="320" y2="400" stroke="#B88A58" strokeWidth="1.5" />

        {/* Left Upper Cabinet */}
        <polygon points="20,20 140,25 140,160 20,165" fill="#F1ECE1" stroke="#D3C7B2" strokeWidth="2" />
        <line x1="80" y1="23" x2="80" y2="162" stroke="#D3C7B2" strokeWidth="2" />

        {/* Open Wood Shelf */}
        <rect x="145" y="85" width="120" height="10" rx="2" fill="#B48252" />
        {/* Small Glass Jars on Shelf */}
        <rect x="155" y="70" width="12" height="15" rx="2" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
        <rect x="175" y="66" width="14" height="19" rx="2" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
        <rect x="198" y="72" width="10" height="13" rx="2" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />

        {/* Lower Countertops & Cabinets */}
        {/* Left Counter Base */}
        <polygon points="0,230 150,225 145,340 0,335" fill="#E8DEC9" stroke="#CFC2A8" strokeWidth="2" />
        {/* Right Counter Base */}
        <polygon points="260,225 400,230 400,340 265,340" fill="#E8DEC9" stroke="#CFC2A8" strokeWidth="2" />

        {/* Counter Top Surface */}
        <polygon points="0,215 155,210 150,230 0,235" fill="#FAF6EE" stroke="#DDD2BE" strokeWidth="2" />
        <polygon points="255,210 400,215 400,235 260,230" fill="#FAF6EE" stroke="#DDD2BE" strokeWidth="2" />
        {/* Corner Counter Bridge */}
        <polygon points="150,210 260,210 265,230 145,230" fill="#F4EFE5" stroke="#DDD2BE" strokeWidth="1" />

        {/* Sink Basin on Right Counter */}
        <ellipse cx="360" cy="226" rx="28" ry="8" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />

        {/* ======================================================= */}
        {/* APPLIANCE 1: MICROWAVE (Left Counter)                  */}
        {/* ======================================================= */}
        <g id="microwave-group" className="cursor-pointer" onClick={() => onToggleAppliance('Microwave')}>
          {/* Main Body */}
          <rect x="25" y="165" width="85" height="52" rx="4" fill="#27272A" stroke={isSelected('Microwave') ? '#9ED034' : '#52525B'} strokeWidth={isSelected('Microwave') ? '3' : '1.5'} />
          {/* Glass Door */}
          <rect x="30" y="171" width="55" height="40" rx="3" fill="#09090B" />
          <rect x="34" y="175" width="47" height="32" rx="2" fill="#18181B" opacity="0.8" />
          {/* Door Handle */}
          <rect x="80" y="176" width="3" height="30" rx="1.5" fill="#71717A" />
          {/* Control Panel */}
          <rect x="90" y="172" width="15" height="10" rx="1" fill="#000000" />
          <text x="92" y="180" fill="#22C55E" fontSize="6" fontFamily="monospace">12:00</text>
          <circle cx="97" cy="190" r="3" fill="#52525B" />
          <circle cx="97" cy="200" r="3" fill="#52525B" />
        </g>

        {/* ======================================================= */}
        {/* APPLIANCE 2: STOVETOP / HOB (Center Counter Top)       */}
        {/* ======================================================= */}
        <g id="stovetop-group" className="cursor-pointer" onClick={() => onToggleAppliance('Stovetop')}>
          {/* Metal Stovetop Base */}
          <rect x="160" y="196" width="90" height="15" rx="3" fill="#D4D4D8" stroke={isSelected('Stovetop') ? '#9ED034' : '#71717A'} strokeWidth={isSelected('Stovetop') ? '3' : '1.5'} />
          {/* Gas Burner Left */}
          <circle cx="182" cy="203" r="5.5" fill="#18181B" />
          <circle cx="182" cy="203" r="3" fill="#71717A" />
          <line x1="174" y1="203" x2="190" y2="203" stroke="#27272A" strokeWidth="1.5" />
          <line x1="182" y1="197" x2="182" y2="209" stroke="#27272A" strokeWidth="1.5" />
          {/* Gas Burner Right */}
          <circle cx="228" cy="203" r="5.5" fill="#18181B" />
          <circle cx="228" cy="203" r="3" fill="#71717A" />
          <line x1="220" y1="203" x2="236" y2="203" stroke="#27272A" strokeWidth="1.5" />
          <line x1="228" y1="197" x2="228" y2="209" stroke="#27272A" strokeWidth="1.5" />
        </g>

        {/* ======================================================= */}
        {/* APPLIANCE 3: OVEN (Center Lower Corner)                 */}
        {/* ======================================================= */}
        <g id="oven-group" className="cursor-pointer" onClick={() => onToggleAppliance('Oven')}>
          {/* Main Oven Chassis */}
          <rect x="155" y="214" width="100" height="96" rx="5" fill="#E4E4E7" stroke={isSelected('Oven') ? '#9ED034' : '#71717A'} strokeWidth={isSelected('Oven') ? '3' : '1.5'} />
          {/* Control Dials Row */}
          <rect x="158" y="216" width="94" height="14" fill="#D4D4D8" />
          <circle cx="168" cy="223" r="3" fill="#52525B" />
          <rect x="194" y="219" width="22" height="8" rx="1" fill="#18181B" />
          <text x="199" y="225" fill="#EF4444" fontSize="5" fontFamily="monospace">180°</text>
          <circle cx="230" cy="223" r="3" fill="#52525B" />
          <circle cx="242" cy="223" r="3" fill="#52525B" />
          {/* Oven Handle */}
          <rect x="170" y="233" width="70" height="3.5" rx="1.5" fill="#71717A" />
          {/* Oven Window (Glowing warm interior) */}
          <rect x="166" y="240" width="78" height="62" rx="4" fill="#27272A" />
          <rect x="170" y="244" width="70" height="54" rx="2" fill="#7C2D12" opacity="0.85" />
          {/* Wire Rack Grate */}
          <line x1="172" y1="270" x2="238" y2="270" stroke="#FDBA74" strokeWidth="1.5" opacity="0.8" />
          <line x1="172" y1="285" x2="238" y2="285" stroke="#FDBA74" strokeWidth="1.5" opacity="0.8" />
          {/* Bottom Kickplate */}
          <rect x="158" y="306" width="94" height="4" fill="#3F3F46" />
        </g>

        {/* ======================================================= */}
        {/* APPLIANCE 4: AIR FRYER (Right Counter)                 */}
        {/* ======================================================= */}
        <g id="airfryer-group" className="cursor-pointer" onClick={() => onToggleAppliance('Air Fryer')}>
          {/* Main Air Fryer Silhouette */}
          <path
            d="M 285 178 C 285 166 295 160 315 160 C 335 160 345 166 345 178 L 345 220 C 345 225 340 228 335 228 L 295 228 C 290 228 285 225 285 220 Z"
            fill="#18181B"
            stroke={isSelected('Air Fryer') ? '#9ED034' : '#3F3F46'}
            strokeWidth={isSelected('Air Fryer') ? '3' : '1.5'}
          />
          {/* Digital Screen at Top */}
          <ellipse cx="315" cy="176" rx="16" ry="8" fill="#09090B" />
          <circle cx="310" cy="176" r="1.5" fill="#22C55E" />
          <circle cx="320" cy="176" r="1.5" fill="#22C55E" />
          {/* Pull-out Basket Seam */}
          <line x1="287" y1="192" x2="343" y2="192" stroke="#3F3F46" strokeWidth="1.5" />
          {/* Basket Handle */}
          <rect x="311" y="196" width="8" height="22" rx="3" fill="#3F3F46" />
          <rect x="313" y="198" width="4" height="18" rx="1" fill="#52525B" />
        </g>
      </svg>

      {/* Floating Interactive Badges over Appliances */}
      {/* 1. Microwave Badge */}
      <button
        type="button"
        data-testid="appliance-badge-Microwave"
        onClick={() => onToggleAppliance('Microwave')}
        className={`absolute top-[28%] left-[7%] px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer ${
          isSelected('Microwave')
            ? 'bg-[#9ED034] text-[#1a1a1a] scale-105 ring-2 ring-white'
            : 'bg-white/95 text-[#6b6b6b] hover:bg-white'
        }`}
      >
        {isSelected('Microwave') && <Check className="w-3 h-3 stroke-[3]" />}
        Microwave
      </button>

      {/* 2. Stovetop Badge */}
      <button
        type="button"
        data-testid="appliance-badge-Stovetop"
        onClick={() => onToggleAppliance('Stovetop')}
        className={`absolute top-[41%] left-[34%] px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer ${
          isSelected('Stovetop')
            ? 'bg-[#9ED034] text-[#1a1a1a] scale-105 ring-2 ring-white'
            : 'bg-white/95 text-[#6b6b6b] hover:bg-white'
        }`}
      >
        {isSelected('Stovetop') && <Check className="w-3 h-3 stroke-[3]" />}
        Stovetop
      </button>

      {/* 3. Oven Badge */}
      <button
        type="button"
        data-testid="appliance-badge-Oven"
        onClick={() => onToggleAppliance('Oven')}
        className={`absolute top-[69%] left-[37%] px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer ${
          isSelected('Oven')
            ? 'bg-[#9ED034] text-[#1a1a1a] scale-105 ring-2 ring-white'
            : 'bg-white/95 text-[#6b6b6b] hover:bg-white'
        }`}
      >
        {isSelected('Oven') && <Check className="w-3 h-3 stroke-[3]" />}
        Oven
      </button>

      {/* 4. Air Fryer Badge */}
      <button
        type="button"
        data-testid="appliance-badge-Air Fryer"
        onClick={() => onToggleAppliance('Air Fryer')}
        className={`absolute top-[32%] right-[8%] px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer ${
          isSelected('Air Fryer')
            ? 'bg-[#9ED034] text-[#1a1a1a] scale-105 ring-2 ring-white'
            : 'bg-white/95 text-[#6b6b6b] hover:bg-white'
        }`}
      >
        {isSelected('Air Fryer') && <Check className="w-3 h-3 stroke-[3]" />}
        Air Fryer
      </button>
    </div>
  );
};
