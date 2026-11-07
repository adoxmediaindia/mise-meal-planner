import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-[4.5px] w-full bg-[#e8e8e3] rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-[#9ed034] rounded-full transition-all duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
