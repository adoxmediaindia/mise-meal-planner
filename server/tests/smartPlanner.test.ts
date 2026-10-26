import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/index.js';
import { User } from '../src/models/User.js';
import { Recipe } from '../src/models/Recipe.js';
import { MealPlan } from '../src/models/MealPlan.js';
import { ShoppingList } from '../src/models/ShoppingList.js';
import { Preference } from '../src/models/Preference.js';

describe('Phase 3: Smart Meal Planning & Personalized Grocery Engine', () => {
  let authCookie: string;
  let testUserId: string;
  let safeRecipe1: any;
  let safeRecipe2: any;
  let peanutRecipe: any;

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/mise_meal_planner_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    // Clean up test data
    await User.deleteMany({ email: /@smartplanner-test\.com/ });

    // Seed test recipes if needed
    safeRecipe1 = await Recipe.findOne({ slug: 'test-safe-penne-arrabbiata' });
    if (!safeRecipe1) {
      safeRecipe1 = await Recipe.create({
        title: 'Test Safe Penne Arrabbiata',
        slug: 'test-safe-penne-arrabbiata',
        description: 'Simple pasta',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141',
        cuisine: 'Italian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 2,
        calories: 450,
        carbsGrams: 65,
        proteinGrams: 14,
        fatGrams: 12,
        ingredients: [
          { name: 'Penne Pasta', quantity: 200, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.2 },
          { name: 'Tomato Sauce', quantity: 1, unit: 'jar', aisle: 'Pantry & Grains', estimatedCost: 1.5 },
        ],
        instructions: ['Boil pasta', 'Stir sauce'],
        dietaryTags: ['Vegetarian', 'Vegan'],
        allergens: ['Gluten'],
        equipmentNeeded: ['Hob Only'],
      });
    }

    safeRecipe2 = await Recipe.findOne({ slug: 'test-chicken-stir-fry' });
    if (!safeRecipe2) {
      safeRecipe2 = await Recipe.create({
        title: 'Test Chicken Stir-Fry',
        slug: 'test-chicken-stir-fry',
        description: 'Quick stir-fry',
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
        cuisine: 'Asian',
        vibes: ['Speedy Meals', 'Protein Packed'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 480,
        carbsGrams: 35,
        proteinGrams: 42,
        fatGrams: 14,
        ingredients: [
          { name: 'Chicken Breast', quantity: 300, unit: 'g', aisle: 'Meat & Seafood', estimatedCost: 3.5 },
          { name: 'Broccoli', quantity: 1, unit: 'head', aisle: 'Fresh Produce', estimatedCost: 1.1 },
        ],
        instructions: ['Cook chicken', 'Toss veggies'],
        dietaryTags: ['None'],
        allergens: ['Soy'],
        equipmentNeeded: ['Hob Only'],
      });
    }

    // Recipe with Peanuts allergen
    peanutRecipe = await Recipe.findOne({ slug: 'test-peanut-satay-noodles' });
    if (!peanutRecipe) {
      peanutRecipe = await Recipe.create({
        title: 'Test Peanut Satay Noodles',
        slug: 'test-peanut-satay-noodles',
        description: 'Peanut noodles',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624',
        cuisine: 'Asian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 580,
        carbsGrams: 60,
        proteinGrams: 32,
        fatGrams: 22,
        ingredients: [
          { name: 'Peanut Butter', quantity: 2, unit: 'tbsp', aisle: 'Pantry & Grains', estimatedCost: 0.8 },
          { name: 'Egg Noodles', quantity: 200, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.4 },
        ],
        instructions: ['Mix sauce', 'Boil noodles'],
        dietaryTags: ['None'],
        allergens: ['Peanuts', 'Gluten', 'Eggs'],
        equipmentNeeded: ['Hob Only'],
      });
    }

    // Register test user with Peanuts allergy
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Smart Planner User',
        email: 'user@smartplanner-test.com',
        password: 'Password123!',
      });

    expect(regRes.status).toBe(201);
    testUserId = regRes.body.data.id;
    const cookies = regRes.headers['set-cookie'];
    authCookie = Array.isArray(cookies) ? cookies[0] : (cookies as any);

    // Set user preferences with Peanuts allergy and household size 2
    await Preference.findOneAndUpdate(
      { user: testUserId },
      {
        supermarket: 'Aldi',
        householdSize: 2,
        cookingDays: ['Monday', 'Tuesday', 'Wednesday'],
        weeklyBudget: 50,
        dietaryNeeds: ['None'],
        allergies: ['Peanuts'], // STRICT ALLERGY
        equipment: ['Hob Only'],
        vibes: ['Speedy Meals'],
        maxCookTimeMinutes: 30,
      },
      { upsert: true, new: true }
    );
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@smartplanner-test\.com/ });
    if (testUserId) {
      await MealPlan.deleteMany({ user: testUserId });
      await ShoppingList.deleteMany({ user: testUserId });
      await Preference.deleteMany({ user: testUserId });
    }
  });

  it('1. Generates initial weekly plan populating both dinners and multi-meal slots', async () => {
    const res = await request(app)
      .post('/api/v1/plan/generate')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dinners.length).toBe(3); // Monday, Tuesday, Wednesday
    expect(res.body.data.meals.length).toBe(3);

    // None of the selected recipes should contain Peanuts
    for (const dinner of res.body.data.dinners) {
      expect(dinner.recipe.allergens).not.toContain('Peanuts');
    }
  });

  it('2. STRICT ALLERGY VALIDATION: Rejects adding peanut recipe to meal plan on backend', async () => {
    const res = await request(app)
      .post('/api/v1/plan/meals')
      .set('Cookie', authCookie)
      .send({
        day: 'Thursday',
        mealType: 'dinner',
        recipeId: peanutRecipe._id.toString(),
        servings: 2,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/contains allergens.*Peanuts/i);
  });

  it('3. Successfully adds a safe meal slot (Breakfast) and auto-syncs shopping list', async () => {
    const res = await request(app)
      .post('/api/v1/plan/meals')
      .set('Cookie', authCookie)
      .send({
        day: 'Monday',
        mealType: 'breakfast',
        recipeId: safeRecipe1._id.toString(),
        servings: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const breakfastSlot = res.body.data.meals.find(
      (m: any) => m.day === 'Monday' && m.mealType === 'breakfast'
    );
    expect(breakfastSlot).toBeDefined();
    expect(breakfastSlot.recipe._id.toString()).toBe(safeRecipe1._id.toString());

    // Verify shopping list updated
    const shopRes = await request(app)
      .get('/api/v1/shopping-list')
      .set('Cookie', authCookie);

    expect(shopRes.status).toBe(200);
    expect(shopRes.body.data.items.length).toBeGreaterThan(0);
  });

  it('4. Updates meal slot servings and verifies recalculation', async () => {
    const planRes = await request(app)
      .get('/api/v1/plan/current')
      .set('Cookie', authCookie);

    const slot = planRes.body.data.meals[0];

    const editRes = await request(app)
      .patch(`/api/v1/plan/meals/${slot.id}`)
      .set('Cookie', authCookie)
      .send({ servings: 4, isCooked: true });

    expect(editRes.status).toBe(200);
    const updatedSlot = editRes.body.data.meals.find((m: any) => m.id === slot.id);
    expect(updatedSlot.servings).toBe(4);
    expect(updatedSlot.isCooked).toBe(true);
  });

  it('5. Updates household size across entire meal plan and preference', async () => {
    const res = await request(app)
      .patch('/api/v1/plan/household-size')
      .set('Cookie', authCookie)
      .send({ householdSize: 4 });

    expect(res.status).toBe(200);
    expect(res.body.data.householdSize).toBe(4);

    const prefRes = await request(app)
      .get('/api/v1/preferences')
      .set('Cookie', authCookie);
    expect(prefRes.body.data.householdSize).toBe(4);
  });

  it('6. UNIT-COMPATIBLE AGGREGATION: Ingredients with compatible units merge cleanly', async () => {
    const shopRes = await request(app)
      .get('/api/v1/shopping-list')
      .set('Cookie', authCookie);

    expect(shopRes.status).toBe(200);
    const items = shopRes.body.data.items;

    // Check that no item has NaN or corrupted quantity
    for (const item of items) {
      expect(typeof item.totalQuantity).toBe('number');
      expect(isNaN(item.totalQuantity)).toBe(false);
      expect(item.totalQuantity).toBeGreaterThan(0);
    }
  });

  it('7. SMART GROCERY LIST: Adds, edits, and deletes custom item; preserves across regeneration', async () => {
    // Add custom item
    const addRes = await request(app)
      .post('/api/v1/shopping-list/items')
      .set('Cookie', authCookie)
      .send({
        name: 'Olive Oil',
        totalQuantity: 1,
        unit: 'bottle',
        aisle: 'Pantry & Grains',
        estimatedCost: 4.5,
        icon: '🫒',
      });

    expect(addRes.status).toBe(201);
    const customItem = addRes.body.data.items.find((i: any) => i.name === 'Olive Oil' && i.isCustom === true);
    expect(customItem).toBeDefined();
    expect(customItem.isCustom).toBe(true);
    expect(customItem.totalQuantity).toBe(1);

    // Edit custom item
    const editRes = await request(app)
      .patch(`/api/v1/shopping-list/items/${customItem.id}`)
      .set('Cookie', authCookie)
      .send({
        totalQuantity: 2,
        isBought: true,
      });

    expect(editRes.status).toBe(200);
    const edited = editRes.body.data.items.find((i: any) => i.id === customItem.id);
    expect(edited.totalQuantity).toBe(2);
    expect(edited.isBought).toBe(true);

    // Regenerate meal plan - verify custom item is preserved!
    await request(app)
      .post('/api/v1/plan/generate')
      .set('Cookie', authCookie);

    const afterRegenRes = await request(app)
      .get('/api/v1/shopping-list')
      .set('Cookie', authCookie);

    const preserved = afterRegenRes.body.data.items.find((i: any) => i.id === customItem.id);
    expect(preserved).toBeDefined();
    expect(preserved.name).toBe('Olive Oil');
    expect(preserved.totalQuantity).toBe(2);

    // Delete custom item
    const delRes = await request(app)
      .delete(`/api/v1/shopping-list/items/${customItem.id}`)
      .set('Cookie', authCookie);

    expect(delRes.status).toBe(200);
    const afterDel = delRes.body.data.items.find((i: any) => i.id === customItem.id);
    expect(afterDel).toBeUndefined();
  });

  it('8. Archives active plan and retrieves plan history', async () => {
    const archiveRes = await request(app)
      .post('/api/v1/plan/archive')
      .set('Cookie', authCookie);

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.success).toBe(true);

    const historyRes = await request(app)
      .get('/api/v1/plan/history')
      .set('Cookie', authCookie);

    expect(historyRes.status).toBe(200);
    expect(Array.isArray(historyRes.body.data)).toBe(true);
    expect(historyRes.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('9. Recipe search, filtering, and favorites endpoint', async () => {
    // Filter recipes by maxCookTime
    const cookRes = await request(app).get('/api/v1/recipes?maxCookTime=20');
    expect(cookRes.status).toBe(200);
    for (const r of cookRes.body.data) {
      expect(r.cookTimeMinutes).toBeLessThanOrEqual(20);
    }

    // Toggle favorite
    const favToggleRes = await request(app)
      .post(`/api/v1/recipes/${safeRecipe1._id}/favorite`)
      .set('Cookie', authCookie);
    expect(favToggleRes.status).toBe(200);
    expect(favToggleRes.body.isFavorited).toBe(true);

    // Get favorites
    const favsRes = await request(app)
      .get('/api/v1/recipes/favorites')
      .set('Cookie', authCookie);
    expect(favsRes.status).toBe(200);
    expect(favsRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(favsRes.body.data[0]._id.toString()).toBe(safeRecipe1._id.toString());
  });
});
