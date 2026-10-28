import mongoose, { Schema, Document } from 'mongoose';
import { SupermarketAisle } from '../types/index.js';

export interface IPantryItemDoc extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
  category: SupermarketAisle;
  expiryDate?: Date;
  icon?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PantryItemSchema = new Schema<IPantryItemDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: false, trim: true, default: '' },
    category: {
      type: String,
      required: true,
      enum: [
        'Fresh Produce',
        'Meat & Seafood',
        'Dairy & Refrigerated',
        'Bakery',
        'Pantry & Grains',
        'Spices & Condiments',
        'Frozen',
      ],
      default: 'Pantry & Grains',
    },
    expiryDate: { type: Date },
    icon: { type: String, default: '🥫' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

PantryItemSchema.index({ user: 1, name: 1 });
PantryItemSchema.index({ user: 1, expiryDate: 1 });

export const PantryItem = mongoose.model<IPantryItemDoc>('PantryItem', PantryItemSchema);
