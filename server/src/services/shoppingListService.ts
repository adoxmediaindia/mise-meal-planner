import { ShoppingList, IShoppingListDoc, IShoppingItem } from '../models/ShoppingList.js';
import { MealPlan, IMealPlanDoc } from '../models/MealPlan.js';
import { IRecipeDoc } from '../models/Recipe.js';
import { Preference } from '../models/Preference.js';
import { PantryItem } from '../models/PantryItem.js';
import { SUPERMARKET_PRICE_MULTIPLIERS } from './plannerService.js';
import { SupermarketAisle } from '../types/index.js';
import { UnitConverter } from '../utils/unitConverter.js';

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
    const plan = await MealPlan.findOne({ _id: planId, user: userId })
      .populate('dinners.recipe')
      .populate('meals.recipe');
    if (!plan) throw new Error('Meal plan not found.');

    const preference = await Preference.findOne({ user: userId });
    const supermarket = preference?.supermarket || 'Aldi';
    const householdSize = plan.householdSize || 2;
    const sizeMultiplier = householdSize / 2;
    const storeMultiplier = SUPERMARKET_PRICE_MULTIPLIERS[supermarket] || 1.0;

    // Load existing shopping list to preserve checked items and custom items
    const existingList = await ShoppingList.findOne({ user: userId, plan: planId });
    const existingCheckedMap = new Map<string, boolean>();
    const existingCustomItems: IShoppingItem[] = [];
    if (existingList) {
      for (const item of existingList.items) {
        if (item.isCustom) {
          existingCustomItems.push(item);
        } else {
          existingCheckedMap.set(
            `${item.name.toLowerCase()}:::${(item.unit || '').toLowerCase().trim()}`,
            item.isBought
          );
        }
      }
    }

    // Map to aggregate ingredients: normalizedKey (name + unit) -> item
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

    // Support both multi-meal slots and traditional dinners slots
    const recipeSlots: { recipe: any; servingsRatio: number }[] = [];

    if (plan.meals && plan.meals.length > 0) {
      for (const m of plan.meals) {
        const ratio = m.servings ? m.servings / 2 : sizeMultiplier;
        recipeSlots.push({ recipe: m.recipe, servingsRatio: ratio });
      }
    } else {
      for (const d of plan.dinners) {
        recipeSlots.push({ recipe: d.recipe, servingsRatio: sizeMultiplier });
      }
    }

    for (const slot of recipeSlots) {
      const recipe = slot.recipe as unknown as IRecipeDoc;
      if (!recipe || !recipe.ingredients) continue;

      for (const ing of recipe.ingredients) {
        const normName = this.normalizeIngredientName(ing.name);
        const normUnit = (ing.unit || '').toLowerCase().trim();
        const aggKey = `${normName}:::${normUnit}`;
        const existing = mergedMap.get(aggKey);

        const scaledQty = Math.round(ing.quantity * slot.servingsRatio * 10) / 10;
        const scaledCost = Math.round(ing.estimatedCost * slot.servingsRatio * storeMultiplier * 100) / 100;

        if (existing) {
          existing.totalQuantity = Math.round((existing.totalQuantity + scaledQty) * 10) / 10;
          existing.estimatedCost = Math.round((existing.estimatedCost + scaledCost) * 100) / 100;
          existing.recipeTitles.add(recipe.title);
        } else {
          mergedMap.set(aggKey, {
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

    // Load pantry items for pantry-aware grocery consolidation
    const pantryItems = await PantryItem.find({ user: userId });
    const pantryMap = new Map<string, typeof pantryItems>();
    for (const p of pantryItems) {
      const norm = this.normalizeIngredientName(p.name);
      if (!pantryMap.has(norm)) pantryMap.set(norm, []);
      pantryMap.get(norm)!.push(p);
    }

    // Convert map to array of IShoppingItem, factoring in pantry inventory
    const items: IShoppingItem[] = [];

    for (const [aggKey, val] of mergedMap.entries()) {
      const normName = aggKey.split(':::')[0];
      const matchingPantry = pantryMap.get(normName) || [];

      let pantryCoveredQty = 0;
      let hasAmbiguousPantryUnit = false;
      let ambiguousPantryDetails = '';

      for (const p of matchingPantry) {
        const converted = UnitConverter.convert(p.quantity, p.unit, val.unit);
        if (converted !== null) {
          pantryCoveredQty += converted;
        } else {
          hasAmbiguousPantryUnit = true;
          ambiguousPantryDetails = `Pantry has ${p.quantity} ${p.unit || 'units'}, but conversion to ${val.unit} is ambiguous. Full amount kept on list.`;
        }
      }

      // If fully covered in pantry with compatible units, avoid requesting on grocery list
      if (pantryCoveredQty >= val.totalQuantity) {
        continue;
      }

      let finalQty = val.totalQuantity;
      let finalCost = val.estimatedCost;
      let pantryNote: string | undefined = undefined;

      if (pantryCoveredQty > 0) {
        finalQty = Math.round((val.totalQuantity - pantryCoveredQty) * 10) / 10;
        finalCost = Math.round((val.estimatedCost * (finalQty / val.totalQuantity)) * 100) / 100;
        pantryNote = `Deducted ${Math.round(pantryCoveredQty * 10) / 10} ${val.unit} available in your pantry.`;
      } else if (hasAmbiguousPantryUnit) {
        pantryNote = ambiguousPantryDetails;
      }

      const isBought = existingCheckedMap.get(
        `${val.displayName.toLowerCase()}:::${(val.unit || '').toLowerCase().trim()}`
      ) || false;

      items.push({
        id: `item_${aggKey.replace(/[^a-z0-9]/g, '_')}`,
        name: val.displayName,
        totalQuantity: finalQty,
        unit: val.unit,
        aisle: val.aisle,
        estimatedCost: finalCost,
        isBought,
        recipeTitles: Array.from(val.recipeTitles),
        icon: val.icon,
        isCustom: false,
        pantryNote,
      });
    }

    // Re-attach custom items previously added by the user
    for (const custom of existingCustomItems) {
      items.push(custom);
    }

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
      try {
        await shoppingList.save();
      } catch (err: any) {
        if (err.name === 'VersionError') {
          const refreshed = await ShoppingList.findOne({ user: userId });
          if (refreshed) {
            refreshed.plan = plan._id as any;
            refreshed.supermarket = supermarket;
            refreshed.items = items;
            refreshed.totalEstimatedCost = totalEstimatedCost;
            refreshed.itemsBoughtCount = itemsBoughtCount;
            refreshed.totalItemsCount = totalItemsCount;
            await refreshed.save();
          }
        } else {
          throw err;
        }
      }
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
   * Supports explicit target state (isBought) for idempotent retries
   */
  public static async toggleItem(
    userId: string,
    itemId: string,
    explicitBought?: boolean
  ): Promise<IShoppingListDoc> {
    const list = await ShoppingList.findOne({ user: userId });
    if (!list) throw new Error('Shopping list not found.');

    const item = list.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Shopping item not found in list.');

    item.isBought = explicitBought !== undefined ? explicitBought : !item.isBought;
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

  /**
   * Adds a custom item to the shopping list with idempotency key deduplication
   */
  public static async addCustomItem(
    userId: string,
    itemData: {
      name: string;
      totalQuantity: number;
      unit?: string;
      aisle?: SupermarketAisle;
      estimatedCost?: number;
      icon?: string;
      clientMutationId?: string;
    }
  ): Promise<IShoppingListDoc> {
    const list = await ShoppingList.findOne({ user: userId });
    if (!list) throw new Error('Shopping list not found.');

    // Idempotency check: if client retried mutation with clientMutationId, avoid duplicate
    if (itemData.clientMutationId) {
      const existing = list.items.find((i) => i.id === itemData.clientMutationId);
      if (existing) {
        return list;
      }
    }

    const newItem: IShoppingItem = {
      id: itemData.clientMutationId || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: itemData.name.trim(),
      totalQuantity: itemData.totalQuantity || 1,
      unit: itemData.unit ? itemData.unit.trim() : '',
      aisle: itemData.aisle || 'Pantry & Grains',
      estimatedCost: itemData.estimatedCost || 0,
      isBought: false,
      recipeTitles: ['Custom Item'],
      icon: itemData.icon || '📝',
      isCustom: true,
    };

    list.items.push(newItem);
    list.totalItemsCount = list.items.length;
    list.totalEstimatedCost = Math.round(list.items.reduce((acc, i) => acc + i.estimatedCost, 0) * 100) / 100;
    await list.save();

    return list;
  }

  /**
   * Updates an existing item in the shopping list
   */
  public static async editItem(
    userId: string,
    itemId: string,
    updates: Partial<IShoppingItem>
  ): Promise<IShoppingListDoc> {
    const list = await ShoppingList.findOne({ user: userId });
    if (!list) throw new Error('Shopping list not found.');

    const item = list.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found in shopping list.');

    if (updates.name !== undefined) item.name = updates.name.trim();
    if (updates.totalQuantity !== undefined) item.totalQuantity = updates.totalQuantity;
    if (updates.unit !== undefined) item.unit = updates.unit.trim();
    if (updates.aisle !== undefined) item.aisle = updates.aisle;
    if (updates.estimatedCost !== undefined) item.estimatedCost = updates.estimatedCost;
    if (updates.isBought !== undefined) item.isBought = updates.isBought;
    if (updates.icon !== undefined) item.icon = updates.icon;

    list.itemsBoughtCount = list.items.filter((i) => i.isBought).length;
    list.totalEstimatedCost = Math.round(list.items.reduce((acc, i) => acc + i.estimatedCost, 0) * 100) / 100;
    await list.save();

    return list;
  }

  /**
   * Deletes an item from the shopping list
   */
  public static async deleteItem(userId: string, itemId: string): Promise<IShoppingListDoc> {
    const list = await ShoppingList.findOne({ user: userId });
    if (!list) throw new Error('Shopping list not found.');

    const initialLength = list.items.length;
    list.items = list.items.filter((i) => i.id !== itemId);

    if (list.items.length === initialLength) {
      throw new Error('Item not found in shopping list.');
    }

    list.totalItemsCount = list.items.length;
    list.itemsBoughtCount = list.items.filter((i) => i.isBought).length;
    list.totalEstimatedCost = Math.round(list.items.reduce((acc, i) => acc + i.estimatedCost, 0) * 100) / 100;
    await list.save();

    return list;
  }
}
