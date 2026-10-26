import { Response } from 'express';
import { z } from 'zod';
import { ShoppingList } from '../models/ShoppingList.js';
import { MealPlan } from '../models/MealPlan.js';
import { AuthRequest } from '../middleware/auth.js';
import { ShoppingListService } from '../services/shoppingListService.js';
import { EntitlementService, EntitlementError } from '../services/entitlementService.js';

export const addCustomItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  totalQuantity: z.number().min(0.01).default(1),
  unit: z.string().optional().default(''),
  aisle: z.enum([
    'Fresh Produce',
    'Meat & Seafood',
    'Dairy & Refrigerated',
    'Bakery',
    'Pantry & Grains',
    'Spices & Condiments',
    'Frozen',
  ]).optional(),
  estimatedCost: z.number().min(0).optional(),
  icon: z.string().optional(),
  clientMutationId: z.string().optional(),
});

export const editItemSchema = z.object({
  name: z.string().min(1).optional(),
  totalQuantity: z.number().min(0.01).optional(),
  unit: z.string().optional(),
  aisle: z.enum([
    'Fresh Produce',
    'Meat & Seafood',
    'Dairy & Refrigerated',
    'Bakery',
    'Pantry & Grains',
    'Spices & Condiments',
    'Frozen',
  ]).optional(),
  estimatedCost: z.number().min(0).optional(),
  isBought: z.boolean().optional(),
  icon: z.string().optional(),
});

export const getShoppingList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    let list: any = await ShoppingList.findOne({ user: userId });

    if (!list) {
      const plan = await MealPlan.findOne({ user: userId });
      if (plan) {
        list = await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());
      }
    }

    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const toggleItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const { isBought } = req.body || {};

    const updatedList = await ShoppingListService.toggleItem(userId, itemId, isBought);
    res.json({ success: true, data: updatedList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const resetList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updatedList = await ShoppingListService.resetItems(userId);
    res.json({ success: true, data: updatedList, message: 'All items marked as unbought' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addCustomItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await EntitlementService.assertCanAddCustomShoppingItem(userId);
    const updatedList = await ShoppingListService.addCustomItem(userId, req.body);
    res.status(201).json({
      success: true,
      data: updatedList,
      message: `Added "${req.body.name}" to grocery list`,
    });
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

export const editItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const updatedList = await ShoppingListService.editItem(userId, itemId, req.body);
    res.json({
      success: true,
      data: updatedList,
      message: 'Item updated successfully',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const updatedList = await ShoppingListService.deleteItem(userId, itemId);
    res.json({
      success: true,
      data: updatedList,
      message: 'Item removed from grocery list',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};
