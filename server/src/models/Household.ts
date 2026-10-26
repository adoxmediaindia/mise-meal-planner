import mongoose, { Schema, Document } from 'mongoose';

export type HouseholdMemberRole = 'owner' | 'admin' | 'member';

export interface IHouseholdMember {
  user: mongoose.Types.ObjectId;
  role: HouseholdMemberRole;
  joinedAt: Date;
}

export interface IHouseholdDoc extends Document {
  name: string;
  owner: mongoose.Types.ObjectId;
  members: IHouseholdMember[];
  shareMealPlan: boolean;
  shareGroceryList: boolean;
  sharePantry: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HouseholdMemberSchema = new Schema<IHouseholdMember>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      required: true,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const HouseholdSchema = new Schema<IHouseholdDoc>(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [HouseholdMemberSchema], default: [] },
    shareMealPlan: { type: Boolean, default: true },
    shareGroceryList: { type: Boolean, default: true },
    sharePantry: { type: Boolean, default: true },
  },
  { timestamps: true }
);

HouseholdSchema.index({ 'members.user': 1 });

export const Household = mongoose.model<IHouseholdDoc>('Household', HouseholdSchema);
