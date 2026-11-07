import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboard } from '../pages/admin/AdminDashboard.js';
import { Settings } from '../pages/app/Settings.js';
import * as authContext from '../context/AuthContext.js';

vi.mock('../context/PlanContext.js', () => ({
  usePlan: () => ({
    plan: null,
    shoppingList: null,
    preferences: null,
    planHistory: [],
    isLoading: false,
    error: null,
    refreshAll: vi.fn(),
  }),
}));

vi.mock('../services/api.js', () => ({
  api: {
    getAdminMetrics: vi.fn().mockResolvedValue({
      success: true,
      data: {
        users: { total: 42, free: 35, pro: 7, conversionRate: 17 },
        subscriptions: { activePaid: 7, monthly: 5, yearly: 2, estimatedMRR: 33.28, totalInvoicesPaid: 12 },
        system: { totalRecipes: 24, totalMealPlans: 80, totalPantryItems: 110, totalHouseholds: 15 },
      },
    }),
    getAdminUsers: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'u-1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          role: 'user',
          subscriptionTier: 'free',
          subscriptionStatus: 'trial',
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: { page: 1, limit: 15, total: 1, totalPages: 1 },
    }),
    getAdminRecipes: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'r-1',
          title: 'Lemon Herb Chicken',
          cuisine: 'Mediterranean',
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          servings: 2,
          calories: 480,
          description: 'Juicy skillet chicken breast with lemon and herbs.',
        },
      ],
      pagination: { page: 1, limit: 15, total: 1, totalPages: 1 },
    }),
    getSubscriptionStatus: vi.fn().mockResolvedValue({
      success: true,
      data: {
        tier: 'free',
        status: 'trial',
        price: 'Free Starter',
        billingCycle: 'monthly',
        planDetails: { name: 'Meltto Starter', description: 'Free tier', features: ['3 plans/week'] },
        usage: {
          tier: 'free',
          status: 'trial',
          pantry: { count: 8, limit: 15, isLimitReached: false },
          weeklyGenerations: { count: 1, limit: 3, isLimitReached: false, resetsInDays: 7 },
          household: { membersCount: 1, limit: 2, isLimitReached: false },
          customGroceryItems: { count: 3, limit: 15 },
        },
      },
    }),
    getInvoices: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'inv-1',
          invoiceNumber: 'INV-2026-1001',
          amount: 4.99,
          currency: 'usd',
          status: 'paid',
          planName: 'Meltto Pro Monthly',
          paidAt: new Date().toISOString(),
        },
      ],
    }),
    getMyHousehold: vi.fn().mockResolvedValue({ success: true, data: null }),
    getPendingHouseholdInvitations: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

describe('Admin Dashboard & Subscription UI Suite', () => {
  it('denies access to non-admin users with clear Access Denied notice', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'u-reg',
        name: 'Regular Cook',
        email: 'regular@example.com',
        role: 'user',
        subscriptionTier: 'free',
        subscriptionStatus: 'trial',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      toggleFavoriteInState: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    expect(screen.getByText(/Administrator privileges are required/i)).toBeInTheDocument();
  });

  it('renders Administration Dashboard for admin users with metrics and tabs', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'u-admin',
        name: 'Super Admin',
        email: 'admin@meltto.com',
        role: 'admin',
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      toggleFavoriteInState: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Administration Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Console/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Est. MRR')).toBeInTheDocument();
      expect(screen.getByText('$33.28')).toBeInTheDocument();
      expect(screen.getByText('Active Recipes')).toBeInTheDocument();
    });
  });

  it('renders Subscription Settings with live entitlement meters and billing options', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'u-reg',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user',
        subscriptionTier: 'free',
        subscriptionStatus: 'trial',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      toggleFavoriteInState: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Subscription & Plans/i)).toBeInTheDocument();
      expect(screen.getByText(/Your Resource Entitlements/i)).toBeInTheDocument();
      expect(screen.getByText(/Weekly Plan Generations/i)).toBeInTheDocument();
      expect(screen.getByText(/Pantry Staples Tracked/i)).toBeInTheDocument();
      expect(screen.getByText(/Upgrade to (Meltto|Mise) Pro/i)).toBeInTheDocument();
    });
  });

  it('Bug 1 Regression: safely renders Settings when user has no household (household is null)', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'u-reg',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user',
        subscriptionTier: 'free',
        subscriptionStatus: 'trial',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      toggleFavoriteInState: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    // Verify Settings card renders without any uncaught TypeError
    expect(screen.getByText(/Household & Sharing/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Create a shared household to plan meals, manage pantry staples, and shop for groceries together/i)
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\., The Miller Family/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Create$/i })).toBeInTheDocument();
    });
  });

  it('Bug 1 Regression: safely renders Settings when household has empty members or unpopulated user objects', async () => {
    const { api } = await import('../services/api.js');
    vi.mocked(api.getMyHousehold).mockResolvedValueOnce({
      success: true,
      data: {
        _id: 'hh-100',
        name: 'The Test Family',
        owner: { id: 'u-reg', name: 'Jane Doe', email: 'jane@example.com' } as any,
        members: [
          { user: { id: 'u-reg', name: 'Jane Doe', email: 'jane@example.com' } as any, role: 'owner' as const, joinedAt: new Date().toISOString() },
          { user: undefined as any, role: 'member' as const, joinedAt: new Date().toISOString() },
        ],
        inviteCode: 'TEST100',
      } as any,
    });

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'u-reg',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user',
        subscriptionTier: 'free',
        subscriptionStatus: 'trial',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      toggleFavoriteInState: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('The Test Family')).toBeInTheDocument();
      expect(screen.getByText(/Members \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText('OWNER')).toBeInTheDocument();
    });
  });
});
