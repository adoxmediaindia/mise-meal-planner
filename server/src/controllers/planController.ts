import { Response } from 'express';
import { z } from 'zod';
import { MealPlan } from '../models/MealPlan.js';
import { Preference } from '../models/Preference.js';
import { AuthRequest } from '../middleware/auth.js';
import { PlannerService } from '../services/plannerService.js';
import { ShoppingListService } from '../services/shoppingListService.js';
import { DayOfWeek } from '../types/index.js';

export const swapMealSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  targetRecipeId: z.string().optional(),
});

export const getCurrentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    let plan: any = await MealPlan.findOne({ user: userId }).populate('dinners.recipe');

    if (!plan) {
      let pref = await Preference.findOne({ user: userId });
      if (!pref) {
        pref = await Preference.create({
          user: userId,
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
      const createdPlan = await PlannerService.generateWeeklyPlan(userId, pref);
      await ShoppingListService.generateOrUpdateShoppingList(userId, (createdPlan._id as any).toString());
      plan = await MealPlan.findById(createdPlan._id).populate('dinners.recipe');
    }

    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const generatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    let pref = await Preference.findOne({ user: userId });
    if (!pref) {
      pref = await Preference.create({
        user: userId,
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

    const plan = await PlannerService.generateWeeklyPlan(userId, pref);
    await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());

    const populated = await MealPlan.findById(plan._id).populate('dinners.recipe');
    res.json({ success: true, data: populated, message: 'Plan regenerated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const swapMeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { day, targetRecipeId } = req.body;

    const updatedPlan = await PlannerService.swapMeal(
      userId,
      day as DayOfWeek,
      targetRecipeId
    );

    // Update shopping list to reflect the swapped recipe
    await ShoppingListService.generateOrUpdateShoppingList(userId, updatedPlan._id.toString());

    const populated = await MealPlan.findById(updatedPlan._id).populate('dinners.recipe');
    res.json({ success: true, data: populated, message: `Dinner for ${day} swapped!` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const toggleDinnerCooked = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { day } = req.params;

    const plan = await MealPlan.findOne({ user: userId });
    if (!plan) {
      res.status(404).json({ success: false, error: 'Meal plan not found' });
      return;
    }

    const slot = plan.dinners.find((d) => d.day === day);
    if (!slot) {
      res.status(404).json({ success: false, error: `Day ${day} not found in plan` });
      return;
    }

    slot.isCooked = !slot.isCooked;
    await plan.save();
    await plan.populate('dinners.recipe');

    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
