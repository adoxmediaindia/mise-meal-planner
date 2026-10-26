import mongoose, { Schema, Document } from 'mongoose';

export type SubscriptionPlanId = 'mise_free' | 'mise_pro_monthly' | 'mise_pro_yearly';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
export type BillingCycle = 'monthly' | 'yearly';

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: {
      type: String,
      enum: ['mise_free', 'mise_pro_monthly', 'mise_pro_yearly'],
      default: 'mise_free',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid'],
      default: 'trialing',
      required: true,
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
      required: true,
    },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date },
    stripeCustomerId: { type: String, index: true },
    stripeSubscriptionId: { type: String, index: true },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
