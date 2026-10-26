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
  favorites: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
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
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
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
