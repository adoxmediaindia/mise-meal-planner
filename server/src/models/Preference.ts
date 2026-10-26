import mongoose, { Schema, Document } from 'mongoose';
import {
  DietaryNeed,
  Allergen,
  KitchenEquipment,
  MealVibe,
  DayOfWeek,
  Supermarket,
} from '../types/index.js';

export interface IPreference extends Document {
  user: mongoose.Types.ObjectId;
  supermarket: Supermarket;
  householdSize: number;
  cookingDays: DayOfWeek[];
  weeklyBudget: number;
  dietaryNeeds: DietaryNeed[];
  allergies: Allergen[];
  equipment: KitchenEquipment[];
  vibes: MealVibe[];
  maxCookTimeMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PreferenceSchema = new Schema<IPreference>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    supermarket: {
      type: String,
      default: 'Aldi',
      enum: [
        'Aldi',
        'Walmart',
        'Kroger',
        'Costco',
        'Publix',
        'Safeway',
        'H-E-B',
        'Whole Foods',
        "Trader Joe's",
        'Food Lion',
        'Sprouts',
      ],
    },
    householdSize: { type: Number, default: 2, min: 1, max: 12 },
    cookingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    weeklyBudget: { type: Number, default: 40, min: 10 },
    dietaryNeeds: { type: [String], default: ['None'] },
    allergies: { type: [String], default: [] },
    equipment: { type: [String], default: ['Hob Only', 'Oven'] },
    vibes: { type: [String], default: ['Speedy Meals', 'Family Favs'] },
    maxCookTimeMinutes: { type: Number, default: 60 },
  },
  { timestamps: true }
);

export const Preference = mongoose.model<IPreference>('Preference', PreferenceSchema);
