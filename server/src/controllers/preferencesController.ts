import { Response } from 'express';
import { z } from 'zod';
import { Preference } from '../models/Preference.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { PlannerService } from '../services/plannerService.js';
import { ShoppingListService } from '../services/shoppingListService.js';

export const updatePreferenceSchema = z.object({
  supermarket: z.string().min(1).optional(),
  countryCode: z.string().optional(),
  countryName: z.string().optional(),
  currencyCode: z.string().optional(),
  householdSize: z.number().min(1).max(20).optional(),
  cookingDays: z.array(z.string()).min(1).max(7).optional(),
  weeklyBudget: z.number().min(1).optional(),
  dietaryNeeds: z.array(z.string().max(50)).max(15).optional(),
  allergies: z.array(z.string().max(50)).max(25).optional(),
  equipment: z.array(z.string().max(50)).max(15).optional(),
  vibes: z.array(z.string().max(50)).max(15).optional(),
  autoRegenerate: z.boolean().optional(),
});

export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    let pref = await Preference.findOne({ user: req.user?.id });
    if (!pref) {
      const defaultSupermarket = user?.countryCode === 'IN' ? 'Blinkit' : (user?.countryCode === 'GB' ? 'Tesco' : 'Aldi');
      const defaultBudget = user?.weeklyBudget || (user?.currencyCode === 'INR' ? 4000 : 40);
      pref = await Preference.create({
        user: req.user?.id,
        supermarket: defaultSupermarket,
        countryCode: user?.countryCode || 'US',
        countryName: user?.countryName || 'United States',
        currencyCode: user?.currencyCode || 'USD',
        householdSize: user?.householdSize || 2,
        cookingDays: user?.cookingDays && user.cookingDays.length > 0 ? user.cookingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        weeklyBudget: defaultBudget,
        dietaryNeeds: user?.dietaryPreferences && user.dietaryPreferences.length > 0 ? user.dietaryPreferences : ['None'],
        allergies: user?.allergies || [],
        equipment: ['Hob Only'],
        vibes: user?.mealMoods && user.mealMoods.length > 0 ? user.mealMoods : ['Speedy Meals', 'Family Favs'],
      });
    } else {
      let changed = false;
      if (!pref.countryCode && user?.countryCode) {
        pref.countryCode = user.countryCode;
        changed = true;
      }
      if (!pref.currencyCode && user?.currencyCode) {
        pref.currencyCode = user.currencyCode;
        changed = true;
      }
      if (!pref.countryName && user?.countryName) {
        pref.countryName = user.countryName;
        changed = true;
      }
      if (changed) {
        await pref.save();
      }
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

    // Synchronize relevant fields back to the User model so user profile and preferences stay consistent
    const userUpdates: Record<string, any> = {};
    if (updates.countryCode) userUpdates.countryCode = updates.countryCode;
    if (updates.countryName) userUpdates.countryName = updates.countryName;
    if (updates.currencyCode) {
      userUpdates.currencyCode = updates.currencyCode;
      userUpdates.weeklyBudgetCurrency = updates.currencyCode;
    }
    if (updates.weeklyBudget !== undefined) userUpdates.weeklyBudget = updates.weeklyBudget;
    if (updates.householdSize !== undefined) userUpdates.householdSize = updates.householdSize;
    if (updates.cookingDays) userUpdates.cookingDays = updates.cookingDays;
    if (updates.dietaryNeeds) userUpdates.dietaryPreferences = updates.dietaryNeeds;
    if (updates.allergies) userUpdates.allergies = updates.allergies;
    if (updates.vibes) userUpdates.mealMoods = updates.vibes;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user?.id, userUpdates);
    }

    let message = 'Preferences updated successfully';
    if (autoRegenerate) {
      const user = await User.findById(req.user?.id).select('onboardingCompleted');
      if (user?.onboardingCompleted) {
        const plan = await PlannerService.generateWeeklyPlan(req.user!.id, pref);
        await ShoppingListService.generateOrUpdateShoppingList(req.user!.id, plan._id.toString());
      } else {
        message = 'Preferences updated. Finish onboarding to generate your personalized first plan.';
      }
    }

    res.json({ success: true, data: pref, message });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
