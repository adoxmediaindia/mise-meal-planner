import React, { useState, useEffect } from 'react';

export const FALLBACK_RECIPE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' fill='%23F4F4F5'%3E%3Crect width='400' height='300' fill='%23F4F4F5'/%3E%3Ccircle cx='200' cy='135' r='45' fill='%23E4E4E7' stroke='%23D4D4D8' stroke-width='3'/%3E%3Ccircle cx='200' cy='135' r='30' fill='%23F4F4F5' stroke='%23D4D4D8' stroke-width='2' stroke-dasharray='4 3'/%3E%3Ctext x='50%25' y='220' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, -apple-system, sans-serif' font-size='13' font-weight='700' fill='%23A1A1AA'%3EMISE RECIPE%3C/text%3E%3C/svg%3E";

interface RecipeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export const RecipeImage: React.FC<RecipeImageProps> = ({
  src,
  alt = 'Recipe',
  className = '',
  fallbackSrc = FALLBACK_RECIPE_IMAGE,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImgSrc(fallbackSrc);
        }
      }}
      {...props}
    />
  );
};
