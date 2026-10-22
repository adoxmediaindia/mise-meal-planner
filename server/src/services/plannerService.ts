import { Recipe, IRecipeDoc } from '../models/Recipe.js';
import { IPreference } from '../models/Preference.js';
import { MealPlan, IMealPlanDoc, IDinnerSlot } from '../models/MealPlan.js';
import { DayOfWeek, Supermarket } from '../types/index.js';

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

    return query;
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
      throw new Error(
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
    let plan = await MealPlan.findOne({ user: userId });
    if (plan) {
      plan.dinners = chosenDinners;
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
    targetRecipeId?: string
  ): Promise<IMealPlanDoc> {
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
    const multiplier = SUPERMARKET_PRICE_MULTIPLIERS[preference.supermarket] || 1.0;
    const sizeRatio = (preference.householdSize || 2) / 2;

    let baseCost = 0;
    for (const d of plan.dinners) {
      const rec = d.recipe as unknown as IRecipeDoc;
      if (rec && rec.ingredients) {
        const mealCost = rec.ingredients.reduce((acc, ing) => acc + ing.estimatedCost, 0);
        baseCost += mealCost * sizeRatio;
      }
    }
    plan.estimatedCost = Math.round(baseCost * multiplier * 100) / 100;
    await plan.save();

    return plan;
  }
}
