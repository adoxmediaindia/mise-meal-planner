import { Response } from 'express';
import { z } from 'zod';
import { MealPlan } from '../models/MealPlan.js';
import { Preference } from '../models/Preference.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { PlannerService, NoRecipesFoundError } from '../services/plannerService.js';
import { ShoppingListService } from '../services/shoppingListService.js';
import { EntitlementService, EntitlementError } from '../services/entitlementService.js';
import { DayOfWeek } from '../types/index.js';

export const swapMealSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  targetRecipeId: z.string().optional(),
});

export const addMealSlotSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  recipeId: z.string().min(1),
  servings: z.number().int().min(1).max(12).optional(),
});

export const editMealSlotSchema = z.object({
  servings: z.number().int().min(1).max(12).optional(),
  isCooked: z.boolean().optional(),
  recipeId: z.string().optional(),
});

export const updateHouseholdSizeSchema = z.object({
  householdSize: z.number().int().min(1).max(12),
});

export const getCurrentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    let plan: any = await MealPlan.findOne({ user: userId })
      .populate('dinners.recipe')
      .populate('meals.recipe');

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
      try {
        const createdPlan = await PlannerService.generateWeeklyPlan(userId, pref);
        await ShoppingListService.generateOrUpdateShoppingList(userId, (createdPlan._id as any).toString());
        plan = await MealPlan.findById(createdPlan._id)
          .populate('dinners.recipe')
          .populate('meals.recipe');
      } catch (genErr) {
        // If initial plan generation cannot be completed (e.g. no recipes found or catalog empty),
        // gracefully return data: null so the user can configure preferences in Onboarding without a 500 error.
        console.warn(`[getCurrentPlan] Initial plan generation deferred: ${(genErr as Error).message}`);
        res.json({ success: true, data: null });
        return;
      }
    }

    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const generatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await EntitlementService.assertCanGeneratePlan(userId);

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

    await User.findByIdAndUpdate(userId, {
      $inc: { planGenerationsThisWeek: 1 },
      $set: { lastPlanGenerationAt: new Date() },
    });

    const populated = await MealPlan.findById(plan._id)
      .populate('dinners.recipe')
      .populate('meals.recipe');
    res.json({ success: true, data: populated, message: 'Plan regenerated successfully' });
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
    if (err instanceof NoRecipesFoundError || err.code === 'NO_RECIPES_FOUND') {
      res.status(422).json({
        success: false,
        error: err.message,
        code: 'NO_RECIPES_FOUND',
      });
      return;
    }
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

    const populated = await MealPlan.findById(updatedPlan._id)
      .populate('dinners.recipe')
      .populate('meals.recipe');
    res.json({ success: true, data: populated, message: `Dinner for ${day} swapped!` });
  } catch (err: any) {
    if (err instanceof NoRecipesFoundError || err.code === 'NO_RECIPES_FOUND') {
      res.status(422).json({
        success: false,
        error: err.message,
        code: 'NO_RECIPES_FOUND',
      });
      return;
    }
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
    if (plan.meals) {
      const mealSlot = plan.meals.find((m) => m.day === day && m.mealType === 'dinner');
      if (mealSlot) mealSlot.isCooked = slot.isCooked;
    }

    await plan.save();
    await plan.populate('dinners.recipe');
    await plan.populate('meals.recipe');

    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addMealSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { day, mealType, recipeId, servings } = req.body;

    const updatedPlan = await PlannerService.addMealSlot(userId, {
      day,
      mealType,
      recipeId,
      servings,
    });

    const populated = await MealPlan.findById(updatedPlan._id)
      .populate('dinners.recipe')
      .populate('meals.recipe');

    res.status(201).json({
      success: true,
      data: populated,
      message: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} added for ${day}!`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const removeMealSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { slotId } = req.params;

    const updatedPlan = await PlannerService.removeMealSlot(userId, slotId);
    const populated = await MealPlan.findById(updatedPlan._id)
      .populate('dinners.recipe')
      .populate('meals.recipe');

    res.json({ success: true, data: populated, message: 'Meal slot removed successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const editMealSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { slotId } = req.params;
    const { servings, isCooked, recipeId } = req.body;

    const updatedPlan = await PlannerService.editMealSlot(userId, slotId, {
      servings,
      isCooked,
      recipeId,
    });
    const populated = await MealPlan.findById(updatedPlan._id)
      .populate('dinners.recipe')
      .populate('meals.recipe');

    res.json({ success: true, data: populated, message: 'Meal slot updated successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const updateHouseholdSize = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { householdSize } = req.body;

    const updatedPlan = await PlannerService.updateHouseholdSize(userId, householdSize);
    const populated = await MealPlan.findById(updatedPlan._id)
      .populate('dinners.recipe')
      .populate('meals.recipe');

    res.json({
      success: true,
      data: populated,
      message: `Household size updated to ${householdSize}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const archiveCurrentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const newPlan = await PlannerService.archiveCurrentPlan(userId);
    const populated = await MealPlan.findById(newPlan._id)
      .populate('dinners.recipe')
      .populate('meals.recipe');

    res.json({
      success: true,
      data: populated,
      message: 'Active plan archived and new week started!',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPlanHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const history = await PlannerService.getPlanHistory(userId);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
