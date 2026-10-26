import mongoose, { Schema, Document } from 'mongoose';
import { HouseholdMemberRole } from './Household.js';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'revoked' | 'expired';

export interface IHouseholdInvitationDoc extends Document {
  household: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  inviteeEmail: string;
  inviteToken: string;
  role: HouseholdMemberRole;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HouseholdInvitationSchema = new Schema<IHouseholdInvitationDoc>(
  {
    household: { type: Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inviteeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    inviteToken: { type: String, required: true, unique: true, index: true },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'rejected', 'revoked', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
      index: true,
    },
  },
  { timestamps: true }
);

HouseholdInvitationSchema.index({ household: 1, inviteeEmail: 1, status: 1 });

export const HouseholdInvitation = mongoose.model<IHouseholdInvitationDoc>(
  'HouseholdInvitation',
  HouseholdInvitationSchema
);
