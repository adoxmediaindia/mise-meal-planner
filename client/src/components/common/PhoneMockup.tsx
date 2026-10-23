import React from 'react';
import clsx from 'clsx';

interface PhoneMockupProps {
  src?: string;
  alt?: string;
  children?: React.ReactNode;
  className?: string;
  floating?: boolean;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  src,
  alt = 'mise mobile screen',
  children,
  className,
  floating = false,
}) => {
  return (
    <div
      className={clsx(
        'phone',
        floating && 'phone--floating',
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="eager"
        />
      ) : (
        children
      )}
    </div>
  );
};
