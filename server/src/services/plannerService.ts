import { Recipe, IRecipeDoc } from '../models/Recipe.js';
import { IPreference } from '../models/Preference.js';
import { MealPlan, IMealPlanDoc, IDinnerSlot, IMealSlotDoc } from '../models/MealPlan.js';
import { User } from '../models/User.js';
import { EntitlementService } from './entitlementService.js';
import { DayOfWeek, Supermarket, MealType } from '../types/index.js';

// Supermarket cost multiplier based on real market grocery indices
export const SUPERMARKET_PRICE_MULTIPLIERS: Record<Supermarket, number> = {
  Aldi: 0.85,
  Walmart: 0.90,
  Kroger: 0.98,
  Costco: 0.92,
  Publix: 1.08,
  Safeway: 1.05,
  'H-E-B': 0.94,
  'Whole Foods': 1.28,
  "Trader Joe's": 1.02,
  'Food Lion': 0.91,
  Sprouts: 1.15,
};

export class NoRecipesFoundError extends Error {
  public statusCode = 422;
  public code = 'NO_RECIPES_FOUND';

  constructor(
    message = 'No recipes found matching your active dietary preferences and allergen exclusions. Try relaxing one allergy filter.'
  ) {
    super(message);
    this.name = 'NoRecipesFoundError';
  }
}

export class PlannerService {
  /**
   * Builds the MongoDB query filter strictly enforcing dietary needs and allergen exclusions.
   * ALLERGY EXCLUSIONS ARE MANDATORY AND MUST NEVER BE BYPASSED.
   */
  public static buildSafetyQuery(preference: IPreference): Record<string, any> {
    const query: Record<string, any> = {};

    // 1. ALLERGY EXCLUSION FILTER (Strict $nin)
    if (preference.allergies && preference.allergies.length > 0) {
      query.allergens = { $nin: preference.allergies };
    }

    // 2. DIETARY PREFERENCE FILTER
    if (preference.dietaryNeeds && preference.dietaryNeeds.length > 0) {
      const activeDiets = preference.dietaryNeeds.filter((d) => d !== 'None');
      if (activeDiets.includes('Vegan')) {
        query.dietaryTags = 'Vegan';
      } else if (activeDiets.includes('Vegetarian')) {
        query.dietaryTags = { $in: ['Vegetarian', 'Vegan'] };
      } else if (activeDiets.includes('Pescatarian')) {
        query.dietaryTags = { $in: ['Pescatarian', 'Vegetarian', 'Vegan'] };
      }
    }

    // 3. COOKING TIME LIMIT
    if (preference.maxCookTimeMinutes && preference.maxCookTimeMinutes > 0) {
      query.cookTimeMinutes = { $lte: preference.maxCookTimeMinutes };
    }

    return query;
  }

  /**
   * Strictly validates that a recipe contains none of the user's excluded allergens
   */
  public static validateRecipeAllergySafety(
    recipe: IRecipeDoc,
    allergies?: string[]
  ): boolean {
    if (!allergies || allergies.length === 0) return true;
    if (!recipe.allergens || recipe.allergens.length === 0) return true;
    return !recipe.allergens.some((a) => allergies.includes(a));
  }

  /**
   * Deterministically generates a weekly dinner plan matching the user's cooking days,
   * vibes, budget, and household size.
   */
  public static async generateWeeklyPlan(
    userId: string,
    preference: IPreference
  ): Promise<IMealPlanDoc> {
    const baseQuery = this.buildSafetyQuery(preference);
    const candidateRecipes: IRecipeDoc[] = await Recipe.find(baseQuery);

    if (candidateRecipes.length === 0) {
      throw new NoRecipesFoundError(
        'No recipes found matching your active dietary preferences and allergen exclusions. Try relaxing one allergy filter.'
      );
    }

    // Score recipes based on matching user's selected vibes
    const scoredRecipes = candidateRecipes.map((recipe) => {
      let score = 0;
      if (preference.vibes && preference.vibes.length > 0) {
        for (const vibe of preference.vibes) {
          if (recipe.vibes.includes(vibe)) score += 3;
        }
      }
      return { recipe, score };
    });

    // Sort descending by score, with slight shuffle for variety
    scoredRecipes.sort((a, b) => b.score - a.score + (Math.random() - 0.5));

    const cookingDays: DayOfWeek[] =
      preference.cookingDays && preference.cookingDays.length > 0
        ? preference.cookingDays
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const chosenDinners: IDinnerSlot[] = [];
    const usedRecipeIds = new Set<string>();

    for (const day of cookingDays) {
      // Pick next best available unused recipe
      const nextMatch = scoredRecipes.find((item) => !usedRecipeIds.has(item.recipe._id.toString()));
      const selected = nextMatch ? nextMatch.recipe : scoredRecipes[0].recipe;
      usedRecipeIds.add(selected._id.toString());

      chosenDinners.push({
        day,
        recipe: selected._id as any,
        isCooked: false,
      });
    }

    // Calculate estimated total grocery cost
    const multiplier = SUPERMARKET_PRICE_MULTIPLIERS[preference.supermarket] || 1.0;
    const sizeRatio = (preference.householdSize || 2) / 2;

    let baseCost = 0;
    for (const dinner of chosenDinners) {
      const rec = candidateRecipes.find((r) => r._id.toString() === dinner.recipe.toString());
      if (rec) {
        const mealCost = rec.ingredients.reduce((acc, ing) => acc + ing.estimatedCost, 0);
        baseCost += mealCost * sizeRatio;
      }
    }
    const totalEstimatedCost = Math.round(baseCost * multiplier * 100) / 100;

    // Check if an existing meal plan exists for this user and overwrite, or create new
    const chosenMeals: IMealSlotDoc[] = chosenDinners.map((d, idx) => ({
      id: `slot_${idx}_${d.day.toLowerCase()}_dinner`,
      day: d.day,
      mealType: 'dinner',
      recipe: d.recipe,
      servings: preference.householdSize,
      isCooked: false,
    }));

    let plan = await MealPlan.findOne({ user: userId });
    if (plan) {
      plan.dinners = chosenDinners;
      plan.meals = chosenMeals;
      plan.householdSize = preference.householdSize;
      plan.estimatedCost = totalEstimatedCost;
      plan.budgetLimit = preference.weeklyBudget;
      plan.weekStartDate = new Date();
      await plan.save();
    } else {
      plan = await MealPlan.create({
        user: userId,
        weekStartDate: new Date(),
        dinners: chosenDinners,
        meals: chosenMeals,
        householdSize: preference.householdSize,
        estimatedCost: totalEstimatedCost,
        budgetLimit: preference.weeklyBudget,
      });
    }

    return plan;
  }

  /**
   * Swaps a single day's dinner with an alternative compliant recipe
   */
  public static async swapMeal(
    userId: string,
    day: DayOfWeek,
    targetRecipeId?: string,
    maxRetries: number = 3
  ): Promise<IMealPlanDoc> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const plan = await MealPlan.findOne({ user: userId });
        if (!plan) throw new Error('No active meal plan found to swap.');

        const dinnerSlot = plan.dinners.find((d) => d.day === day);
        if (!dinnerSlot) throw new Error(`Day ${day} is not a planned cooking day.`);

        const preference = await import('../models/Preference.js').then((m) =>
          m.Preference.findOne({ user: userId })
        );
        if (!preference) throw new Error('User preferences not found.');

        const baseQuery = this.buildSafetyQuery(preference);

        let replacementRecipe: IRecipeDoc | null = null;
        if (targetRecipeId) {
          replacementRecipe = await Recipe.findOne({ _id: targetRecipeId, ...baseQuery });
          if (!replacementRecipe) {
            throw new Error('Selected replacement recipe does not satisfy active allergy/diet filters.');
          }
        } else {
          // Find a random alternative not currently in the plan
          const currentRecipeIds = plan.dinners.map((d) => d.recipe.toString());
          const alternatives = await Recipe.find({
            _id: { $nin: currentRecipeIds },
            ...baseQuery,
          });

          if (alternatives.length > 0) {
            replacementRecipe = alternatives[Math.floor(Math.random() * alternatives.length)];
          } else {
            // Fallback: pick any compliant recipe different from the current one
            replacementRecipe = await Recipe.findOne({
              _id: { $ne: dinnerSlot.recipe },
              ...baseQuery,
            });
          }
        }

        if (!replacementRecipe) {
          throw new Error('No safe alternative recipes found matching your filters.');
        }

        dinnerSlot.recipe = replacementRecipe._id as any;
        dinnerSlot.isCooked = false;

        // Recalculate total estimated cost
        await plan.populate('dinners.recipe');
        await plan.populate('meals.recipe');

        // Also sync with meals array if matching dinner slot exists
        if (plan.meals && plan.meals.length > 0) {
          const mealSlot = plan.meals.find((m) => m.day === day && m.mealType === 'dinner');
          if (mealSlot) {
            mealSlot.recipe = replacementRecipe._id as any;
            mealSlot.isCooked = false;
          }
        }

        plan.estimatedCost = this.recalculateCost(plan, preference.supermarket);
        await plan.save();

        return plan;
      } catch (err: any) {
        if (err.name === 'VersionError' && attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Unable to complete meal swap due to concurrent updates.');
  }

  /**
   * Recalculates the estimated grocery cost based on all scheduled meals/dinners and supermarket multiplier
   */
  public static recalculateCost(plan: IMealPlanDoc, supermarket: Supermarket): number {
    const multiplier = SUPERMARKET_PRICE_MULTIPLIERS[supermarket] || 1.0;
    const defaultRatio = (plan.householdSize || 2) / 2;
    let baseCost = 0;

    if (plan.meals && plan.meals.length > 0) {
      for (const slot of plan.meals) {
        const rec = slot.recipe as unknown as IRecipeDoc;
        if (rec && rec.ingredients) {
          const slotRatio = slot.servings ? slot.servings / 2 : defaultRatio;
          const mealCost = rec.ingredients.reduce((acc, ing) => acc + (ing.estimatedCost || 0), 0);
          baseCost += mealCost * slotRatio;
        }
      }
    } else if (plan.dinners && plan.dinners.length > 0) {
      for (const slot of plan.dinners) {
        const rec = slot.recipe as unknown as IRecipeDoc;
        if (rec && rec.ingredients) {
          const mealCost = rec.ingredients.reduce((acc, ing) => acc + (ing.estimatedCost || 0), 0);
          baseCost += mealCost * defaultRatio;
        }
      }
    }

    return Math.round(baseCost * multiplier * 100) / 100;
  }

  /**
   * Adds a meal slot to the user's plan (breakfast, lunch, dinner, or snack)
   */
  public static async addMealSlot(
    userId: string,
    data: {
      day: DayOfWeek;
      mealType: MealType;
      recipeId: string;
      servings?: number;
    }
  ): Promise<IMealPlanDoc> {
    const preference = await import('../models/Preference.js').then((m) =>
      m.Preference.findOne({ user: userId })
    );

    if (!preference) throw new Error('User preferences not found.');

    let plan = await MealPlan.findOne({ user: userId });
    if (!plan) {
      const generated = await this.generateWeeklyPlan(userId, preference);
      plan = await MealPlan.findById(generated._id);
    }
    if (!plan) throw new Error('Failed to load or initialize meal plan.');

    const recipe = await Recipe.findById(data.recipeId);
    if (!recipe) throw new Error('Recipe not found.');

    // Strictly validate allergy safety
    if (!this.validateRecipeAllergySafety(recipe, preference.allergies)) {
      throw new Error(
        `Cannot add recipe "${recipe.title}". It contains allergens (${recipe.allergens.join(
          ', '
        )}) excluded by your profile.`
      );
    }

    const slotId = `slot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSlot: IMealSlotDoc = {
      id: slotId,
      day: data.day,
      mealType: data.mealType,
      recipe: recipe._id as any,
      servings: data.servings || plan.householdSize || 2,
      isCooked: false,
    };

    plan.meals.push(newSlot);

    // If adding a dinner, sync with dinners array if no dinner for that day exists or replace it
    if (data.mealType === 'dinner') {
      const existingDinner = plan.dinners.find((d) => d.day === data.day);
      if (existingDinner) {
        existingDinner.recipe = recipe._id as any;
        existingDinner.isCooked = false;
      } else {
        plan.dinners.push({
          day: data.day,
          recipe: recipe._id as any,
          isCooked: false,
        });
      }
    }

    await plan.populate('meals.recipe');
    await plan.populate('dinners.recipe');
    plan.estimatedCost = this.recalculateCost(plan, preference.supermarket);
    await plan.save();

    // Auto-sync shopping list
    const { ShoppingListService } = await import('./shoppingListService.js');
    await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());

    return plan;
  }

  /**
   * Removes a meal slot by slot ID
   */
  public static async removeMealSlot(userId: string, slotId: string): Promise<IMealPlanDoc> {
    const plan = await MealPlan.findOne({ user: userId });
    if (!plan) throw new Error('Meal plan not found.');

    const slotIndex = plan.meals.findIndex((m) => m.id === slotId);
    if (slotIndex === -1) throw new Error('Meal slot not found in plan.');

    const removedSlot = plan.meals[slotIndex];
    plan.meals.splice(slotIndex, 1);

    // If it was a dinner, update dinners array if needed
    if (removedSlot.mealType === 'dinner') {
      const dinnerIdx = plan.dinners.findIndex((d) => d.day === removedSlot.day);
      if (dinnerIdx !== -1) {
        // Only remove dinner if no other dinner exists for this day in meals
        const remainingDinner = plan.meals.find(
          (m) => m.day === removedSlot.day && m.mealType === 'dinner'
        );
        if (!remainingDinner) {
          plan.dinners.splice(dinnerIdx, 1);
        }
      }
    }

    const preference = await import('../models/Preference.js').then((m) =>
      m.Preference.findOne({ user: userId })
    );
    const supermarket = preference?.supermarket || 'Aldi';

    await plan.populate('meals.recipe');
    await plan.populate('dinners.recipe');
    plan.estimatedCost = this.recalculateCost(plan, supermarket);
    await plan.save();

    const { ShoppingListService } = await import('./shoppingListService.js');
    await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());

    return plan;
  }

  /**
   * Updates an existing meal slot (servings, isCooked, or change recipe)
   */
  public static async editMealSlot(
    userId: string,
    slotId: string,
    updates: {
      servings?: number;
      isCooked?: boolean;
      recipeId?: string;
    }
  ): Promise<IMealPlanDoc> {
    const plan = await MealPlan.findOne({ user: userId });
    if (!plan) throw new Error('Meal plan not found.');

    const slot = plan.meals.find((m) => m.id === slotId);
    if (!slot) throw new Error('Meal slot not found in plan.');

    const preference = await import('../models/Preference.js').then((m) =>
      m.Preference.findOne({ user: userId })
    );

    if (updates.recipeId) {
      const newRecipe = await Recipe.findById(updates.recipeId);
      if (!newRecipe) throw new Error('Recipe not found.');

      if (preference && !this.validateRecipeAllergySafety(newRecipe, preference.allergies)) {
        throw new Error(
          `Cannot change to recipe "${newRecipe.title}". It contains allergens (${newRecipe.allergens.join(
            ', '
          )}) excluded by your profile.`
        );
      }
      slot.recipe = newRecipe._id as any;
    }

    if (updates.servings !== undefined && updates.servings > 0) {
      slot.servings = updates.servings;
    }

    if (updates.isCooked !== undefined) {
      slot.isCooked = updates.isCooked;
      if (slot.mealType === 'dinner') {
        const dinnerSlot = plan.dinners.find((d) => d.day === slot.day);
        if (dinnerSlot) dinnerSlot.isCooked = updates.isCooked;
      }
    }

    const supermarket = preference?.supermarket || 'Aldi';

    await plan.populate('meals.recipe');
    await plan.populate('dinners.recipe');
    plan.estimatedCost = this.recalculateCost(plan, supermarket);
    await plan.save();

    const { ShoppingListService } = await import('./shoppingListService.js');
    await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());

    return plan;
  }

  /**
   * Updates the household size for the meal plan and syncs with preferences
   */
  public static async updateHouseholdSize(
    userId: string,
    householdSize: number
  ): Promise<IMealPlanDoc> {
    if (householdSize < 1 || householdSize > 12) {
      throw new Error('Household size must be between 1 and 12.');
    }

    const plan = await MealPlan.findOne({ user: userId });
    if (!plan) throw new Error('Meal plan not found.');

    const { Preference } = await import('../models/Preference.js');
    const pref = await Preference.findOne({ user: userId });
    if (pref) {
      pref.householdSize = householdSize;
      await pref.save();
    }

    plan.householdSize = householdSize;
    if (plan.meals) {
      for (const m of plan.meals) {
        m.servings = householdSize;
      }
    }

    const supermarket = pref?.supermarket || 'Aldi';
    await plan.populate('meals.recipe');
    await plan.populate('dinners.recipe');
    plan.estimatedCost = this.recalculateCost(plan, supermarket);
    await plan.save();

    const { ShoppingListService } = await import('./shoppingListService.js');
    await ShoppingListService.generateOrUpdateShoppingList(userId, plan._id.toString());

    return plan;
  }

  /**
   * Archives current active plan and generates a fresh plan
   */
  public static async archiveCurrentPlan(userId: string): Promise<IMealPlanDoc> {
    const currentPlan = await MealPlan.findOne({ user: userId, isArchived: false });
    if (currentPlan) {
      currentPlan.isArchived = true;
      await currentPlan.save();
    }

    const { Preference } = await import('../models/Preference.js');
    const pref = await Preference.findOne({ user: userId });
    if (!pref) throw new Error('User preferences not found.');

    return this.generateWeeklyPlan(userId, pref);
  }

  /**
   * Retrieves past/archived meal plans for history view, enforcing tier history retention limits
   */
  public static async getPlanHistory(userId: string): Promise<IMealPlanDoc[]> {
    const user = await User.findById(userId);
    const entitlements = user ? EntitlementService.getEntitlements(user) : null;
    let query = MealPlan.find({ user: userId }).sort({ weekStartDate: -1 });

    // Enforce history retention limits: Free gets 2 weeks, Pro gets unlimited (-1)
    if (entitlements && entitlements.maxPlanHistoryWeeks > 0) {
      query = query.limit(entitlements.maxPlanHistoryWeeks);
    }

    return query
      .populate('dinners.recipe')
      .populate('meals.recipe')
      .lean() as unknown as IMealPlanDoc[];
  }
}
