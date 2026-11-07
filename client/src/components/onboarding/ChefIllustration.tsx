import React from 'react';

interface ChefIllustrationProps {
  className?: string;
}

export const ChefIllustration: React.FC<ChefIllustrationProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center py-2 ${className}`}>
      <img
        src="/assets/chef-illustration.png"
        alt="Meltto Chef"
        className="w-48 sm:w-56 h-auto object-contain drop-shadow-sm select-none"
      />
    </div>
  );
};
