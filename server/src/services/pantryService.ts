import { PantryItem, IPantryItemDoc } from '../models/PantryItem.js';
import { SupermarketAisle, IPantryItem } from '../types/index.js';
import { UnitConverter } from '../utils/unitConverter.js';
import { ShoppingListService } from './shoppingListService.js';

export class PantryService {
  /**
   * Calculates expiry status and day differences for a pantry item
   */
  public static enrichExpiryInfo(item: IPantryItemDoc): IPantryItem {
    const plain = item.toObject ? item.toObject() : item;
    let isExpired = false;
    let isExpiringSoon = false;
    let daysUntilExpiry: number | undefined = undefined;

    if (plain.expiryDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const exp = new Date(plain.expiryDate);
      exp.setHours(0, 0, 0, 0);

      const diffTime = exp.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        isExpired = true;
      } else if (daysUntilExpiry <= 3) {
        isExpiringSoon = true;
      }
    }

    return {
      ...plain,
      id: plain._id.toString(),
      isExpired,
      isExpiringSoon,
      daysUntilExpiry,
    };
  }

  /**
   * Retrieves all pantry items for a user with optional search, category, and status filters
   */
  public static async getPantryItems(
    userId: string,
    options: {
      search?: string;
      category?: string;
      status?: 'all' | 'expired' | 'expiring_soon' | 'fresh';
    } = {}
  ): Promise<IPantryItem[]> {
    const query: Record<string, any> = { user: userId };

    if (options.category && options.category !== 'All') {
      query.category = options.category;
    }

    if (options.search && options.search.trim()) {
      query.name = { $regex: options.search.trim(), $options: 'i' };
    }

    const items = await PantryItem.find(query).sort({ expiryDate: 1, name: 1 });
    let enriched = items.map((i) => this.enrichExpiryInfo(i));

    if (options.status && options.status !== 'all') {
      if (options.status === 'expired') {
        enriched = enriched.filter((i) => i.isExpired);
      } else if (options.status === 'expiring_soon') {
        enriched = enriched.filter((i) => i.isExpiringSoon && !i.isExpired);
      } else if (options.status === 'fresh') {
        enriched = enriched.filter((i) => !i.isExpired && !i.isExpiringSoon);
      }
    }

    return enriched;
  }

  /**
   * Adds a new item or merges with an existing item of matching name and unit
   */
  public static async addPantryItem(
    userId: string,
    data: {
      name: string;
      quantity: number;
      unit?: string;
      category?: SupermarketAisle;
      expiryDate?: Date | string;
      icon?: string;
      notes?: string;
    }
  ): Promise<IPantryItem> {
    const trimmedName = data.name.trim();
    const cleanUnit = (data.unit || '').trim();

    // Check if an existing item has the same name and compatible unit
    const existing = await PantryItem.findOne({
      user: userId,
      name: { $regex: `^${trimmedName}$`, $options: 'i' },
      unit: cleanUnit,
    });

    if (existing) {
      existing.quantity = Math.round((existing.quantity + data.quantity) * 100) / 100;
      if (data.expiryDate) existing.expiryDate = new Date(data.expiryDate);
      if (data.category) existing.category = data.category;
      if (data.notes) existing.notes = data.notes;
      if (data.icon) existing.icon = data.icon;
      await existing.save();
      return this.enrichExpiryInfo(existing);
    }

    const newItem = await PantryItem.create({
      user: userId,
      name: trimmedName,
      quantity: Math.max(0.01, Math.round(data.quantity * 100) / 100),
      unit: cleanUnit,
      category: data.category || 'Pantry & Grains',
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      icon: data.icon || '🥫',
      notes: data.notes,
    });

    return this.enrichExpiryInfo(newItem);
  }

  /**
   * Updates an existing pantry item
   */
  public static async updatePantryItem(
    userId: string,
    itemId: string,
    updates: {
      name?: string;
      quantity?: number;
      unit?: string;
      category?: SupermarketAisle;
      expiryDate?: Date | string | null;
      icon?: string;
      notes?: string;
    }
  ): Promise<IPantryItem> {
    const item = await PantryItem.findOne({ _id: itemId, user: userId });
    if (!item) throw new Error('Pantry item not found.');

    if (updates.name !== undefined) item.name = updates.name.trim();
    if (updates.quantity !== undefined) item.quantity = Math.max(0.01, updates.quantity);
    if (updates.unit !== undefined) item.unit = (updates.unit || '').trim();
    if (updates.category !== undefined) item.category = updates.category;
    if (updates.expiryDate !== undefined) {
      item.expiryDate = updates.expiryDate ? new Date(updates.expiryDate) : undefined;
    }
    if (updates.icon !== undefined) item.icon = updates.icon;
    if (updates.notes !== undefined) item.notes = updates.notes;

    await item.save();
    return this.enrichExpiryInfo(item);
  }

  /**
   * Deletes a pantry item by ID
   */
  public static async deletePantryItem(userId: string, itemId: string): Promise<boolean> {
    const res = await PantryItem.deleteOne({ _id: itemId, user: userId });
    if (res.deletedCount === 0) throw new Error('Pantry item not found.');
    return true;
  }

  /**
   * Consumes a specific quantity of a pantry item
   */
  public static async consumeQuantity(
    userId: string,
    itemId: string,
    amountToConsume: number
  ): Promise<{ remaining: number; deleted: boolean }> {
    const item = await PantryItem.findOne({ _id: itemId, user: userId });
    if (!item) throw new Error('Pantry item not found.');

    if (amountToConsume >= item.quantity) {
      await item.deleteOne();
      return { remaining: 0, deleted: true };
    }

    item.quantity = Math.round((item.quantity - amountToConsume) * 100) / 100;
    await item.save();
    return { remaining: item.quantity, deleted: false };
  }
}
