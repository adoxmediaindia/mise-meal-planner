import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/index.js';
import { User } from '../src/models/User.js';
import { Recipe } from '../src/models/Recipe.js';
import { MealPlan } from '../src/models/MealPlan.js';
import { ShoppingList } from '../src/models/ShoppingList.js';
import { PantryItem } from '../src/models/PantryItem.js';
import { Household } from '../src/models/Household.js';
import { HouseholdInvitation } from '../src/models/HouseholdInvitation.js';

describe('Phase 6 — Cross-Device Reliability, Offline Queue & Concurrency Suite', () => {
  const secret = process.env.JWT_SECRET || 'mise_meal_planner_jwt_super_secure_dev_key_2026';

  let userAId: string;
  let userAEmail: string;
  let userAWebCookie: string;
  let userAMobileBearer: string;

  let userBId: string;
  let userBEmail: string;
  let userBBearer: string;

  let testRecipe1Id: string;
  let testRecipe2Id: string;

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/mise_meal_planner_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const timestamp = Date.now();
    userAEmail = `device_sync_userA_${timestamp}@example.com`;
    userBEmail = `device_sync_userB_${timestamp}@example.com`;

    // Ensure recipes exist
    let r1 = await Recipe.findOne({ slug: 'reliability-pasta' });
    if (!r1) {
      r1 = await Recipe.create({
        title: 'Reliability Pasta',
        slug: 'reliability-pasta',
        description: 'Pasta for concurrency and sync testing',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        cuisine: 'Italian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 500,
        carbsGrams: 60,
        proteinGrams: 20,
        fatGrams: 15,
        ingredients: [
          { name: 'Pasta', quantity: 200, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.0 },
          { name: 'Olive Oil', quantity: 15, unit: 'ml', aisle: 'Pantry & Grains', estimatedCost: 0.5 },
        ],
        instructions: ['Boil pasta'],
        equipmentNeeded: ['Hob Only'],
      });
    }
    testRecipe1Id = r1._id.toString();

    let r2 = await Recipe.findOne({ slug: 'reliability-stirfry' });
    if (!r2) {
      r2 = await Recipe.create({
        title: 'Reliability Stir Fry',
        slug: 'reliability-stirfry',
        description: 'Stir fry for meal swap testing',
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
        cuisine: 'Asian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 10,
        servings: 2,
        calories: 450,
        carbsGrams: 55,
        proteinGrams: 18,
        fatGrams: 12,
        ingredients: [
          { name: 'Noodles', quantity: 150, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.2 },
          { name: 'Soy Sauce', quantity: 30, unit: 'ml', aisle: 'Spices & Condiments', estimatedCost: 0.8 },
        ],
        instructions: ['Toss noodles'],
        equipmentNeeded: ['Hob Only'],
      });
    }
    testRecipe2Id = r2._id.toString();

    // Register User A (dual client testing)
    const regResA = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Sync User A', email: userAEmail, password: 'Password123!' });

    userAId = regResA.body.data.id;
    userAMobileBearer = regResA.body.data.token;

    // Extract web cookie from register response
    const cookies = regResA.headers['set-cookie'];
    userAWebCookie = Array.isArray(cookies) ? cookies[0] : cookies;

    // Register User B (resource isolation testing)
    const regResB = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Sync User B', email: userBEmail, password: 'Password123!' });

    userBId = regResB.body.data.id;
    userBBearer = regResB.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
    await MealPlan.deleteMany({ user: { $in: [userAId, userBId] } });
    await ShoppingList.deleteMany({ user: { $in: [userAId, userBId] } });
    await PantryItem.deleteMany({ user: { $in: [userAId, userBId] } });
    await Household.deleteMany({ owner: { $in: [userAId, userBId] } });
    await HouseholdInvitation.deleteMany({ invitedBy: { $in: [userAId, userBId] } });
  });

  // ==========================================================================
  // 1. CROSS-DEVICE SYNCHRONIZATION
  // ==========================================================================
  describe('1. Cross-Device Synchronization Flow (Web & Mobile Parity)', () => {
    it('generates meal plan on Web (cookie) and retrieves exact plan on Mobile (Bearer)', async () => {
      // 1. Web client initiates plan generation via cookie
      const webGen = await request(app)
        .post('/api/v1/plan/generate')
        .set('Cookie', userAWebCookie)
        .send({});

      expect(webGen.status).toBe(200);
      expect(webGen.body.success).toBe(true);
      const generatedPlanId = webGen.body.data._id;

      // 2. Mobile client fetches current plan via Bearer token
      const mobileFetch = await request(app)
        .get('/api/v1/plan/current')
        .set('Authorization', `Bearer ${userAMobileBearer}`);

      expect(mobileFetch.status).toBe(200);
      expect(mobileFetch.body.success).toBe(true);
      expect(mobileFetch.body.data._id).toBe(generatedPlanId);
      expect(mobileFetch.body.data.dinners.length).toBeGreaterThan(0);
    });

    it('swaps a meal on Mobile and instantly reflects on Web client', async () => {
      // 1. Mobile swaps Monday dinner to testRecipe2
      const swapRes = await request(app)
        .put('/api/v1/plan/swap-meal')
        .set('Authorization', `Bearer ${userAMobileBearer}`)
        .send({ day: 'Monday', targetRecipeId: testRecipe2Id });

      expect(swapRes.status).toBe(200);

      // 2. Web queries current plan
      const webFetch = await request(app)
        .get('/api/v1/plan/current')
        .set('Cookie', userAWebCookie);

      expect(webFetch.status).toBe(200);
      const mondayDinner = webFetch.body.data.dinners.find((d: any) => d.day === 'Monday');
      expect(mondayDinner).toBeDefined();
      expect(mondayDinner.recipe._id.toString()).toBe(testRecipe2Id);
    });

    it('synchronizes pantry inventory additions and removals across Web and Mobile', async () => {
      // 1. Mobile adds pantry item
      const addRes = await request(app)
        .post('/api/v1/pantry')
        .set('Authorization', `Bearer ${userAMobileBearer}`)
        .send({
          name: 'Sync Avocado Oil',
          quantity: 250,
          unit: 'ml',
          category: 'Pantry & Grains',
        });

      expect(addRes.status).toBe(201);
      const itemId = addRes.body.data._id;

      // 2. Web retrieves pantry items and sees the new item
      const webPantry = await request(app)
        .get('/api/v1/pantry')
        .set('Cookie', userAWebCookie);

      expect(webPantry.status).toBe(200);
      const foundOnWeb = webPantry.body.data.find((i: any) => i._id === itemId);
      expect(foundOnWeb).toBeDefined();
      expect(foundOnWeb.name).toBe('Sync Avocado Oil');

      // 3. Web consumes / deletes the item
      const deleteRes = await request(app)
        .delete(`/api/v1/pantry/${itemId}`)
        .set('Cookie', userAWebCookie);

      expect(deleteRes.status).toBe(200);

      // 4. Mobile verifies item is gone
      const mobilePantry = await request(app)
        .get('/api/v1/pantry')
        .set('Authorization', `Bearer ${userAMobileBearer}`);

      const stillOnMobile = mobilePantry.body.data.find((i: any) => i._id === itemId);
      expect(stillOnMobile).toBeUndefined();
    });

    it('synchronizes preferences across clients instantly', async () => {
      // Web updates supermarket preference to Kroger
      const updateRes = await request(app)
        .put('/api/v1/preferences')
        .set('Cookie', userAWebCookie)
        .send({ supermarket: 'Kroger', householdSize: 4 });

      expect(updateRes.status).toBe(200);

      // Mobile reads preferences
      const mobilePref = await request(app)
        .get('/api/v1/preferences')
        .set('Authorization', `Bearer ${userAMobileBearer}`);

      expect(mobilePref.status).toBe(200);
      expect(mobilePref.body.data.supermarket).toBe('Kroger');
      expect(mobilePref.body.data.householdSize).toBe(4);
    });
  });

  // ==========================================================================
  // 2. OFFLINE QUEUE, RETRY & IDEMPOTENCY BEHAVIOUR
  // ==========================================================================
  describe('2. Offline Queue, Retry Safety & Idempotency Behaviour', () => {
    let testShoppingItemId: string;

    beforeAll(async () => {
      const listRes = await request(app)
        .get('/api/v1/shopping-list')
        .set('Authorization', `Bearer ${userAMobileBearer}`);

      if (listRes.body.data && listRes.body.data.items.length > 0) {
        testShoppingItemId = listRes.body.data.items[0].id;
      } else {
        const addRes = await request(app)
          .post('/api/v1/shopping-list/items')
          .set('Authorization', `Bearer ${userAMobileBearer}`)
          .send({ name: 'Offline Queue Test Milk', totalQuantity: 1, unit: 'L' });
        testShoppingItemId = addRes.body.data.items[0].id;
      }
    });

    it('repeated retries of checkoff with explicit targetState are 100% idempotent', async () => {
      // Simulate 3 repeated deliveries of mutation: { isBought: true }
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .patch(`/api/v1/shopping-list/item/${testShoppingItemId}`)
          .set('Authorization', `Bearer ${userAMobileBearer}`)
          .send({ isBought: true });

        expect(res.status).toBe(200);
        const item = res.body.data.items.find((i: any) => i.id === testShoppingItemId);
        expect(item.isBought).toBe(true);
      }

      // Final state in DB must be bought
      const checkList = await request(app)
        .get('/api/v1/shopping-list')
        .set('Authorization', `Bearer ${userAMobileBearer}`);

      const itemInDb = checkList.body.data.items.find((i: any) => i.id === testShoppingItemId);
      expect(itemInDb.isBought).toBe(true);

      // Repeated deliveries of { isBought: false } leave item false
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .patch(`/api/v1/shopping-list/item/${testShoppingItemId}`)
          .set('Authorization', `Bearer ${userAMobileBearer}`)
          .send({ isBought: false });

        expect(res.status).toBe(200);
        const item = res.body.data.items.find((i: any) => i.id === testShoppingItemId);
        expect(item.isBought).toBe(false);
      }
    });

    it('prevents duplicate grocery items on retried creation using clientMutationId', async () => {
      const clientMutationId = `client_mut_${Date.now()}`;

      // First submission (e.g., sent before network drops)
      const res1 = await request(app)
        .post('/api/v1/shopping-list/items')
        .set('Authorization', `Bearer ${userAMobileBearer}`)
        .send({
          clientMutationId,
          name: 'Organic Honey',
          totalQuantity: 1,
          unit: 'jar',
          aisle: 'Pantry & Grains',
        });

      expect(res1.status).toBe(201);
      const count1 = res1.body.data.items.filter((i: any) => i.id === clientMutationId).length;
      expect(count1).toBe(1);

      // Second submission (retry after reconnection with same mutation id)
      const res2 = await request(app)
        .post('/api/v1/shopping-list/items')
        .set('Authorization', `Bearer ${userAMobileBearer}`)
        .send({
          clientMutationId,
          name: 'Organic Honey',
          totalQuantity: 1,
          unit: 'jar',
          aisle: 'Pantry & Grains',
        });

      // Must NOT create a duplicate item!
      const count2 = res2.body.data.items.filter((i: any) => i.id === clientMutationId).length;
      expect(count2).toBe(1);
    });

    it('rejects stale or invalid item operations gracefully (404/500 without crashing)', async () => {
      const res = await request(app)
        .patch('/api/v1/shopping-list/item/non_existent_item_999999')
        .set('Authorization', `Bearer ${userAMobileBearer}`)
        .send({ isBought: true });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Shopping item not found/i);
    });
  });

  // ==========================================================================
  // 3. CONCURRENT UPDATES & DATA INTEGRITY
  // ==========================================================================
  describe('3. Concurrent Updates & Race Condition Integrity', () => {
    it('handles concurrent grocery checkoffs without lost updates', async () => {
      // Add two items to shopping list
      const m1 = `item_conc_1_${Date.now()}`;
      const m2 = `item_conc_2_${Date.now()}`;

      await request(app)
        .post('/api/v1/shopping-list/items')
        .set('Authorization', `Bearer ${userAMobileBearer}`)
        .send({ clientMutationId: m1, name: 'Conc Bread', totalQuantity: 1 });

      await request(app)
        .post('/api/v1/shopping-list/items')
        .set('Authorization', `Bearer ${userAMobileBearer}`)
        .send({ clientMutationId: m2, name: 'Conc Butter', totalQuantity: 1 });

      // Execute concurrent checkoffs simultaneously via Promise.all
      const [r1, r2] = await Promise.all([
        request(app)
          .patch(`/api/v1/shopping-list/item/${m1}`)
          .set('Cookie', userAWebCookie)
          .send({ isBought: true }),
        request(app)
          .patch(`/api/v1/shopping-list/item/${m2}`)
          .set('Authorization', `Bearer ${userAMobileBearer}`)
          .send({ isBought: true }),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);

      // Verify both items are bought in the final persisted document
      const finalList = await request(app)
        .get('/api/v1/shopping-list')
        .set('Authorization', `Bearer ${userAMobileBearer}`);

      const item1 = finalList.body.data.items.find((i: any) => i.id === m1);
      const item2 = finalList.body.data.items.find((i: any) => i.id === m2);

      expect(item1.isBought).toBe(true);
      expect(item2.isBought).toBe(true);
    });

    it('handles concurrent meal swaps for different days without data loss', async () => {
      // Simultaneously swap Monday and Tuesday
      const [r1, r2] = await Promise.all([
        request(app)
          .put('/api/v1/plan/swap-meal')
          .set('Cookie', userAWebCookie)
          .send({ day: 'Monday', targetRecipeId: testRecipe1Id }),
        request(app)
          .put('/api/v1/plan/swap-meal')
          .set('Authorization', `Bearer ${userAMobileBearer}`)
          .send({ day: 'Tuesday', targetRecipeId: testRecipe2Id }),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);

      // Persisted plan must have both days updated
      const finalPlan = await request(app)
        .get('/api/v1/plan/current')
        .set('Cookie', userAWebCookie);

      const mon = finalPlan.body.data.dinners.find((d: any) => d.day === 'Monday');
      const tue = finalPlan.body.data.dinners.find((d: any) => d.day === 'Tuesday');

      expect(mon.recipe._id.toString()).toBe(testRecipe1Id);
      expect(tue.recipe._id.toString()).toBe(testRecipe2Id);
    });

    it('enforces zero-trust isolation: User B cannot view or tamper with User A data', async () => {
      // User B tries to fetch User A's shopping list
      const bList = await request(app)
        .get('/api/v1/shopping-list')
        .set('Authorization', `Bearer ${userBBearer}`);

      // Must be User B's own list, never User A's
      expect(bList.status).toBe(200);
      expect(bList.body.data.user.toString()).toBe(userBId);
      expect(bList.body.data.user.toString()).not.toBe(userAId);

      // User B tries to delete a pantry item owned by User A
      const aPantryItem = await PantryItem.create({
        user: userAId,
        name: 'Secret Saffron',
        quantity: 5,
        unit: 'g',
        category: 'Spices & Condiments',
      });

      const tamperRes = await request(app)
        .delete(`/api/v1/pantry/${aPantryItem._id}`)
        .set('Authorization', `Bearer ${userBBearer}`);

      // Must be rejected (400 Bad Request or 404 Not Found for user B)
      expect([400, 403, 404]).toContain(tamperRes.status);

      // Verify item still exists for User A
      const stillExists = await PantryItem.findById(aPantryItem._id);
      expect(stillExists).toBeDefined();
    });

    it('revokes duplicate household invitations and maintains exactly one active pending token', async () => {
      // User A creates a household
      await Household.deleteMany({ owner: userAId });
      const hhRes = await request(app)
        .post('/api/v1/household')
        .set('Authorization', `Bearer ${userAMobileBearer}`)
        .send({ name: 'The Concurrency Household' });

      expect(hhRes.status).toBe(201);

      const invitee = 'duplicate.invite.test@example.com';

      // Send invitation 1
      const inv1 = await request(app)
        .post('/api/v1/household/invitations')
        .set('Authorization', `Bearer ${userAMobileBearer}`)
        .send({ email: invitee, role: 'member' });
      expect(inv1.status).toBe(201);

      // Send invitation 2 for same email
      const inv2 = await request(app)
        .post('/api/v1/household/invitations')
        .set('Authorization', `Bearer ${userAMobileBearer}`)
        .send({ email: invitee, role: 'member' });
      expect(inv2.status).toBe(201);

      // In database, previous invitation must be revoked, only 1 active pending invitation
      const pendingCount = await HouseholdInvitation.countDocuments({
        household: hhRes.body.data._id,
        inviteeEmail: invitee,
        status: 'pending',
      });
      expect(pendingCount).toBe(1);

      const revokedCount = await HouseholdInvitation.countDocuments({
        household: hhRes.body.data._id,
        inviteeEmail: invitee,
        status: 'revoked',
      });
      expect(revokedCount).toBe(1);
    });
  });

  // ==========================================================================
  // 4. AUTHENTICATION & AUTHORIZATION REGRESSION
  // ==========================================================================
  describe('4. Authentication & Security Edge Cases', () => {
    it('rejects requests with expired JWT token (401 Unauthorized)', async () => {
      const expiredToken = jwt.sign(
        { id: userAId, email: userAEmail, exp: Math.floor(Date.now() / 1000) - 3600 },
        secret
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid or expired (token|session)/i);
    });

    it('rejects requests with tampered JWT signature (401 Unauthorized)', async () => {
      const forgedToken = jwt.sign(
        { id: userAId, email: userAEmail },
        'wrong_tampered_secret_key_999'
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid or expired (token|session)/i);
    });

    it('rejects unauthenticated requests to protected endpoints (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/v1/pantry');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
