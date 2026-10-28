import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Pantry } from '../pages/app/Pantry.js';
import { api, toQueryString } from '../services/api.js';

// Mock API
vi.mock('../services/api.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/api.js')>();
  return {
    ...actual,
    api: {
      ...actual.api,
      getPantryItems: vi.fn().mockResolvedValue({
        success: true,
        count: 2,
        data: [
          {
            _id: 'item-1',
            name: 'Olive Oil',
            quantity: 250,
            unit: 'ml',
            category: 'Pantry & Grains',
            expiryDate: new Date(Date.now() + 86400000 * 10).toISOString(),
            isExpired: false,
            isExpiringSoon: false,
            daysUntilExpiry: 10,
          },
          {
            _id: 'item-2',
            name: 'Greek Yogurt',
            quantity: 200,
            unit: 'g',
            category: 'Dairy & Refrigerated',
            expiryDate: new Date(Date.now() + 86400000 * 1).toISOString(),
            isExpired: false,
            isExpiringSoon: true,
            daysUntilExpiry: 1,
          },
        ],
      }),
      getPantryRecipeSuggestions: vi.fn().mockResolvedValue({
        success: true,
        count: 1,
        data: [
          {
            recipe: {
              _id: 'rec-1',
              title: 'Garlic Yogurt Pasta',
              slug: 'garlic-yogurt-pasta',
              image: '/images/pasta.jpg',
              prepTimeMinutes: 10,
              cookTimeMinutes: 15,
              servings: 2,
              cuisine: 'Mediterranean',
            },
            matchPercentage: 67,
            canCookFully: false,
            availableIngredients: [
              { name: 'Greek Yogurt', quantity: 150, unit: 'g', pantryQuantity: 200, pantryUnit: 'g' },
              { name: 'Olive Oil', quantity: 15, unit: 'ml', pantryQuantity: 250, pantryUnit: 'ml' },
            ],
            missingIngredients: [
              { name: 'Spaghetti', quantity: 200, unit: 'g', deficitQuantity: 200, aisle: 'Pantry & Grains', estimatedCost: 1.2 },
            ],
          },
        ],
      }),
      addPantryItem: vi.fn().mockResolvedValue({
        success: true,
        data: { _id: 'item-new', name: 'Honey', quantity: 1, unit: '', category: 'Pantry & Grains' },
        message: 'Item added',
      }),
      deletePantryItem: vi.fn().mockResolvedValue({ success: true, message: 'Item deleted' }),
      consumePantryItem: vi.fn().mockResolvedValue({ success: true, data: {}, message: 'Quantity adjusted' }),
      addMissingIngredientsToGrocery: vi.fn().mockResolvedValue({ success: true, data: { addedCount: 1 }, message: 'Added 1 missing ingredient' }),
    },
  };
});

describe('Pantry Web UI Component', () => {
  it('renders pantry inventory list with items and expiry badge', async () => {
    render(
      <BrowserRouter>
        <Pantry />
      </BrowserRouter>
    );

    expect(screen.getByText(/kitchen pantry/i)).toBeInTheDocument();
    expect(screen.getByText(/My Inventory/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Olive Oil')).toBeInTheDocument();
      expect(screen.getByText('Greek Yogurt')).toBeInTheDocument();
      expect(screen.getByText(/Expires in 1d/i)).toBeInTheDocument();
    });
  });

  it('switches to Cook with Pantry suggestions tab', async () => {
    render(
      <BrowserRouter>
        <Pantry />
      </BrowserRouter>
    );

    const suggestionsTab = screen.getByText(/Cook with Pantry/i);
    fireEvent.click(suggestionsTab);

    await waitFor(() => {
      expect(screen.getByText('Garlic Yogurt Pasta')).toBeInTheDocument();
      expect(screen.getByText('67% Match')).toBeInTheDocument();
      expect(screen.getByText(/Add 1 Missing to Grocery/i)).toBeInTheDocument();
    });
  });

  it('opens Add Pantry Item modal when clicking Add Item', async () => {
    render(
      <BrowserRouter>
        <Pantry />
      </BrowserRouter>
    );

    const addBtn = screen.getByRole('button', { name: /Add Item/i });
    fireEvent.click(addBtn);

    expect(screen.getByPlaceholderText(/e\.g\., Olive Oil, Brown Rice, Eggs/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add to Pantry/i })).toBeInTheDocument();
  });

  it('submits Add Pantry Item modal without unit and triggers inventory refresh', async () => {
    render(
      <BrowserRouter>
        <Pantry />
      </BrowserRouter>
    );

    const addBtn = screen.getByRole('button', { name: /Add Item/i });
    fireEvent.click(addBtn);

    const nameInput = screen.getByPlaceholderText(/e\.g\., Olive Oil, Brown Rice, Eggs/i);
    const unitInput = screen.getByPlaceholderText(/e\.g\. g, ml, cup, can/i);
    const submitBtn = screen.getByRole('button', { name: /Add to Pantry/i });

    fireEvent.change(nameInput, { target: { value: 'Honey' } });
    // Leave unitInput blank
    expect(unitInput).toHaveValue('');

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.addPantryItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Honey',
          quantity: 1,
          unit: '',
        })
      );
      expect(screen.queryByPlaceholderText(/e\.g\., Olive Oil, Brown Rice, Eggs/i)).not.toBeInTheDocument();
    });
  });

  it('displays itemsError banner with Retry button when inventory fetch fails', async () => {
    vi.mocked(api.getPantryItems).mockRejectedValue(new Error('Network error or unauthenticated'));

    render(
      <BrowserRouter>
        <Pantry />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Network error or unauthenticated/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /^Retry$/i })).toBeInTheDocument();
      expect(screen.getByText(/Unable to load pantry items/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry Loading Inventory/i })).toBeInTheDocument();
    });

    vi.mocked(api.getPantryItems).mockReset();
    vi.mocked(api.getPantryItems).mockResolvedValue({
      success: true,
      count: 1,
      data: [
        {
          _id: 'item-1',
          name: 'Olive Oil',
          quantity: 250,
          unit: 'ml',
          category: 'Pantry & Grains',
          expiryDate: new Date(Date.now() + 86400000 * 10).toISOString(),
          isExpired: false,
          isExpiringSoon: false,
          daysUntilExpiry: 10,
        },
      ],
    });
  });

  it('toQueryString properly serializes query parameters and strips undefined/null/empty', () => {
    expect(toQueryString()).toBe('');
    expect(toQueryString({})).toBe('');
    expect(toQueryString({ search: undefined, category: undefined, status: undefined })).toBe('');
    expect(toQueryString({ search: '', category: 'all', status: null })).toBe('?category=all');
    expect(toQueryString({ search: 'apples', category: 'Fresh Produce' })).toBe('?search=apples&category=Fresh+Produce');
    expect(toQueryString({ search: 'undefined', category: 'null' })).toBe('');
  });
});
