import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeImage, FALLBACK_RECIPE_IMAGE } from '../components/common/RecipeImage.js';

describe('RecipeImage & Recipe Card Integrity Regression Suite', () => {
  it('renders recipe image with given src when valid', () => {
    render(
      <RecipeImage
        src="https://images.unsplash.com/photo-1546833999-b9f581a1996d"
        alt="Fragrant Red Lentil Dahl"
        className="w-20 h-20"
      />
    );

    const img = screen.getByRole('img', { name: /Fragrant Red Lentil Dahl/i });
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('https://images.unsplash.com/photo-1546833999-b9f581a1996d');
  });

  it('replaces broken or 404 image with FALLBACK_RECIPE_IMAGE when onError is triggered', () => {
    render(
      <RecipeImage
        src="https://images.unsplash.com/photo-broken-404-falafel-image"
        alt="Mediterranean Falafel Pitta Pockets"
        className="w-20 h-20"
      />
    );

    const img = screen.getByRole('img', { name: /Mediterranean Falafel Pitta Pockets/i });
    expect(img).toBeDefined();

    // Trigger onError
    fireEvent.error(img);

    // Should now display the inline SVG data URI fallback
    expect(img.getAttribute('src')).toBe(FALLBACK_RECIPE_IMAGE);
  });

  it('uses FALLBACK_RECIPE_IMAGE immediately if src is empty or undefined', () => {
    render(<RecipeImage src="" alt="Missing Image Recipe" />);

    const img = screen.getByRole('img', { name: /Missing Image Recipe/i });
    expect(img.getAttribute('src')).toBe(FALLBACK_RECIPE_IMAGE);
  });

  it('verifies that FALLBACK_RECIPE_IMAGE is a valid SVG data URI', () => {
    expect(FALLBACK_RECIPE_IMAGE.startsWith("data:image/svg+xml,")).toBe(true);
    expect(FALLBACK_RECIPE_IMAGE).toContain('%3Csvg');
    expect(FALLBACK_RECIPE_IMAGE).toContain('MISE RECIPE');
  });
});
