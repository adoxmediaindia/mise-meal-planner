import { ShoppingList, IShoppingListDoc, IShoppingItem } from '../models/ShoppingList.js';
import { MealPlan, IMealPlanDoc } from '../models/MealPlan.js';
import { IRecipeDoc } from '../models/Recipe.js';
import { Preference } from '../models/Preference.js';
import { SUPERMARKET_PRICE_MULTIPLIERS } from './plannerService.js';
import { SupermarketAisle } from '../types/index.js';

export class ShoppingListService {
  /**
   * Normalizes an ingredient name for deduplication
   */
  public static normalizeIngredientName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/^(fresh|dried|ground|chopped|diced|sliced|minced|grated)\s+/i, '')
      .replace(/\s+(leaves|cloves|fillets|breasts|stalks)$/i, '');
  }

  /**
   * Consolidates all ingredients across the meal plan, merges duplicates,
   * scales to household size, and saves to MongoDB.
   */
  public static async generateOrUpdateShoppingList(
    userId: string,
    planId: string
  ): Promise<IShoppingListDoc> {
    const plan = await MealPlan.findOne({ _id: planId, user: userId }).populate('dinners.recipe');
    if (!plan) throw new Error('Meal plan not found.');

    const preference = await Preference.findOne({ user: userId });
    const supermarket = preference?.supermarket || 'Aldi';
    const householdSize = plan.householdSize || 2;
    const sizeMultiplier = householdSize / 2;
    const storeMultiplier = SUPERMARKET_PRICE_MULTIPLIERS[supermarket] || 1.0;

    // Load existing shopping list to preserve checked items
    const existingList = await ShoppingList.findOne({ user: userId, plan: planId });
    const existingCheckedMap = new Map<string, boolean>();
    if (existingList) {
      for (const item of existingList.items) {
        existingCheckedMap.set(item.name.toLowerCase(), item.isBought);
      }
    }

    // Map to aggregate ingredients: normalizedKey -> item
    const mergedMap = new Map<
      string,
      {
        displayName: string;
        totalQuantity: number;
        unit: string;
        aisle: SupermarketAisle;
        estimatedCost: number;
        recipeTitles: Set<string>;
        icon: string;
      }
    >();

    for (const dinner of plan.dinners) {
      const recipe = dinner.recipe as unknown as IRecipeDoc;
      if (!recipe || !recipe.ingredients) continue;

      for (const ing of recipe.ingredients) {
        const normKey = this.normalizeIngredientName(ing.name);
        const existing = mergedMap.get(normKey);

        const scaledQty = Math.round(ing.quantity * sizeMultiplier * 10) / 10;
        const scaledCost = Math.round(ing.estimatedCost * sizeMultiplier * storeMultiplier * 100) / 100;

        if (existing) {
          existing.totalQuantity = Math.round((existing.totalQuantity + scaledQty) * 10) / 10;
          existing.estimatedCost = Math.round((existing.estimatedCost + scaledCost) * 100) / 100;
          existing.recipeTitles.add(recipe.title);
        } else {
          mergedMap.set(normKey, {
            displayName: ing.name,
            totalQuantity: scaledQty,
            unit: ing.unit,
            aisle: ing.aisle,
            estimatedCost: scaledCost,
            recipeTitles: new Set([recipe.title]),
            icon: ing.icon || '🛒',
          });
        }
      }
    }

    // Convert map to array of IShoppingItem
    const items: IShoppingItem[] = Array.from(mergedMap.entries()).map(([normKey, val], index) => {
      const isBought = existingCheckedMap.get(normKey) || false;
      return {
        id: `item_${index}_${normKey.replace(/[^a-z0-9]/g, '_')}`,
        name: val.displayName,
        totalQuantity: val.totalQuantity,
        unit: val.unit,
        aisle: val.aisle,
        estimatedCost: val.estimatedCost,
        isBought,
        recipeTitles: Array.from(val.recipeTitles),
        icon: val.icon,
      };
    });

    // Sort items by aisle and then name
    const aisleOrder: SupermarketAisle[] = [
      'Fresh Produce',
      'Meat & Seafood',
      'Dairy & Refrigerated',
      'Bakery',
      'Pantry & Grains',
      'Spices & Condiments',
      'Frozen',
    ];

    items.sort((a, b) => {
      const orderA = aisleOrder.indexOf(a.aisle);
      const orderB = aisleOrder.indexOf(b.aisle);
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    const totalEstimatedCost =
      Math.round(items.reduce((acc, i) => acc + i.estimatedCost, 0) * 100) / 100;
    const itemsBoughtCount = items.filter((i) => i.isBought).length;
    const totalItemsCount = items.length;

    let shoppingList = await ShoppingList.findOne({ user: userId });
    if (shoppingList) {
      shoppingList.plan = plan._id as any;
      shoppingList.supermarket = supermarket;
      shoppingList.items = items;
      shoppingList.totalEstimatedCost = totalEstimatedCost;
      shoppingList.itemsBoughtCount = itemsBoughtCount;
      shoppingList.totalItemsCount = totalItemsCount;
      await shoppingList.save();
    } else {
      shoppingList = await ShoppingList.create({
        user: userId,
        plan: plan._id,
        supermarket,
        items,
        totalEstimatedCost,
        itemsBoughtCount,
        totalItemsCount,
      });
    }

    return shoppingList;
  }

  /**
   * Toggles the bought/checked state of an item in the shopping list
   */
  public static async toggleItem(
    userId: string,
    itemId: string
  ): Promise<IShoppingListDoc> {
    const list = await ShoppingList.findOne({ user: userId });
    if (!list) throw new Error('Shopping list not found.');

    const item = list.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Shopping item not found in list.');

    item.isBought = !item.isBought;
    list.itemsBoughtCount = list.items.filter((i) => i.isBought).length;
    await list.save();

    return list;
  }

  /**
   * Resets all items to unbought
   */
  public static async resetItems(userId: string): Promise<IShoppingListDoc> {
    const list = await ShoppingList.findOne({ user: userId });
    if (!list) throw new Error('Shopping list not found.');

    for (const item of list.items) {
      item.isBought = false;
    }
    list.itemsBoughtCount = 0;
    await list.save();

    return list;
  }
}
