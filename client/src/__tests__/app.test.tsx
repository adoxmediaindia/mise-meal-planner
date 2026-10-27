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
import { Nav } from '../components/marketing/Nav.js';
import { StatsSection } from '../components/marketing/StatsSection.js';
import { ForgotPassword } from '../pages/auth/ForgotPassword.js';
import { Login } from '../pages/auth/Login.js';

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
    expect(screen.getByLabelText(/Download on the App Store/i)).toHaveAttribute('href', expect.stringContaining('apps.apple.com'));
    expect(screen.getByLabelText(/Get it on Google Play/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Get it on Google Play/i)).toHaveAttribute('href', expect.stringContaining('play.google.com'));
  });

  it('renders Nav with "Get the app" linking to /auth/login for unauthenticated users', () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Nav />
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    );

    const getAppLinks = screen.getAllByRole('link', { name: /Get the app/i });
    expect(getAppLinks.length).toBeGreaterThan(0);
    getAppLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/auth/login');
    });
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

  it('renders Login page with visible Forgot Password link', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    const forgotLink = screen.getByRole('link', { name: /Forgot password\?/i });
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password');
  });

  it('renders ForgotPassword page in recovery request mode', () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    expect(screen.getByText(/Reset your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Registered Email Address/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Send Recovery Instructions/i })
    ).toBeInTheDocument();
  });

  it('renders ForgotPassword page in token reset mode', () => {
    render(
      <BrowserRouter>
        <ForgotPassword defaultMode="reset" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Create new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reset Token/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Update Password/i })
    ).toBeInTheDocument();
  });
});
