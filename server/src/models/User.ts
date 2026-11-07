import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  subscriptionTier: 'free' | 'pro';
  subscriptionStatus: 'active' | 'trial' | 'cancelled';
  billingCycle?: 'monthly' | 'yearly';
  subscriptionExpiresAt?: Date;
  stripeCustomerId?: string;
  planGenerationsThisWeek?: number;
  lastPlanGenerationAt?: Date;
  aiGenerationsThisWeek?: number;
  lastAiGenerationAt?: Date;
  aiUsageTimestamps?: Date[];
  favorites: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  preferredLanguage?: string;
  ageRange?: string;
  primaryGoal?: string;
  cookingBarrier?: string;
  shoppingSavingsConfidence?: string;
  usualCookingTime?: string;
  referralSource?: string;
  countryCode?: string;
  countryName?: string;
  currencyCode?: string;
  householdSize?: number;
  cookingDays?: string[];
  weeklyBudget?: number;
  weeklyBudgetCurrency?: string;
  mealMoods?: string[];
  dietaryPreferences?: string[];
  allergies?: string[];
  appliances?: string[];
  trialReminderPreference?: '1_day_before' | '2_days_before';
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  onboardingPlanGenerationStartedAt?: Date;
  onboardingPlanGenerationToken?: string;
  onboardingPlanGenerationLeaseUntil?: Date;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    subscriptionTier: { type: String, enum: ['free', 'pro'], default: 'free', index: true },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'trial', 'cancelled'],
      default: 'trial',
    },
    billingCycle: { type: String, enum: ['monthly', 'yearly'] },
    subscriptionExpiresAt: { type: Date },
    stripeCustomerId: { type: String },
    planGenerationsThisWeek: { type: Number, default: 0 },
    lastPlanGenerationAt: { type: Date },
    aiGenerationsThisWeek: { type: Number, default: 0 },
    lastAiGenerationAt: { type: Date },
    aiUsageTimestamps: [{ type: Date }],
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    preferredLanguage: { type: String, default: 'en' },
    ageRange: { type: String },
    primaryGoal: { type: String },
    cookingBarrier: {
      type: String,
      enum: [
        'Lack of time',
        'Too tired after work',
        'I find cooking difficult',
        'I struggle for inspiration',
      ],
      default: null,
    },
    shoppingSavingsConfidence: {
      type: String,
      enum: ['Definitely', 'Most likely', 'Somewhat', 'Not really'],
      default: null,
    },
    usualCookingTime: {
      type: String,
      enum: [
        '15–30 min',
        '30–45 min',
        '45–60 min',
        '60+ min',
        '15-30 min',
        '30-45 min',
        '45-60 min',
      ],
      default: null,
    },
    referralSource: {
      type: String,
      enum: [
        'Instagram',
        'TikTok',
        'YouTube',
        'Facebook',
        'Word of mouth',
        'Google Play',
      ],
      default: null,
    },
    countryCode: { type: String, default: null },
    countryName: { type: String, default: null },
    currencyCode: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD', 'BRL', 'INR'],
      default: null,
    },
    householdSize: { type: Number, min: 1, max: 20, default: null },
    cookingDays: { type: [String], default: [] },
    weeklyBudget: { type: Number, min: 0, default: null },
    weeklyBudgetCurrency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD', 'BRL', 'INR'],
      default: null,
    },
    mealMoods: { type: [String], default: [] },
    dietaryPreferences: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    appliances: { type: [String], default: [] },
    trialReminderPreference: {
      type: String,
      enum: ['1_day_before', '2_days_before'],
      default: '1_day_before',
    },
    onboardingStep: { type: Number, default: 1 },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingPlanGenerationStartedAt: { type: Date },
    onboardingPlanGenerationToken: { type: String },
    onboardingPlanGenerationLeaseUntil: { type: Date },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
