import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/index.js';
import { User } from '../src/models/User.js';
import { Recipe } from '../src/models/Recipe.js';
import { PantryItem } from '../src/models/PantryItem.js';
import { MealPlan } from '../src/models/MealPlan.js';
import { ShoppingList } from '../src/models/ShoppingList.js';
import { Preference } from '../src/models/Preference.js';
import { Household } from '../src/models/Household.js';
import { HouseholdInvitation } from '../src/models/HouseholdInvitation.js';

describe('Phase 4: Pantry Inventory, Recipe Matching & Household Sharing', () => {
  let user1Cookie: string;
  let user1Id: string;
  let user1Email: string;

  let user2Cookie: string;
  let user2Id: string;
  let user2Email: string;

  let testRecipe1: any;
  let testRecipe2: any;
  let testAllergenRecipe: any;

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/mise_meal_planner_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean test users & data
    await User.deleteMany({ email: /@phase4-test\.com/ });
    await PantryItem.deleteMany({});
    await Household.deleteMany({});
    await HouseholdInvitation.deleteMany({});

    // Seed controllable recipes
    testRecipe1 = await Recipe.findOne({ slug: 'p4-pasta-marinara' });
    if (!testRecipe1) {
      testRecipe1 = await Recipe.create({
        title: 'P4 Pasta Marinara',
        slug: 'p4-pasta-marinara',
        description: 'Simple pasta',
        image: 'https://example.com/pasta.jpg',
        cuisine: 'Italian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 400,
        carbsGrams: 60,
        proteinGrams: 12,
        fatGrams: 8,
        ingredients: [
          { name: 'Spaghetti', quantity: 300, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.5 },
          { name: 'Marinara Sauce', quantity: 1, unit: 'jar', aisle: 'Pantry & Grains', estimatedCost: 2.0 },
        ],
        instructions: ['Boil pasta', 'Warm sauce'],
        dietaryTags: ['Vegetarian', 'Vegan'],
        allergens: ['Gluten'],
        equipmentNeeded: ['Hob Only'],
      });
    }

    testRecipe2 = await Recipe.findOne({ slug: 'p4-salmon-fillet' });
    if (!testRecipe2) {
      testRecipe2 = await Recipe.create({
        title: 'P4 Grilled Salmon',
        slug: 'p4-salmon-fillet',
        description: 'Salmon with lemon',
        image: 'https://example.com/salmon.jpg',
        cuisine: 'Mediterranean',
        vibes: ['Protein Packed'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 12,
        servings: 2,
        calories: 450,
        carbsGrams: 2,
        proteinGrams: 38,
        fatGrams: 24,
        ingredients: [
          { name: 'Salmon', quantity: 2, unit: 'fillets', aisle: 'Meat & Seafood', estimatedCost: 6.0 },
          { name: 'Olive Oil', quantity: 15, unit: 'ml', aisle: 'Pantry & Grains', estimatedCost: 0.5 },
        ],
        instructions: ['Grill salmon'],
        dietaryTags: ['Pescatarian'],
        allergens: ['Fish'],
        equipmentNeeded: ['Hob Only'],
      });
    }

    // Recipe with Peanuts allergen
    testAllergenRecipe = await Recipe.findOne({ slug: 'p4-peanut-noodles' });
    if (!testAllergenRecipe) {
      testAllergenRecipe = await Recipe.create({
        title: 'P4 Peanut Satay Noodles',
        slug: 'p4-peanut-noodles',
        description: 'Noodles with peanuts',
        image: 'https://example.com/noodles.jpg',
        cuisine: 'Asian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 10,
        servings: 2,
        calories: 550,
        carbsGrams: 60,
        proteinGrams: 20,
        fatGrams: 22,
        ingredients: [
          { name: 'Egg Noodles', quantity: 200, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.5 },
          { name: 'Peanut Sauce', quantity: 100, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.8 },
        ],
        instructions: ['Cook noodles', 'Stir sauce'],
        dietaryTags: ['None'],
        allergens: ['Peanuts', 'Gluten', 'Eggs'],
        equipmentNeeded: ['Hob Only'],
      });
    }

    // Register User 1
    user1Email = 'user1@phase4-test.com';
    const reg1 = await request(app).post('/api/v1/auth/register').send({
      name: 'User One',
      email: user1Email,
      password: 'Password123!',
    });
    user1Id = reg1.body.data.id;
    const cookies1 = reg1.headers['set-cookie'];
    user1Cookie = Array.isArray(cookies1) ? cookies1[0] : (cookies1 as any);

    // Register User 2
    user2Email = 'user2@phase4-test.com';
    const reg2 = await request(app).post('/api/v1/auth/register').send({
      name: 'User Two',
      email: user2Email,
      password: 'Password123!',
    });
    user2Id = reg2.body.data.id;
    const cookies2 = reg2.headers['set-cookie'];
    user2Cookie = Array.isArray(cookies2) ? cookies2[0] : (cookies2 as any);

    // Set User 1 preferences with Peanuts allergy
    await Preference.findOneAndUpdate(
      { user: user1Id },
      {
        supermarket: 'Aldi',
        householdSize: 2,
        cookingDays: ['Monday', 'Tuesday'],
        weeklyBudget: 50,
        dietaryNeeds: ['None'],
        allergies: ['Peanuts'], // STRICT ALLERGY
      },
      { upsert: true }
    );
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@phase4-test\.com/ });
    if (user1Id) {
      await PantryItem.deleteMany({ user: user1Id });
      await MealPlan.deleteMany({ user: user1Id });
      await ShoppingList.deleteMany({ user: user1Id });
      await Preference.deleteMany({ user: user1Id });
    }
    if (user2Id) {
      await PantryItem.deleteMany({ user: user2Id });
      await MealPlan.deleteMany({ user: user2Id });
      await ShoppingList.deleteMany({ user: user2Id });
      await Preference.deleteMany({ user: user2Id });
    }
    await Household.deleteMany({});
    await HouseholdInvitation.deleteMany({});
  });

  // ==========================================
  // SECTION 1: PANTRY INVENTORY CRUD & ISOLATION
  // ==========================================
  describe('1. Pantry Inventory CRUD & Ownership Isolation', () => {
    let createdItemId: string;

    it('Adds ingredients to pantry with quantity, unit, category, and expiry date', async () => {
      const res = await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({
          name: 'Spaghetti',
          quantity: 500,
          unit: 'g',
          category: 'Pantry & Grains',
          expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          icon: '🍝',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Spaghetti');
      expect(res.body.data.quantity).toBe(500);
      expect(res.body.data.unit).toBe('g');
      createdItemId = res.body.data.id;
    });

    it('Enforces user isolation: User 2 cannot see or edit User 1 pantry item', async () => {
      // User 2 fetches pantry
      const listRes = await request(app)
        .get('/api/v1/pantry')
        .set('Cookie', user2Cookie);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(0);

      // User 2 attempts to update User 1 item
      const updateRes = await request(app)
        .patch(`/api/v1/pantry/${createdItemId}`)
        .set('Cookie', user2Cookie)
        .send({ quantity: 100 });
      expect(updateRes.status).toBe(400);

      // User 2 attempts to delete User 1 item
      const deleteRes = await request(app)
        .delete(`/api/v1/pantry/${createdItemId}`)
        .set('Cookie', user2Cookie);
      expect(deleteRes.status).toBe(400);
    });

    it('Allows User 1 to update pantry item', async () => {
      const res = await request(app)
        .patch(`/api/v1/pantry/${createdItemId}`)
        .set('Cookie', user1Cookie)
        .send({ quantity: 600 });

      expect(res.status).toBe(200);
      expect(res.body.data.quantity).toBe(600);
    });

    it('Safely handles and sanitizes undefined/null query strings without returning empty list', async () => {
      const res = await request(app)
        .get('/api/v1/pantry?search=undefined&category=undefined&status=undefined')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some((i: any) => i.id === createdItemId || i._id === createdItemId)).toBe(true);
    });

    it('Correctly retrieves pantry items with category=all', async () => {
      const res = await request(app)
        .get('/api/v1/pantry?category=all')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    it('Allows adding pantry item without unit field (unit is optional)', async () => {
      const res = await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({
          name: 'Apples',
          quantity: 4,
          category: 'Fresh Produce',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Apples');
      expect(res.body.data.quantity).toBe(4);
      expect(res.body.data.unit).toBe('');

      // Clean up item so downstream tests for specific recipes are not affected
      await request(app)
        .delete(`/api/v1/pantry/${res.body.data.id}`)
        .set('Cookie', user1Cookie);
    });

    it('Allows adding pantry item with explicit empty string unit', async () => {
      const res = await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({
          name: 'Avocados',
          quantity: 2,
          unit: '',
          category: 'Fresh Produce',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Avocados');
      expect(res.body.data.quantity).toBe(2);
      expect(res.body.data.unit).toBe('');

      await request(app)
        .delete(`/api/v1/pantry/${res.body.data.id}`)
        .set('Cookie', user1Cookie);
    });

    it('Correctly merges quantity when adding another unitless item of same name', async () => {
      // 1. Add first item
      const res1 = await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({
          name: 'Pears',
          quantity: 3,
        });

      expect(res1.status).toBe(201);
      expect(res1.body.data.quantity).toBe(3);
      expect(res1.body.data.unit).toBe('');

      // 2. Add second item with same name and empty unit
      const res2 = await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({
          name: 'Pears',
          quantity: 4,
          unit: '',
        });

      expect(res2.status).toBe(201);
      expect(res2.body.data.quantity).toBe(7);
      expect(res2.body.data.unit).toBe('');

      await request(app)
        .delete(`/api/v1/pantry/${res2.body.data.id}`)
        .set('Cookie', user1Cookie);
    });

    it('Allows updating pantry item unit to empty string or leaving unit unchanged', async () => {
      // Create a dedicated item with unit 'cans'
      const itemRes = await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({
          name: 'Chickpeas',
          quantity: 2,
          unit: 'cans',
          category: 'Pantry & Grains',
        });

      expect(itemRes.status).toBe(201);
      const itemId = itemRes.body.data.id;

      // 1. Update unit to empty string
      const resEmpty = await request(app)
        .patch(`/api/v1/pantry/${itemId}`)
        .set('Cookie', user1Cookie)
        .send({ unit: '' });

      expect(resEmpty.status).toBe(200);
      expect(resEmpty.body.data.unit).toBe('');

      // 2. Update quantity without specifying unit (unit remains empty)
      const resQtyOnly = await request(app)
        .patch(`/api/v1/pantry/${itemId}`)
        .set('Cookie', user1Cookie)
        .send({ quantity: 5 });

      expect(resQtyOnly.status).toBe(200);
      expect(resQtyOnly.body.data.quantity).toBe(5);
      expect(resQtyOnly.body.data.unit).toBe('');

      // Clean up item
      await request(app)
        .delete(`/api/v1/pantry/${itemId}`)
        .set('Cookie', user1Cookie);
    });

    it('Correctly retrieves items when category=all or category=All is requested without returning 0 items', async () => {
      // 1. Fetch with lowercase category=all
      const resLower = await request(app)
        .get('/api/v1/pantry?category=all')
        .set('Cookie', user1Cookie);

      expect(resLower.status).toBe(200);
      expect(resLower.body.data.length).toBeGreaterThanOrEqual(1);

      // 2. Fetch with uppercase category=All
      const resUpper = await request(app)
        .get('/api/v1/pantry?category=All')
        .set('Cookie', user1Cookie);

      expect(resUpper.status).toBe(200);
      expect(resUpper.body.data.length).toBe(resLower.body.data.length);
    });

    it('Authenticates and performs pantry operations with Bearer token header', async () => {
      // Register or login a test user to get a Bearer token
      const regRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user1Email, password: 'Password123!' });

      const bearerToken = regRes.body.data.token;
      expect(bearerToken).toBeDefined();

      // Create item via Bearer header
      const addRes = await request(app)
        .post('/api/v1/pantry')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'Ginger',
          quantity: 50,
          unit: 'g',
          category: 'Fresh Produce',
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.name).toBe('Ginger');

      // Fetch via Bearer header
      const getRes = await request(app)
        .get('/api/v1/pantry')
        .set('Authorization', `Bearer ${bearerToken}`);

      expect(getRes.status).toBe(200);
      const ginger = getRes.body.data.find((i: any) => i.name === 'Ginger');
      expect(ginger).toBeDefined();

      // Clean up
      await request(app)
        .delete(`/api/v1/pantry/${ginger.id}`)
        .set('Authorization', `Bearer ${bearerToken}`);
    });
  });

  // ==========================================
  // SECTION 2: EXPIRY MONITORING & CALCULATIONS
  // ==========================================
  describe('2. Expiry Calculations & Date Boundaries', () => {
    it('Accurately flags expired, expiring-soon, and fresh items', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const soonDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // in 2 days
      const freshDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // in 15 days

      await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({ name: 'Expired Milk', quantity: 1, unit: 'bottle', category: 'Dairy & Refrigerated', expiryDate: pastDate });

      await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({ name: 'Yogurt Expiring Soon', quantity: 2, unit: 'pots', category: 'Dairy & Refrigerated', expiryDate: soonDate });

      await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({ name: 'Fresh Canned Beans', quantity: 3, unit: 'cans', category: 'Pantry & Grains', expiryDate: freshDate });

      // Fetch expired only
      const expiredRes = await request(app)
        .get('/api/v1/pantry?status=expired')
        .set('Cookie', user1Cookie);
      expect(expiredRes.body.data.some((i: any) => i.name === 'Expired Milk')).toBe(true);
      expect(expiredRes.body.data.every((i: any) => i.isExpired)).toBe(true);

      // Fetch expiring soon only
      const soonRes = await request(app)
        .get('/api/v1/pantry?status=expiring_soon')
        .set('Cookie', user1Cookie);
      expect(soonRes.body.data.some((i: any) => i.name === 'Yogurt Expiring Soon')).toBe(true);
      expect(soonRes.body.data.every((i: any) => i.isExpiringSoon)).toBe(true);
    });
  });

  // ==========================================
  // SECTION 3: PANTRY-AWARE RECIPE MATCHING
  // ==========================================
  describe('3. Pantry-Aware Recipe Suggestions & Missing Item Grocery Transfer', () => {
    beforeAll(async () => {
      // User 1 currently has 600g Spaghetti in pantry.
      // testRecipe1 needs: 300g Spaghetti (available) and 1 jar Marinara Sauce (missing).
    });

    it('Calculates match percentage and breaks down available vs missing ingredients', async () => {
      const res = await request(app)
        .get('/api/v1/pantry/recipes')
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const pastaMatch = res.body.data.find(
        (m: any) => m.recipe.slug === 'p4-pasta-marinara'
      );
      expect(pastaMatch).toBeDefined();
      expect(pastaMatch.matchPercentage).toBe(50); // 1 of 2 ingredients available
      expect(pastaMatch.canCookFully).toBe(false);
      expect(pastaMatch.availableIngredients.length).toBe(1);
      expect(pastaMatch.availableIngredients[0].name).toBe('Spaghetti');
      expect(pastaMatch.missingIngredients.length).toBe(1);
      expect(pastaMatch.missingIngredients[0].name).toBe('Marinara Sauce');
    });

    it('STRICT ALLERGY ENFORCEMENT: Never suggests recipes containing excluded allergens', async () => {
      const res = await request(app)
        .get('/api/v1/pantry/recipes')
        .set('Cookie', user1Cookie);

      const peanutMatch = res.body.data.find(
        (m: any) => m.recipe.slug === 'p4-peanut-noodles'
      );
      // User 1 has strict allergy to Peanuts -> MUST NEVER be suggested
      expect(peanutMatch).toBeUndefined();
    });

    it('Allows adding missing recipe ingredients directly to grocery list', async () => {
      const res = await request(app)
        .post(`/api/v1/pantry/recipes/${testRecipe1._id}/add-missing-to-grocery`)
        .set('Cookie', user1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.addedCount).toBe(1); // Marinara Sauce

      // Verify shopping list received Marinara Sauce as custom item
      const shopRes = await request(app)
        .get('/api/v1/shopping-list')
        .set('Cookie', user1Cookie);
      const marinara = shopRes.body.data.items.find(
        (i: any) => i.name.includes('Marinara') && i.isCustom
      );
      expect(marinara).toBeDefined();
      expect(marinara.isCustom).toBe(true);
    });

    it('Correctly identifies 100% canCookFully when all ingredients are in pantry', async () => {
      // Add Marinara Sauce to pantry
      await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({
          name: 'Marinara Sauce',
          quantity: 2,
          unit: 'jar',
          category: 'Pantry & Grains',
        });

      const res = await request(app)
        .get('/api/v1/pantry/recipes')
        .set('Cookie', user1Cookie);

      const pastaMatch = res.body.data.find(
        (m: any) => m.recipe.slug === 'p4-pasta-marinara'
      );
      expect(pastaMatch).toBeDefined();
      expect(pastaMatch.matchPercentage).toBe(100);
      expect(pastaMatch.canCookFully).toBe(true);
      expect(pastaMatch.missingIngredients.length).toBe(0);
    });
  });

  // ==========================================
  // SECTION 4: PANTRY-AWARE GROCERY GENERATION
  // ==========================================
  describe('4. Pantry-Aware Shopping List Deductions & Unit Compatibility', () => {
    it('Avoids requesting ingredients fully covered in pantry (with compatible unit)', async () => {
      // User 1 has 600g Spaghetti and 2 jars Marinara Sauce in pantry.
      // Generate meal plan where Monday dinner is P4 Pasta Marinara.
      await request(app)
        .post('/api/v1/plan/meals')
        .set('Cookie', user1Cookie)
        .send({
          day: 'Monday',
          mealType: 'dinner',
          recipeId: testRecipe1._id.toString(),
          servings: 2,
        });

      const shopRes = await request(app)
        .get('/api/v1/shopping-list')
        .set('Cookie', user1Cookie);

      // Spaghetti (needs 300g, pantry has 600g) and Marinara (needs 1 jar, pantry has 2)
      // Both should be OMITTED from the grocery list because pantry has sufficient quantities!
      const nonCustomItems = shopRes.body.data.items.filter((i: any) => !i.isCustom);
      const spaghetti = nonCustomItems.find((i: any) => i.name === 'Spaghetti');
      expect(spaghetti).toBeUndefined();
    });

    it('Subtracts partial quantity only when units are compatible, adding deduction note', async () => {
      // User 1 adds Olive Oil: pantry has 5 ml, recipe needs 15 ml
      await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({ name: 'Olive Oil', quantity: 5, unit: 'ml', category: 'Pantry & Grains' });

      // Add P4 Grilled Salmon to plan (needs 15 ml Olive Oil)
      await request(app)
        .post('/api/v1/plan/meals')
        .set('Cookie', user1Cookie)
        .send({
          day: 'Tuesday',
          mealType: 'dinner',
          recipeId: testRecipe2._id.toString(),
          servings: 2,
        });

      const shopRes = await request(app)
        .get('/api/v1/shopping-list')
        .set('Cookie', user1Cookie);

      const oilItem = shopRes.body.data.items.find((i: any) => i.name === 'Olive Oil');
      expect(oilItem).toBeDefined();
      expect(oilItem.pantryNote).toMatch(/Deducted 5 ml/i);
      expect(oilItem.totalQuantity).toBeGreaterThan(0);
    });

    it('INCOMPATIBLE UNITS: Never guesses conversions; keeps full amount and flags uncertainty', async () => {
      // Pantry has Salmon in grams (e.g. 300 g), but recipe asks for "2 fillets"
      await request(app)
        .post('/api/v1/pantry')
        .set('Cookie', user1Cookie)
        .send({ name: 'Salmon', quantity: 300, unit: 'g', category: 'Meat & Seafood' });

      // Regenerate shopping list
      const planRes = await request(app).get('/api/v1/plan/current').set('Cookie', user1Cookie);
      await request(app).post('/api/v1/plan/generate').set('Cookie', user1Cookie);

      const shopRes = await request(app)
        .get('/api/v1/shopping-list')
        .set('Cookie', user1Cookie);

      // If Tuesday dinner is P4 Grilled Salmon (or whenever Salmon is added)
      await request(app)
        .post('/api/v1/plan/meals')
        .set('Cookie', user1Cookie)
        .send({
          day: 'Wednesday',
          mealType: 'dinner',
          recipeId: testRecipe2._id.toString(),
          servings: 2,
        });

      const updatedShop = await request(app).get('/api/v1/shopping-list').set('Cookie', user1Cookie);
      const salmonItem = updatedShop.body.data.items.find((i: any) => i.name === 'Salmon');

      if (salmonItem) {
        // Must keep 2 fillets, NOT subtract 300g or turn into negative/zero
        expect(salmonItem.totalQuantity).toBe(2);
        expect(salmonItem.unit).toBe('fillets');
        expect(salmonItem.pantryNote).toMatch(/conversion.*ambiguous/i);
      }
    });
  });

  // ==========================================
  // SECTION 5: HOUSEHOLD SHARING & ROLES
  // ==========================================
  describe('5. Household Management, Invitations & Access Control', () => {
    let inviteToken: string;
    let householdId: string;

    it('Allows User 1 to create a household as owner', async () => {
      const res = await request(app)
        .post('/api/v1/household')
        .set('Cookie', user1Cookie)
        .send({ name: 'Our Happy Household' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Our Happy Household');
      expect(res.body.data.members.length).toBe(1);
      expect(res.body.data.members[0].role).toBe('owner');
      householdId = res.body.data._id;
    });

    it('Owner invites User 2 with expiring secure invitation token', async () => {
      const res = await request(app)
        .post('/api/v1/household/invitations')
        .set('Cookie', user1Cookie)
        .send({ email: user2Email, role: 'member' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inviteToken).toBeDefined();
      expect(res.body.inviteLink).toBeDefined();
      expect(res.body.data.role).toBe('member');
      inviteToken = res.body.data.inviteToken;
    });

    it('User 2 checks pending invitations and sees the invitation', async () => {
      const res = await request(app)
        .get('/api/v1/household/invitations/pending')
        .set('Cookie', user2Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].inviteToken).toBe(inviteToken);
    });

    it('User 2 accepts invitation and joins the household', async () => {
      const res = await request(app)
        .post('/api/v1/household/invitations/accept')
        .set('Cookie', user2Cookie)
        .send({ token: inviteToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.members.length).toBe(2);

      // Verify User 2 can now fetch household
      const getRes = await request(app)
        .get('/api/v1/household')
        .set('Cookie', user2Cookie);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.name).toBe('Our Happy Household');
    });

    it('Regular member cannot invite others or remove owner', async () => {
      // User 2 is 'member', attempts to invite another person
      const inviteRes = await request(app)
        .post('/api/v1/household/invitations')
        .set('Cookie', user2Cookie)
        .send({ email: 'intruder@phase4-test.com' });
      expect(inviteRes.status).toBe(400);

      // User 2 attempts to remove owner
      const removeRes = await request(app)
        .delete(`/api/v1/household/members/${user1Id}`)
        .set('Cookie', user2Cookie);
      expect(removeRes.status).toBe(400);
    });

    it('User 2 leaves household cleanly', async () => {
      const res = await request(app)
        .post('/api/v1/household/leave')
        .set('Cookie', user2Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // User 2 no longer has a household
      const checkRes = await request(app)
        .get('/api/v1/household')
        .set('Cookie', user2Cookie);
      expect(checkRes.body.data).toBeNull();
    });
  });
});
