import mongoose, { Schema, Document } from 'mongoose';
import { SupermarketAisle, Supermarket } from '../types/index.js';

export interface IShoppingItem {
  id: string;
  name: string;
  totalQuantity: number;
  unit: string;
  aisle: SupermarketAisle;
  estimatedCost: number;
  isBought: boolean;
  recipeTitles: string[];
  icon?: string;
  isCustom?: boolean;
  pantryNote?: string;
}

export interface IShoppingListDoc extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  supermarket: Supermarket;
  items: IShoppingItem[];
  totalEstimatedCost: number;
  itemsBoughtCount: number;
  totalItemsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShoppingItemSchema = new Schema<IShoppingItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    totalQuantity: { type: Number, required: true },
    unit: { type: String, default: '' },
    aisle: {
      type: String,
      required: true,
      enum: [
        'Fresh Produce',
        'Meat & Seafood',
        'Dairy & Refrigerated',
        'Pantry & Grains',
        'Bakery',
        'Spices & Condiments',
        'Frozen',
      ],
    },
    estimatedCost: { type: Number, required: true, default: 0 },
    isBought: { type: Boolean, default: false },
    recipeTitles: { type: [String], default: [] },
    icon: { type: String, default: '🛒' },
    isCustom: { type: Boolean, default: false },
    pantryNote: { type: String },
  },
  { _id: false }
);

const ShoppingListSchema = new Schema<IShoppingListDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: 'MealPlan', required: true },
    supermarket: { type: String, required: true, default: 'Aldi' },
    items: [ShoppingItemSchema],
    totalEstimatedCost: { type: Number, default: 0 },
    itemsBoughtCount: { type: Number, default: 0 },
    totalItemsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ShoppingList = mongoose.model<IShoppingListDoc>('ShoppingList', ShoppingListSchema);
