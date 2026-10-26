import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Pantry } from '../pages/app/Pantry.js';
import { api } from '../services/api.js';

// Mock API
vi.mock('../services/api.js', () => ({
  api: {
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
    addPantryItem: vi.fn().mockResolvedValue({ success: true, data: {}, message: 'Item added' }),
    deletePantryItem: vi.fn().mockResolvedValue({ success: true, message: 'Item deleted' }),
    consumePantryItem: vi.fn().mockResolvedValue({ success: true, data: {}, message: 'Quantity adjusted' }),
    addMissingIngredientsToGrocery: vi.fn().mockResolvedValue({ success: true, data: { addedCount: 1 }, message: 'Added 1 missing ingredient' }),
  },
}));

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
});
