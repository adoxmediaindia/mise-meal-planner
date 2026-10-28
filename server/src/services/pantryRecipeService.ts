import { Recipe, IRecipeDoc } from '../models/Recipe.js';
import { PantryItem } from '../models/PantryItem.js';
import { Preference } from '../models/Preference.js';
import { PlannerService } from './plannerService.js';
import { ShoppingListService } from './shoppingListService.js';
import { UnitConverter } from '../utils/unitConverter.js';
import { IPantryRecipeMatch } from '../types/index.js';

export class PantryRecipeService {
  /**
   * Evaluates recipes against the user's pantry inventory while strictly enforcing
   * allergy exclusions and dietary requirements.
   */
  public static async suggestRecipes(
    userId: string,
    options: {
      maxMissing?: number;
      cuisine?: string;
      dietary?: string;
      limit?: number;
    } = {}
  ): Promise<IPantryRecipeMatch[]> {
    const preference = await Preference.findOne({ user: userId });
    const safetyQuery = preference
      ? PlannerService.buildSafetyQuery(preference)
      : {};

    if (options.cuisine && options.cuisine !== 'All') {
      safetyQuery.cuisine = options.cuisine;
    }

    if (options.dietary && options.dietary !== 'None' && options.dietary !== 'All') {
      safetyQuery.dietaryTags = options.dietary;
    }

    const candidateRecipes: IRecipeDoc[] = await Recipe.find(safetyQuery);
    const pantryItems = await PantryItem.find({ user: userId });

    // Map pantry items by normalized name for quick lookup
    const pantryMap = new Map<string, typeof pantryItems>();
    for (const item of pantryItems) {
      const normName = ShoppingListService.normalizeIngredientName(item.name);
      if (!pantryMap.has(normName)) {
        pantryMap.set(normName, []);
      }
      pantryMap.get(normName)!.push(item);
    }

    const matches: IPantryRecipeMatch[] = [];

    for (const recipe of candidateRecipes) {
      if (!recipe.ingredients || recipe.ingredients.length === 0) continue;

      const availableIngredients: IPantryRecipeMatch['availableIngredients'] = [];
      const missingIngredients: IPantryRecipeMatch['missingIngredients'] = [];

      for (const reqIng of recipe.ingredients) {
        const normReqName = ShoppingListService.normalizeIngredientName(reqIng.name);
        const matchingPantryItems = pantryMap.get(normReqName) || [];

        let totalAvailableInReqUnit = 0;
        let bestPantryUnit = reqIng.unit;

        for (const pItem of matchingPantryItems) {
          const converted = UnitConverter.convert(pItem.quantity, pItem.unit, reqIng.unit);
          if (converted !== null) {
            totalAvailableInReqUnit += converted;
            bestPantryUnit = pItem.unit || '';
          }
        }

        if (totalAvailableInReqUnit >= reqIng.quantity) {
          availableIngredients.push({
            name: reqIng.name,
            quantity: reqIng.quantity,
            unit: reqIng.unit,
            pantryQuantity: Math.round(totalAvailableInReqUnit * 100) / 100,
            pantryUnit: bestPantryUnit,
          });
        } else if (totalAvailableInReqUnit > 0) {
          const deficit = Math.round((reqIng.quantity - totalAvailableInReqUnit) * 100) / 100;
          missingIngredients.push({
            name: reqIng.name,
            quantity: reqIng.quantity,
            unit: reqIng.unit,
            deficitQuantity: deficit,
            aisle: reqIng.aisle,
            estimatedCost: Math.round((reqIng.estimatedCost * (deficit / reqIng.quantity)) * 100) / 100,
          });
        } else {
          missingIngredients.push({
            name: reqIng.name,
            quantity: reqIng.quantity,
            unit: reqIng.unit,
            deficitQuantity: reqIng.quantity,
            aisle: reqIng.aisle,
            estimatedCost: reqIng.estimatedCost,
          });
        }
      }

      const totalCount = recipe.ingredients.length;
      const matchPercentage = Math.round((availableIngredients.length / totalCount) * 100);
      const canCookFully = missingIngredients.length === 0;

      if (options.maxMissing !== undefined && missingIngredients.length > options.maxMissing) {
        continue;
      }

      matches.push({
        recipe,
        matchPercentage,
        availableIngredients,
        missingIngredients,
        canCookFully,
      });
    }

    // Sort: 100% canCookFully first, then highest match percentage, then least missing
    matches.sort((a, b) => {
      if (a.canCookFully !== b.canCookFully) return a.canCookFully ? -1 : 1;
      if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
      return a.missingIngredients.length - b.missingIngredients.length;
    });

    if (options.limit && options.limit > 0) {
      return matches.slice(0, options.limit);
    }

    return matches;
  }

  /**
   * Adds all missing ingredients for a specific recipe directly to the user's grocery list
   */
  public static async addMissingIngredientsToGrocery(
    userId: string,
    recipeId: string
  ): Promise<{ addedCount: number; items: string[] }> {
    const suggestions = await this.suggestRecipes(userId);
    const targetMatch = suggestions.find(
      (m) => m.recipe._id.toString() === recipeId.toString()
    );

    if (!targetMatch) {
      throw new Error('Recipe not found or does not satisfy your dietary profile.');
    }

    if (targetMatch.missingIngredients.length === 0) {
      return { addedCount: 0, items: [] };
    }

    const addedItemNames: string[] = [];

    for (const missing of targetMatch.missingIngredients) {
      await ShoppingListService.addCustomItem(userId, {
        name: missing.name,
        totalQuantity: missing.deficitQuantity,
        unit: missing.unit,
        aisle: missing.aisle,
        estimatedCost: missing.estimatedCost,
        icon: '🛒',
      });
      addedItemNames.push(`${missing.name} (${missing.deficitQuantity} ${missing.unit})`);
    }

    return {
      addedCount: addedItemNames.length,
      items: addedItemNames,
    };
  }
}
