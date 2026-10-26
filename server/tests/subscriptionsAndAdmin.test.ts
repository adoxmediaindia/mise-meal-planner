import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/index.js';
import { User } from '../src/models/User.js';
import { Recipe } from '../src/models/Recipe.js';
import { MealPlan } from '../src/models/MealPlan.js';
import { PantryItem } from '../src/models/PantryItem.js';
import { Household } from '../src/models/Household.js';
import { Subscription } from '../src/models/Subscription.js';
import { BillingInvoice } from '../src/models/BillingInvoice.js';
import { WebhookEvent } from '../src/models/WebhookEvent.js';
import { AdminAuditLog } from '../src/models/AdminAuditLog.js';
import crypto from 'crypto';

describe('Phase 5 — SaaS Subscriptions, Entitlements & Admin Dashboard Suite', () => {
  let regularToken: string;
  let regularUserId: string;
  const regularEmail = 'free_user_p5@example.com';

  let adminToken: string;
  let adminUserId: string;
  const adminEmail = 'super_admin_p5@example.com';

  let otherToken: string;
  let otherUserId: string;
  const otherEmail = 'other_user_p5@example.com';

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/mise_meal_planner_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up test data
    await User.deleteMany({
      email: { $in: [regularEmail, adminEmail, otherEmail] },
    });

    // Seed dummy recipe if none exists
    const existingRecipe = await Recipe.findOne();
    if (!existingRecipe) {
      await Recipe.create({
        title: 'Entitlement Test Pasta',
        slug: 'entitlement-test-pasta',
        description: 'Test recipe for Phase 5',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        cuisine: 'Italian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 450,
        carbsGrams: 50,
        proteinGrams: 20,
        fatGrams: 10,
        ingredients: [
          { name: 'Olive Oil', quantity: 15, unit: 'ml', aisle: 'Pantry & Grains', estimatedCost: 0.5 },
          { name: 'Pasta', quantity: 200, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.0 },
        ],
        instructions: ['Boil pasta', 'Toss with olive oil'],
        dietaryTags: ['Vegetarian'],
        allergens: ['Gluten'],
        equipmentNeeded: ['Hob Only'],
      });
    }

    const secret = process.env.JWT_SECRET || 'mise_meal_planner_jwt_secret_dev_key_2026';

    // 1. Create Regular Free User
    const regUser = await User.create({
      name: 'Free Member',
      email: regularEmail,
      password: 'Password123!',
      role: 'user',
      subscriptionTier: 'free',
      subscriptionStatus: 'trial',
    });
    regularUserId = regUser._id.toString();
    regularToken = jwt.sign(
      { id: regularUserId, email: regularEmail, role: 'user', subscriptionTier: 'free' },
      secret
    );

    // 2. Create Admin User
    const adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: 'Password123!',
      role: 'admin',
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
    });
    adminUserId = adminUser._id.toString();
    adminToken = jwt.sign(
      { id: adminUserId, email: adminEmail, role: 'admin', subscriptionTier: 'pro' },
      secret
    );

    // 3. Create Other User
    const otherUser = await User.create({
      name: 'Other Member',
      email: otherEmail,
      password: 'Password123!',
      role: 'user',
      subscriptionTier: 'free',
      subscriptionStatus: 'trial',
    });
    otherUserId = otherUser._id.toString();
    otherToken = jwt.sign(
      { id: otherUserId, email: otherEmail, role: 'user', subscriptionTier: 'free' },
      secret
    );
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({
      email: { $in: [regularEmail, adminEmail, otherEmail] },
    });
    await MealPlan.deleteMany({ user: { $in: [regularUserId, otherUserId, adminUserId] } });
    await PantryItem.deleteMany({ user: { $in: [regularUserId, otherUserId, adminUserId] } });
    await Household.deleteMany({ owner: { $in: [regularUserId, otherUserId, adminUserId] } });
    await Subscription.deleteMany({ user: { $in: [regularUserId, otherUserId, adminUserId] } });
    await BillingInvoice.deleteMany({ user: { $in: [regularUserId, otherUserId, adminUserId] } });
  });

  // --------------------------------------------------------------------------
  // 1. FREE TIER ENTITLEMENT LIMITS
  // --------------------------------------------------------------------------
  describe('1. Free Tier Entitlement Enforcement', () => {
    it('enforces weekly plan generation limit (3/week on Free tier)', async () => {
      // 1st generation (already done on register or generate now)
      // Let's create dummy past plans to bring recent weekly count to 3
      const pastDate = new Date(Date.now() - 1 * 86400000);
      await MealPlan.create([
        {
          user: regularUserId,
          weekStartDate: pastDate.toISOString(),
          dinners: [],
          meals: [],
          householdSize: 2,
          estimatedCost: 30,
          budgetLimit: 40,
          createdAt: pastDate,
        },
        {
          user: regularUserId,
          weekStartDate: pastDate.toISOString(),
          dinners: [],
          meals: [],
          householdSize: 2,
          estimatedCost: 30,
          budgetLimit: 40,
          createdAt: pastDate,
        },
        {
          user: regularUserId,
          weekStartDate: pastDate.toISOString(),
          dinners: [],
          meals: [],
          householdSize: 2,
          estimatedCost: 30,
          budgetLimit: 40,
          createdAt: pastDate,
        },
      ]);

      // Attempt 4th generation
      const res = await request(app)
        .post('/api/v1/plan/generate')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UPGRADE_REQUIRED');
      expect(res.body.feature).toBe('maxWeeklyGenerations');
      expect(res.body.limit).toBe(3);
      expect(res.body.error).toMatch(/Weekly meal plan generation limit reached/i);
    });

    it('enforces pantry items limit (15 items on Free tier)', async () => {
      // Fill up to 15 items
      const itemsToSeed = [];
      for (let i = 1; i <= 15; i++) {
        itemsToSeed.push({
          user: regularUserId,
          name: `Free Staple ${i}`,
          quantity: 1,
          unit: 'can',
          category: 'Pantry & Grains',
        });
      }
      await PantryItem.deleteMany({ user: regularUserId });
      await PantryItem.insertMany(itemsToSeed);

      // Attempt to add 16th item
      const res = await request(app)
        .post('/api/v1/pantry')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'Excess Olive Oil',
          quantity: 500,
          unit: 'ml',
          category: 'Pantry & Grains',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UPGRADE_REQUIRED');
      expect(res.body.feature).toBe('maxPantryItems');
      expect(res.body.limit).toBe(15);
      expect(res.body.error).toMatch(/Pantry inventory limit reached/i);
    });

    it('enforces household member limit (2 members on Free tier)', async () => {
      // Create a household for regular user
      const hhRes = await request(app)
        .post('/api/v1/household')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ name: 'Free Tier House' });
      expect(hhRes.status).toBe(201);

      // 1st invite -> Total occupants becomes 2 (owner + 1 invitee)
      const inv1 = await request(app)
        .post('/api/v1/household/invitations')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ email: 'member1@example.com', role: 'member' });
      expect(inv1.status).toBe(201);

      // 2nd invite -> Should be blocked because max is 2
      const inv2 = await request(app)
        .post('/api/v1/household/invitations')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ email: 'member2@example.com', role: 'member' });

      expect(inv2.status).toBe(403);
      expect(inv2.body.success).toBe(false);
      expect(inv2.body.code).toBe('UPGRADE_REQUIRED');
      expect(inv2.body.feature).toBe('maxHouseholdMembers');
      expect(inv2.body.limit).toBe(2);
    });

    it('preserves cross-user entitlement isolation', async () => {
      // Other user (under 15 items) can add pantry item without restriction
      await PantryItem.deleteMany({ user: otherUserId });
      const res = await request(app)
        .post('/api/v1/pantry')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          name: 'Other User Rice',
          quantity: 1,
          unit: 'kg',
          category: 'Pantry & Grains',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. SUBSCRIPTION MANAGEMENT & UPGRADE FLOWS
  // --------------------------------------------------------------------------
  describe('2. Subscription Lifecycle & Billing Management', () => {
    it('retrieves subscription status and usage statistics', async () => {
      const res = await request(app)
        .get('/api/v1/subscriptions/status')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tier).toBe('free');
      expect(res.body.data.entitlements.maxWeeklyGenerations).toBe(3);
      expect(res.body.data.entitlements.maxPantryItems).toBe(15);
      expect(res.body.data.usage).toBeDefined();
      expect(res.body.data.usage.pantry.count).toBe(15);
      expect(res.body.data.usage.pantry.isLimitReached).toBe(true);
    });

    it('upgrades user to Mise Pro Monthly ($4.99/mo) and records an invoice', async () => {
      const res = await request(app)
        .post('/api/v1/subscriptions/upgrade')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ planId: 'mise_pro_monthly' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.billingCycle).toBe('monthly');
      expect(res.body.data.amount).toBe(4.99);

      // Verify user document updated
      const updatedUser = await User.findById(regularUserId);
      expect(updatedUser?.subscriptionTier).toBe('pro');
      expect(updatedUser?.subscriptionStatus).toBe('active');

      // Verify billing invoice was generated
      const invoicesRes = await request(app)
        .get('/api/v1/subscriptions/invoices')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(invoicesRes.status).toBe(200);
      expect(invoicesRes.body.count).toBeGreaterThanOrEqual(1);
      expect(invoicesRes.body.data[0].amount).toBe(4.99);
      expect(invoicesRes.body.data[0].status).toBe('paid');
    });

    it('allows Pro user to exceed free pantry limit immediately', async () => {
      // User is now Pro -> Adding 16th pantry item succeeds!
      const res = await request(app)
        .post('/api/v1/pantry')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'Pro Premium Truffle Oil',
          quantity: 100,
          unit: 'ml',
          category: 'Pantry & Grains',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Pro Premium Truffle Oil');
    });

    it('cancels subscription at period end and reactivates before expiry', async () => {
      // Cancel
      const cancelRes = await request(app)
        .post('/api/v1/subscriptions/cancel')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.cancelAtPeriodEnd).toBe(true);

      // Reactivate
      const reactivateRes = await request(app)
        .post('/api/v1/subscriptions/reactivate')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.cancelAtPeriodEnd).toBe(false);
    });

    it('blocks mock upgrades in production mode (403 Forbidden)', async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevMock = process.env.ENABLE_MOCK_BILLING;
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_MOCK_BILLING;

      try {
        const res = await request(app)
          .post('/api/v1/subscriptions/mock-upgrade')
          .set('Authorization', `Bearer ${regularToken}`);

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('MOCK_UPGRADES_DISABLED');
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevMock !== undefined) process.env.ENABLE_MOCK_BILLING = prevMock;
      }
    });

    it('blocks direct self-upgrades without payment verification in production (402 Payment Required)', async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevMock = process.env.ENABLE_MOCK_BILLING;
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_MOCK_BILLING;

      try {
        const res = await request(app)
          .post('/api/v1/subscriptions/upgrade')
          .set('Authorization', `Bearer ${regularToken}`)
          .send({ planId: 'mise_pro_monthly' });

        expect(res.status).toBe(402);
        expect(res.body.code).toBe('PAYMENT_VERIFICATION_REQUIRED');
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevMock !== undefined) process.env.ENABLE_MOCK_BILLING = prevMock;
      }
    });

    it('revokes Pro entitlements when subscription expires and reconciles in DB', async () => {
      // Set user expiration date in the past
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await User.findByIdAndUpdate(regularUserId, {
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: pastDate,
      });

      // Calling getStatus should reconcile to Free and return Free entitlements
      const res = await request(app)
        .get('/api/v1/subscriptions/status')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tier).toBe('free');

      const userInDb = await User.findById(regularUserId);
      expect(userInDb?.subscriptionTier).toBe('free');
      expect(userInDb?.subscriptionStatus).toBe('cancelled');
    });
  });

  // --------------------------------------------------------------------------
  // 3. WEBHOOK SECURITY & IDEMPOTENCY
  // --------------------------------------------------------------------------
  describe('3. Webhook Handling, Idempotency & Security', () => {
    const testEventId = `evt_test_${Date.now()}`;

    it('rejects unverified webhooks when secret is expected', async () => {
      const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_key';

      try {
        const res = await request(app)
          .post('/api/v1/subscriptions/webhook')
          .send({
            id: 'evt_unverified_1',
            type: 'customer.subscription.updated',
            data: { email: otherEmail, tier: 'pro', status: 'active' },
          });

        // Without signature, rejected
        expect(res.status).toBe(400);
      } finally {
        if (originalSecret) {
          process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
        } else {
          delete process.env.STRIPE_WEBHOOK_SECRET;
        }
      }
    });

    it('processes verified webhook event and updates user subscription', async () => {
      const res = await request(app)
        .post('/api/v1/subscriptions/webhook')
        .set('x-mise-test-signature', 'test_verified')
        .send({
          id: testEventId,
          type: 'customer.subscription.updated',
          data: {
            customer_email: otherEmail,
            tier: 'pro',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      const updatedOther = await User.findById(otherUserId);
      expect(updatedOther?.subscriptionTier).toBe('pro');
    });

    it('handles duplicate webhook event idempotently without re-execution', async () => {
      // Resend identical eventId
      const res = await request(app)
        .post('/api/v1/subscriptions/webhook')
        .set('x-mise-test-signature', 'test_verified')
        .send({
          id: testEventId,
          type: 'customer.subscription.updated',
          data: {
            customer_email: otherEmail,
            tier: 'free',
            status: 'cancelled',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('duplicate_ignored');

      // Check that user was NOT modified by duplicate replay
      const otherUser = await User.findById(otherUserId);
      expect(otherUser?.subscriptionTier).toBe('pro');
    });

    it('cryptographically validates genuine HMAC-SHA256 Stripe signatures', async () => {
      const secret = 'whsec_cryptographic_test_key_123456';
      process.env.STRIPE_WEBHOOK_SECRET = secret;

      try {
        const payload = {
          id: `evt_crypto_valid_${Date.now()}`,
          type: 'customer.subscription.updated',
          data: {
            customer_email: otherEmail,
            tier: 'pro',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
          },
        };

        const ts = Math.floor(Date.now() / 1000);
        const raw = JSON.stringify(payload);
        const validSig = crypto.createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex');
        const validHeader = `t=${ts},v1=${validSig}`;

        const res = await request(app)
          .post('/api/v1/subscriptions/webhook')
          .set('stripe-signature', validHeader)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.received).toBe(true);
      } finally {
        delete process.env.STRIPE_WEBHOOK_SECRET;
      }
    });

    it('rejects tampered or forged HMAC-SHA256 signatures (400 Bad Request)', async () => {
      const secret = 'whsec_cryptographic_test_key_123456';
      process.env.STRIPE_WEBHOOK_SECRET = secret;

      try {
        const payload = {
          id: `evt_crypto_forged_${Date.now()}`,
          type: 'customer.subscription.updated',
          data: { customer_email: otherEmail, tier: 'pro', status: 'active' },
        };

        const ts = Math.floor(Date.now() / 1000);
        const forgedHeader = `t=${ts},v1=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`;

        const res = await request(app)
          .post('/api/v1/subscriptions/webhook')
          .set('stripe-signature', forgedHeader)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid Stripe webhook signature/i);
      } finally {
        delete process.env.STRIPE_WEBHOOK_SECRET;
      }
    });

    it('rejects expired replay attacks where signature timestamp is too old', async () => {
      const secret = 'whsec_cryptographic_test_key_123456';
      process.env.STRIPE_WEBHOOK_SECRET = secret;

      try {
        const payload = {
          id: `evt_crypto_expired_${Date.now()}`,
          type: 'customer.subscription.updated',
          data: { customer_email: otherEmail, tier: 'pro', status: 'active' },
        };

        // Timestamp is 10 minutes (600 seconds) in the past
        const oldTs = Math.floor(Date.now() / 1000) - 600;
        const raw = JSON.stringify(payload);
        const sig = crypto.createHmac('sha256', secret).update(`${oldTs}.${raw}`).digest('hex');
        const expiredHeader = `t=${oldTs},v1=${sig}`;

        const res = await request(app)
          .post('/api/v1/subscriptions/webhook')
          .set('stripe-signature', expiredHeader)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid Stripe webhook signature/i);
      } finally {
        delete process.env.STRIPE_WEBHOOK_SECRET;
      }
    });

    it('fails closed in production mode when webhook secret is missing', async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevMock = process.env.ENABLE_MOCK_BILLING;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_MOCK_BILLING;

      try {
        const res = await request(app)
          .post('/api/v1/subscriptions/webhook')
          .send({
            id: 'evt_prod_fail_closed',
            type: 'customer.subscription.updated',
            data: { email: otherEmail },
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/STRIPE_WEBHOOK_SECRET is not configured/i);
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevMock !== undefined) process.env.ENABLE_MOCK_BILLING = prevMock;
      }
    });

    it('rejects customer ID mismatches to prevent granting entitlements to wrong user', async () => {
      // Associate otherUser with stripeCustomerId 'cus_registered_111'
      await User.findByIdAndUpdate(otherUserId, { stripeCustomerId: 'cus_registered_111' });

      const res = await request(app)
        .post('/api/v1/subscriptions/webhook')
        .set('x-mise-test-signature', 'test_verified')
        .send({
          id: `evt_mismatch_${Date.now()}`,
          type: 'customer.subscription.updated',
          data: {
            customer: 'cus_different_999', // Mismatch!
            customer_email: otherEmail,
            tier: 'pro',
            status: 'active',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Customer ID mismatch/i);
    });

    it('ignores out-of-order webhook events created before subscription cancellation', async () => {
      // Cancel other user subscription at a specific known time
      const cancelTime = new Date('2026-10-24T10:00:00Z');
      await Subscription.findOneAndUpdate(
        { user: otherUserId },
        { status: 'canceled', cancelAtPeriodEnd: true, canceledAt: cancelTime },
        { upsert: true }
      );
      await User.findByIdAndUpdate(otherUserId, {
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled',
      });

      // Send payment_succeeded webhook whose creation timestamp was BEFORE the cancellation (09:59:00Z)
      const res = await request(app)
        .post('/api/v1/subscriptions/webhook')
        .set('x-mise-test-signature', 'test_verified')
        .send({
          id: `evt_out_of_order_${Date.now()}`,
          type: 'invoice.payment_succeeded',
          created: Math.floor(new Date('2026-10-24T09:59:00Z').getTime() / 1000), // Prior to cancellation
          data: {
            customer_email: otherEmail,
            amount_paid: 499,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('out_of_order_ignored');

      // User must NOT be reactivated
      const checkUser = await User.findById(otherUserId);
      expect(checkUser?.subscriptionTier).toBe('free');
      expect(checkUser?.subscriptionStatus).toBe('cancelled');
    });

    it('allows retrying previously failed webhook events', async () => {
      const retryEventId = `evt_retry_test_${Date.now()}`;

      // 1. First attempt: create record with status 'failed'
      await WebhookEvent.create({
        eventId: retryEventId,
        eventType: 'customer.subscription.updated',
        provider: 'test',
        status: 'failed',
        error: 'Simulated network timeout during earlier processing',
        payload: {},
      });

      // 2. Retry delivery with correct user payload
      const res = await request(app)
        .post('/api/v1/subscriptions/webhook')
        .set('x-mise-test-signature', 'test_verified')
        .send({
          id: retryEventId,
          type: 'customer.subscription.updated',
          data: {
            customer_email: otherEmail,
            tier: 'pro',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('processed');

      const eventInDb = await WebhookEvent.findOne({ eventId: retryEventId });
      expect(eventInDb?.status).toBe('processed');
    });
  });

  // --------------------------------------------------------------------------
  // 4. ADMIN DASHBOARD & ROLE-BASED ACCESS CONTROL
  // --------------------------------------------------------------------------
  describe('4. Admin Dashboard Security and Functionality', () => {
    it('denies access to admin endpoints for regular users (403 Forbidden)', async () => {
      const metricsRes = await request(app)
        .get('/api/v1/admin/metrics')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(metricsRes.status).toBe(403);
      expect(metricsRes.body.success).toBe(false);
      expect(metricsRes.body.error).toMatch(/Administrator privileges required/i);

      const usersRes = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(usersRes.status).toBe(403);
    });

    it('allows access to admin metrics for admin users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.total).toBeGreaterThanOrEqual(3);
      expect(res.body.data.subscriptions.estimatedMRR).toBeGreaterThanOrEqual(0);
      expect(res.body.data.system.totalRecipes).toBeGreaterThanOrEqual(1);
    });

    it('allows admin to query, search, and paginate sanitized user list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?page=1&limit=10&search=Free')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      // Verify data is sanitized: password or resetToken must never be exposed
      const returnedUser = res.body.data[0];
      expect(returnedUser.password).toBeUndefined();
      expect(returnedUser.resetPasswordToken).toBeUndefined();
      expect(returnedUser.email).toBeDefined();
      expect(returnedUser.subscriptionTier).toBeDefined();
    });

    it('allows admin to view specific user details with usage aggregates', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(regularEmail);
      expect(res.body.data.usage).toBeDefined();
      expect(res.body.data.usage.pantryCount).toBeGreaterThan(0);
    });

    it('allows admin to adjust a user tier directly', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${otherUserId}/tier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tier: 'free' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await User.findById(otherUserId);
      expect(updated?.subscriptionTier).toBe('free');

      // Verify Audit Log was recorded
      const auditLog = await AdminAuditLog.findOne({ targetUser: otherUserId, action: 'update_user_tier' });
      expect(auditLog).toBeDefined();
      expect(auditLog?.adminEmail).toBe(adminEmail);
      expect(auditLog?.details.newTier).toBe('free');
    });

    it('rejects client-supplied admin JWT claims when database record is non-admin', async () => {
      // Craft a forged token for regularUserId claiming role: 'admin'
      const secret = process.env.JWT_SECRET || 'mise_meal_planner_jwt_secret_dev_key_2026';
      const spoofedAdminToken = jwt.sign(
        { id: regularUserId, email: regularEmail, role: 'admin' },
        secret
      );

      const res = await request(app)
        .get('/api/v1/admin/metrics')
        .set('Authorization', `Bearer ${spoofedAdminToken}`);

      // Must be rejected with 403 because User record in MongoDB has role: 'user'
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Administrator privileges required/i);
    });

    it('sanitizes special regex characters in user search safely without ReDoS', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?search=(.*)+[test]?')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('enforces plan history retention limit: Free tier gets 2 weeks max, Pro gets full history', async () => {
      // Create 5 past meal plans for regularUserId
      const plans = [];
      for (let i = 1; i <= 5; i++) {
        const d = new Date(Date.now() - i * 7 * 86400 * 1000);
        plans.push({
          user: regularUserId,
          weekStartDate: d,
          dinners: [],
          meals: [],
          householdSize: 2,
          estimatedCost: 30,
          budgetLimit: 40,
          createdAt: d,
        });
      }
      await MealPlan.create(plans);

      // As Free user, calling /api/v1/plan/history must be limited to 2 weeks
      await User.findByIdAndUpdate(regularUserId, { subscriptionTier: 'free', subscriptionStatus: 'trial' });
      const freeHistoryRes = await request(app)
        .get('/api/v1/plan/history')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(freeHistoryRes.status).toBe(200);
      expect(freeHistoryRes.body.data.length).toBeLessThanOrEqual(2);

      // As Pro user, calling /api/v1/plan/history returns all past history
      await User.findByIdAndUpdate(regularUserId, {
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400 * 1000),
      });
      const proHistoryRes = await request(app)
        .get('/api/v1/plan/history')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(proHistoryRes.status).toBe(200);
      expect(proHistoryRes.body.data.length).toBeGreaterThan(2);
    });

    it('allows admin to list and create recipes', async () => {
      const createRes = await request(app)
        .post('/api/v1/admin/recipes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Gourmet Salmon',
          description: 'A special high-protein chef dish added by administrator.',
          image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2',
          cuisine: 'Mediterranean',
          vibes: ['Protein Packed'],
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          servings: 2,
          calories: 550,
          carbsGrams: 10,
          proteinGrams: 45,
          fatGrams: 25,
          ingredients: [
            { name: 'Salmon Fillet', quantity: 300, unit: 'g', aisle: 'Meat & Seafood', estimatedCost: 6.5 },
            { name: 'Asparagus', quantity: 200, unit: 'g', aisle: 'Fresh Produce', estimatedCost: 2.5 },
          ],
          instructions: ['Season salmon with salt and pepper', 'Sear on pan for 4 minutes each side'],
          dietaryTags: ['Pescatarian'],
          allergens: ['Fish'],
          equipmentNeeded: ['Hob Only'],
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.title).toBe('Admin Gourmet Salmon');

      // Verify list
      const listRes = await request(app)
        .get('/api/v1/admin/recipes?search=Salmon')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
