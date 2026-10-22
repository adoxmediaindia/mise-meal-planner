import { Response } from 'express';
import { z } from 'zod';
import { Preference } from '../models/Preference.js';
import { AuthRequest } from '../middleware/auth.js';
import { PlannerService } from '../services/plannerService.js';
import { ShoppingListService } from '../services/shoppingListService.js';

export const updatePreferenceSchema = z.object({
  supermarket: z.enum([
    'Aldi',
    'Walmart',
    'Kroger',
    'Costco',
    'Publix',
    'Safeway',
    'H-E-B',
    'Whole Foods',
    "Trader Joe's",
    'Food Lion',
    'Sprouts',
  ]).optional(),
  householdSize: z.number().min(1).max(12).optional(),
  cookingDays: z.array(z.string()).min(1).optional(),
  weeklyBudget: z.number().min(10).optional(),
  dietaryNeeds: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  vibes: z.array(z.string()).max(3, 'Select up to 3 vibes').optional(),
  autoRegenerate: z.boolean().optional(),
});

export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let pref = await Preference.findOne({ user: req.user?.id });
    if (!pref) {
      pref = await Preference.create({
        user: req.user?.id,
        supermarket: 'Aldi',
        householdSize: 2,
        cookingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        weeklyBudget: 40,
        dietaryNeeds: ['None'],
        allergies: [],
        equipment: ['Hob Only'],
        vibes: ['Speedy Meals', 'Family Favs'],
      });
    }
    res.json({ success: true, data: pref });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { autoRegenerate, ...updates } = req.body;

    let pref = await Preference.findOne({ user: req.user?.id });
    if (!pref) {
      pref = new Preference({ user: req.user?.id, ...updates });
    } else {
      Object.assign(pref, updates);
    }
    await pref.save();

    // If autoRegenerate is true or requested, regenerate plan and shopping list
    if (autoRegenerate) {
      const plan = await PlannerService.generateWeeklyPlan(req.user!.id, pref);
      await ShoppingListService.generateOrUpdateShoppingList(req.user!.id, plan._id.toString());
    }

    res.json({ success: true, data: pref, message: 'Preferences updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
