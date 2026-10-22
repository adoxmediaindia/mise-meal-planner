import mongoose, { Schema, Document } from 'mongoose';
import { DayOfWeek } from '../types/index.js';

export interface IDinnerSlot {
  day: DayOfWeek;
  recipe: mongoose.Types.ObjectId;
  isCooked: boolean;
}

export interface IMealPlanDoc extends Document {
  user: mongoose.Types.ObjectId;
  weekStartDate: Date;
  dinners: IDinnerSlot[];
  householdSize: number;
  estimatedCost: number;
  budgetLimit: number;
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

const MealPlanSchema = new Schema<IMealPlanDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekStartDate: { type: Date, required: true, default: () => new Date() },
    dinners: [DinnerSlotSchema],
    householdSize: { type: Number, required: true, default: 2 },
    estimatedCost: { type: Number, required: true, default: 0 },
    budgetLimit: { type: Number, required: true, default: 40 },
  },
  { timestamps: true }
);

export const MealPlan = mongoose.model<IMealPlanDoc>('MealPlan', MealPlanSchema);
