import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { PantryService } from '../services/pantryService.js';
import { PantryRecipeService } from '../services/pantryRecipeService.js';
import { EntitlementService, EntitlementError } from '../services/entitlementService.js';

export const addPantryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v || '').trim()),
  category: z
    .enum([
      'Fresh Produce',
      'Meat & Seafood',
      'Dairy & Refrigerated',
      'Bakery',
      'Pantry & Grains',
      'Spices & Condiments',
      'Frozen',
    ])
    .optional(),
  expiryDate: z.string().datetime().optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional().nullable()),
  icon: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePantryItemSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().min(0.01).optional(),
  unit: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? undefined : (v || '').trim())),
  category: z
    .enum([
      'Fresh Produce',
      'Meat & Seafood',
      'Dairy & Refrigerated',
      'Bakery',
      'Pantry & Grains',
      'Spices & Condiments',
      'Frozen',
    ])
    .optional(),
  expiryDate: z.string().optional().nullable(),
  icon: z.string().optional(),
  notes: z.string().optional(),
});

export const consumePantryItemSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
});

const sanitizeQueryParam = (val: unknown): string | undefined => {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined;
  return trimmed;
};

export const getPantryItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const search = sanitizeQueryParam(req.query.search);
    const category = sanitizeQueryParam(req.query.category);
    const rawStatus = sanitizeQueryParam(req.query.status);
    const status = (rawStatus as any) || 'all';

    const items = await PantryService.getPantryItems(userId, {
      search,
      category,
      status,
    });

    res.json({ success: true, count: items.length, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addPantryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await EntitlementService.assertCanAddPantryItem(userId);
    const item = await PantryService.addPantryItem(userId, req.body);
    res.status(201).json({ success: true, data: item, message: `Added ${item.name} to pantry.` });
  } catch (err: any) {
    if (err instanceof EntitlementError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        feature: err.feature,
        limit: err.limit,
        current: err.current,
      });
      return;
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

export const updatePantryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const item = await PantryService.updatePantryItem(userId, id, req.body);
    res.json({ success: true, data: item, message: 'Pantry item updated.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const deletePantryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await PantryService.deletePantryItem(userId, id);
    res.json({ success: true, message: 'Pantry item deleted.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const consumePantryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount } = req.body;
    const result = await PantryService.consumeQuantity(userId, id, amount);
    res.json({ success: true, data: result, message: 'Pantry quantity adjusted.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getPantryRecipeSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { maxMissing, cuisine, dietary, limit } = req.query;

    const matches = await PantryRecipeService.suggestRecipes(userId, {
      maxMissing: maxMissing !== undefined ? parseInt(maxMissing as string, 10) : undefined,
      cuisine: typeof cuisine === 'string' ? cuisine : undefined,
      dietary: typeof dietary === 'string' ? dietary : undefined,
      limit: limit !== undefined ? parseInt(limit as string, 10) : 30,
    });

    res.json({ success: true, count: matches.length, data: matches });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addMissingIngredientsToGrocery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { recipeId } = req.params;

    const result = await PantryRecipeService.addMissingIngredientsToGrocery(userId, recipeId);
    res.json({
      success: true,
      data: result,
      message: `Added ${result.addedCount} missing ingredients to your grocery list.`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};
