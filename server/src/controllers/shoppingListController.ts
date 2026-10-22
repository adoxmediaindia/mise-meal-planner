import { Response } from 'express';
import { ShoppingList } from '../models/ShoppingList.js';
import { MealPlan } from '../models/MealPlan.js';
import { AuthRequest } from '../middleware/auth.js';
import { ShoppingListService } from '../services/shoppingListService.js';

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

    const updatedList = await ShoppingListService.toggleItem(userId, itemId);
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
