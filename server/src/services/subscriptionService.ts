import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Subscription, ISubscription, SubscriptionPlanId, BillingCycle } from '../models/Subscription.js';
import { BillingInvoice } from '../models/BillingInvoice.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { EntitlementService, UserUsageStats } from './entitlementService.js';

export interface SubscriptionStatusResponse {
  tier: 'free' | 'pro';
  status: string;
  isActive: boolean;
  billingCycle: BillingCycle;
  planId: SubscriptionPlanId;
  price: string;
  amount: number;
  currency: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  planDetails: {
    name: string;
    description: string;
    features: string[];
  };
  entitlements: ReturnType<typeof EntitlementService.getEntitlements>;
  usage: UserUsageStats;
}

export class SubscriptionService {
  /**
   * Retrieves or initializes the current subscription status with entitlements and usage
   */
  public static async getStatus(userId: string): Promise<SubscriptionStatusResponse> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Find active subscription record or create a baseline free subscription
    let sub = await Subscription.findOne({ user: userId }).sort({ createdAt: -1 });

    if (!sub) {
      const oneYearAhead = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      sub = await Subscription.create({
        user: user._id,
        planId: user.subscriptionTier === 'pro' ? 'mise_pro_monthly' : 'mise_free',
        status: user.subscriptionStatus === 'active' ? 'active' : 'trialing',
        billingCycle: user.billingCycle || 'monthly',
        amount: user.subscriptionTier === 'pro' ? 4.99 : 0,
        currency: 'usd',
        currentPeriodStart: new Date(),
        currentPeriodEnd: user.subscriptionExpiresAt || oneYearAhead,
        cancelAtPeriodEnd: false,
      });
    }

    const now = new Date();
    // Proactively reconcile stale expired subscriptions in database
    if (
      user.subscriptionTier === 'pro' &&
      user.role !== 'admin' &&
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt) <= now
    ) {
      user.subscriptionTier = 'free';
      user.subscriptionStatus = 'cancelled';
      await user.save();

      if (sub) {
        sub.status = 'canceled';
        sub.amount = 0;
        await sub.save();
      }
    }

    const entitlements = EntitlementService.getEntitlements(user);
    const usage = await EntitlementService.getUserUsageStats(userId);

    const isPro = entitlements.tier === 'pro';
    const isYearly = sub.billingCycle === 'yearly';

    return {
      tier: entitlements.tier,
      status: sub.status,
      isActive: isPro && sub.status === 'active',
      billingCycle: sub.billingCycle,
      planId: sub.planId,
      amount: sub.amount,
      currency: sub.currency,
      price: isPro
        ? isYearly
          ? '$49.99 / year ($4.16/mo)'
          : '$4.99 / month'
        : 'Free Starter',
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      planDetails: {
        name: isPro ? (isYearly ? 'Mise Pro Annual' : 'Mise Pro Monthly') : 'Mise Starter',
        description: isPro
          ? 'Full access to unlimited meal generations, unlimited pantry, and 10-member household sharing.'
          : 'Starter meal planning with 3 generations per week, 15 pantry staples, and 2 household members.',
        features: [
          isPro ? 'Unlimited weekly dinner planning' : 'Up to 3 meal plans per week',
          isPro ? 'Unlimited kitchen pantry inventory' : 'Up to 15 pantry ingredients',
          isPro ? 'Household sharing for up to 10 family members' : 'Household sharing for 2 members',
          'Pantry-aware recipe suggestions & auto grocery deductions',
          'Consolidated supermarket aisle sorting',
          'Strict allergy & dietary exclusion filters',
        ],
      },
      entitlements,
      usage,
    };
  }

  /**
   * Upgrades user to Pro Monthly or Pro Yearly
   */
  public static async upgrade(
    userId: string,
    planId: 'mise_pro_monthly' | 'mise_pro_yearly'
  ): Promise<{ subscription: ISubscription; message: string }> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const isYearly = planId === 'mise_pro_yearly';
    const amount = isYearly ? 49.99 : 4.99;
    const billingCycle: BillingCycle = isYearly ? 'yearly' : 'monthly';
    const durationDays = isYearly ? 365 : 30;

    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // Create or update subscription
    let sub = await Subscription.findOne({ user: userId });
    if (!sub) {
      sub = new Subscription({ user: user._id });
    }

    sub.planId = planId;
    sub.status = 'active';
    sub.billingCycle = billingCycle;
    sub.amount = amount;
    sub.currency = 'usd';
    sub.currentPeriodStart = periodStart;
    sub.currentPeriodEnd = periodEnd;
    sub.cancelAtPeriodEnd = false;
    sub.canceledAt = undefined;
    await sub.save();

    // Update user document
    user.subscriptionTier = 'pro';
    user.subscriptionStatus = 'active';
    user.billingCycle = billingCycle;
    user.subscriptionExpiresAt = periodEnd;
    await user.save();

    // Record billing invoice
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    await BillingInvoice.create({
      user: user._id,
      subscription: sub._id,
      invoiceNumber,
      amount,
      currency: 'usd',
      status: 'paid',
      billingCycle,
      planName: isYearly ? 'Mise Pro Annual Subscription' : 'Mise Pro Monthly Subscription',
      paidAt: new Date(),
    });

    return {
      subscription: sub,
      message: `Successfully upgraded to ${isYearly ? 'Mise Pro Annual ($49.99/yr)' : 'Mise Pro Monthly ($4.99/mo)'}. Your pro features are active immediately!`,
    };
  }

  /**
   * Simulates downgrade back to Free tier
   */
  public static async downgrade(userId: string): Promise<{ message: string }> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.subscriptionTier = 'free';
    user.subscriptionStatus = 'trial';
    user.billingCycle = 'monthly';
    user.subscriptionExpiresAt = undefined;
    await user.save();

    await Subscription.findOneAndUpdate(
      { user: userId },
      {
        planId: 'mise_free',
        status: 'trialing',
        amount: 0,
        cancelAtPeriodEnd: false,
      }
    );

    return { message: 'Switched to Free Starter plan.' };
  }

  /**
   * Cancels subscription at period end (preserves benefits until currentPeriodEnd)
   */
  public static async cancelSubscription(userId: string): Promise<{ subscription: ISubscription; message: string }> {
    const sub = await Subscription.findOne({ user: userId });
    if (!sub || sub.planId === 'mise_free') {
      throw new Error('No active Pro subscription to cancel.');
    }

    sub.cancelAtPeriodEnd = true;
    sub.canceledAt = new Date();
    await sub.save();

    return {
      subscription: sub,
      message: `Subscription scheduled to cancel on ${sub.currentPeriodEnd.toLocaleDateString()}. You will continue to have full Pro access until then.`,
    };
  }

  /**
   * Reactivates a canceled subscription before current period ends
   */
  public static async reactivateSubscription(userId: string): Promise<{ subscription: ISubscription; message: string }> {
    const sub = await Subscription.findOne({ user: userId });
    if (!sub || !sub.cancelAtPeriodEnd) {
      throw new Error('No pending cancellation to reactivate.');
    }

    sub.cancelAtPeriodEnd = false;
    sub.canceledAt = undefined;
    await sub.save();

    return {
      subscription: sub,
      message: 'Subscription successfully reactivated. Automatic renewal is resumed.',
    };
  }

  /**
   * Retrieves billing invoices for user
   */
  public static async getInvoices(userId: string): Promise<any[]> {
    return BillingInvoice.find({ user: userId }).sort({ createdAt: -1 });
  }

  /**
   * Cryptographically verifies Stripe webhook HMAC-SHA256 signature
   */
  public static verifyStripeSignature(
    rawPayload: string,
    signatureHeader: string,
    secret: string,
    toleranceSeconds: number = 300
  ): boolean {
    try {
      const parts = signatureHeader.split(',').reduce((acc: Record<string, string>, item) => {
        const [k, v] = item.trim().split('=');
        if (k && v) acc[k] = v;
        return acc;
      }, {});

      const timestamp = parts['t'];
      const v1Signature = parts['v1'];

      if (!timestamp || !v1Signature) {
        return false;
      }

      // Replay attack prevention: verify timestamp freshness within tolerance window
      const nowSec = Math.floor(Date.now() / 1000);
      const ts = parseInt(timestamp, 10);
      if (isNaN(ts) || Math.abs(nowSec - ts) > toleranceSeconds) {
        return false;
      }

      const signedPayload = `${timestamp}.${rawPayload}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'hex');
      const sigBuf = Buffer.from(v1Signature, 'hex');

      if (expectedBuf.length !== sigBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch {
      return false;
    }
  }

  /**
   * Processes webhook events with cryptographic validation, idempotency, retry safety, and out-of-order event protection
   */
  public static async processWebhook(
    payload: any,
    headers: Record<string, string | string[] | undefined>,
    rawBody?: Buffer | string
  ): Promise<{ received: boolean; event: string; status: string }> {
    const eventId = payload.id || payload.eventId || `evt_${crypto.randomBytes(12).toString('hex')}`;
    const eventType = payload.type || payload.event;

    if (!eventType) {
      throw new Error('Missing event type in webhook payload');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const isMockAllowed = !isProduction || process.env.ENABLE_MOCK_BILLING === 'true';

    // 1. Signature verification FIRST (Authentication before processing)
    const stripeSignatureHeader = (headers['stripe-signature'] || headers['Stripe-Signature']) as string | undefined;
    const testSignatureHeader = headers['x-mise-test-signature'] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let provider: 'stripe' | 'test' = 'test';

    if (webhookSecret && webhookSecret !== 'undefined' && webhookSecret !== '') {
      if (!stripeSignatureHeader) {
        throw new Error('Missing stripe-signature header for configured webhook secret');
      }

      // Cryptographic HMAC-SHA256 signature verification
      const rawText = rawBody
        ? (Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody)
        : (typeof payload === 'string' ? payload : JSON.stringify(payload));

      const isSignatureValid = this.verifyStripeSignature(rawText, stripeSignatureHeader, webhookSecret);
      if (!isSignatureValid) {
        throw new Error('Invalid Stripe webhook signature');
      }
      provider = 'stripe';
    } else if (isProduction && !isMockAllowed) {
      // In production mode with no webhook secret configured, fail closed!
      throw new Error('Webhook processing disabled in production: STRIPE_WEBHOOK_SECRET is not configured');
    } else if (!isProduction || isMockAllowed) {
      provider = 'test';
    } else {
      throw new Error('Unauthorized webhook: missing valid signature header');
    }

    // 2. Idempotency Check & Retry Support:
    // If event previously succeeded, ignore duplicate safely.
    // If event previously failed, allow retry.
    let eventRecord = await WebhookEvent.findOne({ eventId });
    if (eventRecord) {
      if (eventRecord.status === 'processed') {
        return {
          received: true,
          event: eventType,
          status: 'duplicate_ignored',
        };
      }
      eventRecord.status = 'retrying';
      eventRecord.payload = payload;
      await eventRecord.save();
    } else {
      eventRecord = await WebhookEvent.create({
        eventId,
        eventType,
        provider,
        status: 'pending',
        payload,
      });
    }

    // 3. Handle event types safely with user mapping, mismatch protection, and out-of-order event checks
    try {
      const dataObject = payload.data?.object || payload.data;
      const customerEmail = dataObject?.customer_email || dataObject?.email;
      const stripeCustomerId = dataObject?.customer;
      const metadataUserId = dataObject?.metadata?.userId;

      let user: any = null;

      if (metadataUserId && mongoose.Types.ObjectId.isValid(metadataUserId)) {
        user = await User.findById(metadataUserId);
      }
      if (!user && stripeCustomerId) {
        user = await User.findOne({ stripeCustomerId });
      }
      if (!user && customerEmail) {
        user = await User.findOne({ email: customerEmail.toLowerCase() });
      }

      if (user) {
        // Security Check: Customer ID mismatch protection
        if (stripeCustomerId && user.stripeCustomerId && user.stripeCustomerId !== stripeCustomerId) {
          throw new Error(
            `Customer ID mismatch: event customer ${stripeCustomerId} does not match user account customer ${user.stripeCustomerId}`
          );
        }
        if (stripeCustomerId && !user.stripeCustomerId) {
          user.stripeCustomerId = stripeCustomerId;
        }

        const sub = await Subscription.findOne({ user: user._id });
        const eventTimestampSec = payload.created || dataObject.created;

        // Security Check: Out-of-order event protection
        // If subscription was already cancelled and this event was created prior to cancellation, do not reactivate
        if (sub && sub.canceledAt && eventTimestampSec) {
          const eventTimeMs = eventTimestampSec * 1000;
          const cancelTimeMs = new Date(sub.canceledAt).getTime();
          if (eventTimeMs < cancelTimeMs) {
            console.warn(
              `Ignoring out-of-order webhook event ${eventId}: created at ${new Date(eventTimeMs).toISOString()} prior to cancellation at ${sub.canceledAt.toISOString()}`
            );
            eventRecord.status = 'processed';
            eventRecord.error = 'Out-of-order event ignored';
            await eventRecord.save();
            return { received: true, event: eventType, status: 'out_of_order_ignored' };
          }
        }

        switch (eventType) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated': {
            const status = dataObject.status; // 'active', 'trialing', 'past_due', 'canceled', 'unpaid'
            const isPaidActive = status === 'active' || status === 'trialing';

            user.subscriptionTier = isPaidActive ? 'pro' : 'free';
            user.subscriptionStatus = isPaidActive ? 'active' : 'cancelled';

            if (dataObject.current_period_end) {
              user.subscriptionExpiresAt = new Date(dataObject.current_period_end * 1000);
            } else if (!isPaidActive) {
              user.subscriptionExpiresAt = undefined;
            }
            await user.save();

            if (sub) {
              sub.status = isPaidActive ? 'active' : (status === 'past_due' ? 'past_due' : 'canceled');
              if (dataObject.current_period_end) {
                sub.currentPeriodEnd = new Date(dataObject.current_period_end * 1000);
              }
              await sub.save();
            }
            break;
          }

          case 'customer.subscription.deleted': {
            user.subscriptionTier = 'free';
            user.subscriptionStatus = 'cancelled';
            user.subscriptionExpiresAt = undefined;
            await user.save();

            if (sub) {
              sub.status = 'canceled';
              sub.cancelAtPeriodEnd = false;
              await sub.save();
            }
            break;
          }

          case 'invoice.payment_succeeded': {
            user.subscriptionTier = 'pro';
            user.subscriptionStatus = 'active';
            if (dataObject.lines?.data?.[0]?.period?.end) {
              user.subscriptionExpiresAt = new Date(dataObject.lines.data[0].period.end * 1000);
            }
            await user.save();

            if (sub) {
              sub.status = 'active';
              sub.cancelAtPeriodEnd = false;
              if (dataObject.lines?.data?.[0]?.period?.end) {
                sub.currentPeriodEnd = new Date(dataObject.lines.data[0].period.end * 1000);
              }
              await sub.save();
            }

            const invNumber = dataObject.number || `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
            await BillingInvoice.create({
              user: user._id,
              invoiceNumber: invNumber,
              amount: (dataObject.amount_paid || 499) / 100,
              currency: dataObject.currency || 'usd',
              status: 'paid',
              billingCycle: 'monthly',
              planName: 'Mise Pro Monthly',
              paidAt: new Date(),
            });
            break;
          }

          case 'invoice.payment_failed': {
            user.subscriptionTier = 'free';
            user.subscriptionStatus = 'cancelled';
            user.subscriptionExpiresAt = undefined;
            await user.save();

            if (sub) {
              sub.status = 'past_due';
              await sub.save();
            }
            break;
          }
        }
      }

      eventRecord.status = 'processed';
      eventRecord.error = undefined;
      await eventRecord.save();

      return { received: true, event: eventType, status: 'processed' };
    } catch (err: any) {
      eventRecord.status = 'failed';
      eventRecord.error = err.message;
      await eventRecord.save();
      throw err;
    }
  }
}
