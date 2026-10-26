import mongoose, { Schema, Document } from 'mongoose';
import { DayOfWeek, MealType } from '../types/index.js';

export interface IDinnerSlot {
  day: DayOfWeek;
  recipe: mongoose.Types.ObjectId;
  isCooked: boolean;
}

export interface IMealSlotDoc {
  id: string;
  day: DayOfWeek;
  mealType: MealType;
  recipe: mongoose.Types.ObjectId;
  servings?: number;
  isCooked: boolean;
}

export interface IMealPlanDoc extends Document {
  user: mongoose.Types.ObjectId;
  weekStartDate: Date;
  dinners: IDinnerSlot[];
  meals: IMealSlotDoc[];
  householdSize: number;
  estimatedCost: number;
  budgetLimit: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DinnerSlotSchema = new Schema<IDinnerSlot>(
  {
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    isCooked: { type: Boolean, default: false },
  },
  { _id: false }
);

const MealSlotSchema = new Schema<IMealSlotDoc>(
  {
    id: { type: String, required: true },
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    mealType: {
      type: String,
      required: true,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      default: 'dinner',
    },
    recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    servings: { type: Number },
    isCooked: { type: Boolean, default: false },
  },
  { _id: false }
);

const MealPlanSchema = new Schema<IMealPlanDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekStartDate: { type: Date, required: true, default: () => new Date() },
    dinners: [DinnerSlotSchema],
    meals: { type: [MealSlotSchema], default: [] },
    householdSize: { type: Number, required: true, default: 2 },
    estimatedCost: { type: Number, required: true, default: 0 },
    budgetLimit: { type: Number, required: true, default: 40 },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const MealPlan = mongoose.model<IMealPlanDoc>('MealPlan', MealPlanSchema);
