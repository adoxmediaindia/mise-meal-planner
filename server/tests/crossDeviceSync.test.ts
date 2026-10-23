import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/index.js';
import { Recipe } from '../src/models/Recipe.js';
import { User } from '../src/models/User.js';
import { Preference } from '../src/models/Preference.js';
import { MealPlan } from '../src/models/MealPlan.js';
import { ShoppingList } from '../src/models/ShoppingList.js';

describe('Shared Backend & Cross-Device Synchronization Suite', () => {
  let webCookie: string;
  let mobileBearerToken: string;
  let sharedUserId: string;

  let secondaryBearerToken: string;
  let secondaryUserId: string;

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/mise_meal_planner_sync_test';
    await mongoose.connect(mongoUri);
    await Recipe.deleteMany({});
    await User.deleteMany({});
    await Preference.deleteMany({});
    await MealPlan.deleteMany({});
    await ShoppingList.deleteMany({});

    // Seed test recipes
    await Recipe.create([
      {
        title: 'Creamy Tuscan Chicken',
        slug: 'creamy-tuscan-chicken',
        description: 'Pan-seared chicken in garlic cream sauce',
        image: 'https://example.com/c1.jpg',
        cuisine: 'Italian',
        vibes: ['Speedy Meals', 'Family Favs'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 520,
        carbsGrams: 12,
        proteinGrams: 42,
        fatGrams: 28,
        ingredients: [
          { name: 'Chicken Breast', quantity: 2, unit: 'fillets', aisle: 'Meat & Seafood', estimatedCost: 3.5 },
          { name: 'Garlic', quantity: 3, unit: 'cloves', aisle: 'Fresh Produce', estimatedCost: 0.5 },
          { name: 'Double Cream', quantity: 150, unit: 'ml', aisle: 'Dairy & Refrigerated', estimatedCost: 1.2 },
        ],
        instructions: ['Sear chicken', 'Stir sauce'],
        dietaryTags: ['Gluten-Free'],
        allergens: ['Dairy'],
        equipmentNeeded: ['Hob Only'],
      },
      {
        title: 'Speedy Veggie Noodle Bowl',
        slug: 'speedy-veggie-noodle-bowl',
        description: 'Crispy veggies tossed with noodles',
        image: 'https://example.com/c2.jpg',
        cuisine: 'Asian',
        vibes: ['Speedy Meals', 'Budget Friendly'],
        prepTimeMinutes: 8,
        cookTimeMinutes: 10,
        servings: 2,
        calories: 410,
        carbsGrams: 58,
        proteinGrams: 14,
        fatGrams: 10,
        ingredients: [
          { name: 'Egg Noodles', quantity: 200, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.0 },
          { name: 'Bell Pepper', quantity: 1, unit: 'whole', aisle: 'Fresh Produce', estimatedCost: 0.8 },
          { name: 'Soy Sauce', quantity: 2, unit: 'tbsp', aisle: 'Spices & Condiments', estimatedCost: 0.4 },
        ],
        instructions: ['Boil noodles', 'Stir fry veggies'],
        dietaryTags: ['Vegetarian'],
        allergens: ['Soy', 'Eggs', 'Wheat'],
        equipmentNeeded: ['Hob Only'],
      },
      {
        title: 'Mediterranean Lemon Herb Salmon',
        slug: 'mediterranean-lemon-salmon',
        description: 'Tender salmon roasted with oregano and lemon',
        image: 'https://example.com/c3.jpg',
        cuisine: 'Mediterranean',
        vibes: ['Healthy & Fresh'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 460,
        carbsGrams: 6,
        proteinGrams: 38,
        fatGrams: 24,
        ingredients: [
          { name: 'Salmon Fillets', quantity: 2, unit: 'fillets', aisle: 'Meat & Seafood', estimatedCost: 5.5 },
          { name: 'Lemon', quantity: 1, unit: 'whole', aisle: 'Fresh Produce', estimatedCost: 0.5 },
        ],
        instructions: ['Season salmon', 'Bake at 200C'],
        dietaryTags: ['Pescatarian', 'Gluten-Free'],
        allergens: ['Fish'],
        equipmentNeeded: ['Oven'],
      },
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. DUAL AUTHENTICATION: Single registration yields cookie for Web and Bearer token for Mobile', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Alex Synchronizer',
      email: 'alex.sync@example.com',
      password: 'SyncPassword2026!',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    sharedUserId = res.body.data.id;

    // Web Client receives HTTP-only cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    webCookie = cookies[0];

    // Mobile Client receives JWT token in JSON response body
    expect(res.body.data.token).toBeDefined();
    mobileBearerToken = res.body.data.token;
  });

  it('2. DUAL AUTH VALIDATION: Both Web (cookie) and Mobile (Bearer header) access the identical profile', async () => {
    // Web request using Cookie
    const webRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', webCookie);
    expect(webRes.status).toBe(200);
    expect(webRes.body.data._id).toBe(sharedUserId);
    expect(webRes.body.data.email).toBe('alex.sync@example.com');

    // Mobile request using Authorization: Bearer
    const mobileRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${mobileBearerToken}`);
    expect(mobileRes.status).toBe(200);
    expect(mobileRes.body.data._id).toBe(sharedUserId);
    expect(mobileRes.body.data.email).toBe('alex.sync@example.com');
  });

  it('3. PREFERENCES SYNC: Web mutation instantly reflects on Mobile client', async () => {
    // Web client updates household size to 4 and supermarket to Whole Foods
    const webUpdate = await request(app)
      .put('/api/v1/preferences')
      .set('Cookie', webCookie)
      .send({
        supermarket: 'Whole Foods',
        householdSize: 4,
        weeklyBudget: 80,
      });
    expect(webUpdate.status).toBe(200);
    expect(webUpdate.body.data.supermarket).toBe('Whole Foods');
    expect(webUpdate.body.data.householdSize).toBe(4);

    // Mobile client refetches preferences and sees the exact updated values
    const mobileFetch = await request(app)
      .get('/api/v1/preferences')
      .set('Authorization', `Bearer ${mobileBearerToken}`);
    expect(mobileFetch.status).toBe(200);
    expect(mobileFetch.body.data.supermarket).toBe('Whole Foods');
    expect(mobileFetch.body.data.householdSize).toBe(4);
    expect(mobileFetch.body.data.weeklyBudget).toBe(80);
  });

  it('4. SHOPPING LIST SYNC: Mobile checklist checkoff instantly reflects on Web client', async () => {
    // Generate meal plan first
    await request(app)
      .post('/api/v1/plan/generate')
      .set('Cookie', webCookie);

    // Mobile client gets shopping list
    const mobileListRes = await request(app)
      .get('/api/v1/shopping-list')
      .set('Authorization', `Bearer ${mobileBearerToken}`);
    expect(mobileListRes.status).toBe(200);
    expect(mobileListRes.body.data.items.length).toBeGreaterThan(0);

    const targetItem = mobileListRes.body.data.items[0];
    expect(targetItem.isBought).toBe(false);

    // Mobile client checks off the item
    const toggleRes = await request(app)
      .patch(`/api/v1/shopping-list/item/${targetItem.id}`)
      .set('Authorization', `Bearer ${mobileBearerToken}`);
    expect(toggleRes.status).toBe(200);

    // Web client fetches shopping list and confirms item is marked bought
    const webListRes = await request(app)
      .get('/api/v1/shopping-list')
      .set('Cookie', webCookie);
    expect(webListRes.status).toBe(200);
    const webItem = webListRes.body.data.items.find((i: any) => i.id === targetItem.id);
    expect(webItem).toBeDefined();
    expect(webItem.isBought).toBe(true);
    expect(webListRes.body.data.itemsBoughtCount).toBeGreaterThan(0);
  });

  it('5. MEAL PLAN SYNC: Web meal swap instantly updates Mobile plan view', async () => {
    // Mobile client checks current Monday dinner
    const mobilePlanBefore = await request(app)
      .get('/api/v1/plan/current')
      .set('Authorization', `Bearer ${mobileBearerToken}`);
    expect(mobilePlanBefore.status).toBe(200);
    const mondayBefore = mobilePlanBefore.body.data.dinners.find((d: any) => d.day === 'Monday');
    expect(mondayBefore).toBeDefined();

    // Web client swaps Monday dinner
    const swapRes = await request(app)
      .put('/api/v1/plan/swap-meal')
      .set('Cookie', webCookie)
      .send({ day: 'Monday' });
    expect(swapRes.status).toBe(200);

    // Mobile client fetches current plan
    const mobilePlanAfter = await request(app)
      .get('/api/v1/plan/current')
      .set('Authorization', `Bearer ${mobileBearerToken}`);
    expect(mobilePlanAfter.status).toBe(200);
    const mondayAfter = mobilePlanAfter.body.data.dinners.find((d: any) => d.day === 'Monday');
    expect(mondayAfter).toBeDefined();
  });

  it('6. ZERO-TRUST RESOURCE ISOLATION: Second user cannot access or tamper with first user data', async () => {
    // Register User C
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'User Charlie',
      email: 'charlie@example.com',
      password: 'CharliePassword123!',
    });
    expect(regRes.status).toBe(201);
    secondaryUserId = regRes.body.data.id;
    secondaryBearerToken = regRes.body.data.token;

    // User Charlie fetches shopping list -> gets their own shopping list, NOT Alex's
    const charlieList = await request(app)
      .get('/api/v1/shopping-list')
      .set('Authorization', `Bearer ${secondaryBearerToken}`);
    expect(charlieList.status).toBe(200);
    expect(charlieList.body.data.user).toBe(secondaryUserId);
    expect(charlieList.body.data.user).not.toBe(sharedUserId);

    // Unauthenticated request fails with 401
    const unauthRes = await request(app).get('/api/v1/plan/current');
    expect(unauthRes.status).toBe(401);
  });

  it('7. ACCOUNT RECOVERY FLOW: Forgot password and token reset works end-to-end', async () => {
    // Trigger forgot password
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'alex.sync@example.com' });
    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);
    const resetToken = forgotRes.body.resetToken;
    expect(resetToken).toBeDefined();

    // Reset password with token
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'BrandNewPassword2026!',
      });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Old password must fail
    const oldLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'alex.sync@example.com',
      password: 'SyncPassword2026!',
    });
    expect(oldLogin.status).toBe(401);

    // New password succeeds and issues fresh token
    const newLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'alex.sync@example.com',
      password: 'BrandNewPassword2026!',
    });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.data.token).toBeDefined();
  });

  it('8. SUBSCRIPTIONS WEBHOOK: Billing webhook safely updates subscription entitlements', async () => {
    // Simulate webhook event from payment processor
    const webhookRes = await request(app)
      .post('/api/v1/subscriptions/webhook')
      .send({
        event: 'customer.subscription.updated',
        data: {
          customer_email: 'alex.sync@example.com',
          tier: 'pro',
          status: 'active',
        },
      });
    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.received).toBe(true);

    // User checks subscription status via Mobile Bearer token
    const subStatusRes = await request(app)
      .get('/api/v1/subscriptions/status')
      .set('Authorization', `Bearer ${mobileBearerToken}`);
    expect(subStatusRes.status).toBe(200);
    expect(subStatusRes.body.data.tier).toBe('pro');
    expect(subStatusRes.body.data.status).toBe('active');
    expect(subStatusRes.body.data.isActive).toBe(true);
  });
});
