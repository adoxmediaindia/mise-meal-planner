import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext.js';
import { AuthProvider } from '../context/AuthContext.js';
import { PlanProvider } from '../context/PlanContext.js';
import { AllergyBanner } from '../components/common/AllergyBanner.js';
import { Button } from '../components/common/Button.js';
import { StoreBadge } from '../components/common/StoreBadge.js';
import { StatsSection } from '../components/marketing/StatsSection.js';

describe('Mise Client UI Components', () => {
  it('renders AllergyBanner with mandatory safety notice', () => {
    render(
      <BrowserRouter>
        <AllergyBanner />
      </BrowserRouter>
    );

    expect(screen.getByText(/Important Allergy & Safety Disclaimer/i)).toBeInTheDocument();
    expect(screen.getByText(/mise is a meal-planning tool, not an allergen-safety certification service/i)).toBeInTheDocument();
  });

  it('renders Button component with primary style and text', () => {
    render(<Button>Get Started</Button>);
    const btn = screen.getByRole('button', { name: /Get Started/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('renders StoreBadge for Apple App Store and Google Play', () => {
    render(
      <LanguageProvider>
        <StoreBadge platform="apple" />
        <StoreBadge platform="google" />
      </LanguageProvider>
    );

    expect(screen.getByLabelText(/Download on the App Store/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Get it on Google Play/i)).toBeInTheDocument();
  });

  it('renders StatsSection with 4 metric cards', () => {
    render(
      <LanguageProvider>
        <StatsSection />
      </LanguageProvider>
    );

    expect(screen.getByText(/5 mins/i)).toBeInTheDocument();
    expect(screen.getByText(/Up to 7/i)).toBeInTheDocument();
    expect(screen.getByText(/1/i)).toBeInTheDocument();
    expect(screen.getByText(/typical weekly saving\*/i)).toBeInTheDocument();
  });
});
