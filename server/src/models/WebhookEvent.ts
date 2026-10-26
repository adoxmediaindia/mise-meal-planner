import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  provider: 'stripe' | 'test';
  status: 'pending' | 'processed' | 'ignored' | 'failed' | 'retrying';
  payload: Record<string, any>;
  error?: string;
  processedAt: Date;
  createdAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    provider: { type: String, enum: ['stripe', 'test'], default: 'test' },
    status: {
      type: String,
      enum: ['pending', 'processed', 'ignored', 'failed', 'retrying'],
      default: 'processed',
      required: true,
    },
    payload: { type: Schema.Types.Mixed, default: {} },
    error: { type: String },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
