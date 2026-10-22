import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AllergyBannerProps {
  className?: string;
  compact?: boolean;
}

export const AllergyBanner: React.FC<AllergyBannerProps> = ({
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs ${className}`}
      >
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="leading-tight">
          <strong>Food Safety Notice:</strong> Always check packaging labels. Recipes are not guaranteed allergen-safe.{' '}
          <Link to="/terms" className="underline font-semibold hover:text-amber-950">
            Learn more
          </Link>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-sm ${className}`}
    >
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h4 className="font-bold text-amber-950 text-sm">Important Allergy &amp; Safety Disclaimer</h4>
        <p className="text-amber-800 leading-relaxed text-xs sm:text-sm">
          mise is a meal-planning tool, not an allergen-safety certification service. Recommendations may occasionally
          contain ingredients conflicting with entered preferences due to formulation changes. Always independently
          inspect actual product packaging and manufacturer warnings before preparation.{' '}
          <Link to="/terms" className="underline font-semibold hover:text-amber-950">
            Read Terms of Service (Section 4)
          </Link>.
        </p>
      </div>
    </div>
  );
};
