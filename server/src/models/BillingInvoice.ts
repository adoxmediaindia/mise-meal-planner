import mongoose, { Schema, Document } from 'mongoose';

export interface IBillingInvoice extends Document {
  user: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  billingCycle: 'monthly' | 'yearly';
  planName: string;
  paidAt?: Date;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillingInvoiceSchema = new Schema<IBillingInvoice>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed'],
      default: 'paid',
      required: true,
    },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    planName: { type: String, required: true },
    paidAt: { type: Date, default: Date.now },
    pdfUrl: { type: String },
  },
  { timestamps: true }
);

export const BillingInvoice = mongoose.model<IBillingInvoice>('BillingInvoice', BillingInvoiceSchema);
