import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminAuditLog extends Document {
  adminUser: mongoose.Types.ObjectId;
  adminEmail: string;
  targetUser?: mongoose.Types.ObjectId;
  targetEmail?: string;
  action: string;
  details: Record<string, any>;
  ip?: string;
  createdAt: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    adminUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adminEmail: { type: String, required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    targetEmail: { type: String },
    action: { type: String, required: true, index: true },
    details: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AdminAuditLog = mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema);
