import mongoose, { Schema, Document } from 'mongoose';
import {
  Cuisine,
  MealVibe,
  DietaryNeed,
  Allergen,
  KitchenEquipment,
  SupermarketAisle,
} from '../types/index.js';

export interface IIngredientDoc {
  name: string;
  quantity: number;
  unit: string;
  aisle: SupermarketAisle;
  estimatedCost: number;
  icon?: string;
}

export interface IRecipeDoc extends Document {
  title: string;
  slug: string;
  description: string;
  image: string;
  cuisine: Cuisine;
  vibes: MealVibe[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  calories: number;
  carbsGrams: number;
  proteinGrams: number;
  fatGrams: number;
  ingredients: IIngredientDoc[];
  instructions: string[];
  dietaryTags: DietaryNeed[];
  allergens: Allergen[];
  equipmentNeeded: KitchenEquipment[];
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<IIngredientDoc>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
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
    estimatedCost: { type: Number, required: true, default: 1.5 },
    icon: { type: String, default: '🥘' },
  },
  { _id: false }
);

const RecipeSchema = new Schema<IRecipeDoc>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    cuisine: {
      type: String,
      required: true,
      index: true,
      enum: ['Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean', 'British'],
    },
    vibes: { type: [String], index: true, default: [] },
    prepTimeMinutes: { type: Number, required: true, default: 15 },
    cookTimeMinutes: { type: Number, required: true, default: 20 },
    servings: { type: Number, required: true, default: 2 },
    calories: { type: Number, required: true },
    carbsGrams: { type: Number, required: true },
    proteinGrams: { type: Number, required: true },
    fatGrams: { type: Number, required: true },
    ingredients: [IngredientSchema],
    instructions: { type: [String], required: true },
    dietaryTags: { type: [String], index: true, default: [] },
    allergens: { type: [String], index: true, default: [] },
    equipmentNeeded: { type: [String], default: ['Hob Only'] },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Field indexes are defined inline on the schema fields above

export const Recipe = mongoose.model<IRecipeDoc>('Recipe', RecipeSchema);
