import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/index.js';
import { Recipe } from '../src/models/Recipe.js';
import { User } from '../src/models/User.js';
import { Preference } from '../src/models/Preference.js';
import { MealPlan } from '../src/models/MealPlan.js';
import { ShoppingList } from '../src/models/ShoppingList.js';
import { PlannerService } from '../src/services/plannerService.js';
import { ShoppingListService } from '../src/services/shoppingListService.js';

describe('Mise Meal Planner Backend API & Core Engine', () => {
  let authCookie: string;
  let testUserId: string;

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/mise_meal_planner_test';
    await mongoose.connect(mongoUri);
    await Recipe.deleteMany({});
    await User.deleteMany({});
    await Preference.deleteMany({});
    await MealPlan.deleteMany({});
    await ShoppingList.deleteMany({});

    // Insert controlled recipes for allergy and merging testing
    await Recipe.create([
      {
        title: 'Peanut Chicken Stir Fry',
        slug: 'peanut-chicken-stir-fry',
        description: 'Chicken with peanuts and noodles',
        image: 'https://example.com/p.jpg',
        cuisine: 'Asian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 600,
        carbsGrams: 50,
        proteinGrams: 40,
        fatGrams: 20,
        ingredients: [
          { name: 'Garlic', quantity: 2, unit: 'cloves', aisle: 'Fresh Produce', estimatedCost: 0.5 },
          { name: 'Chicken Breast', quantity: 300, unit: 'g', aisle: 'Meat & Seafood', estimatedCost: 3.5 },
          { name: 'Peanuts', quantity: 50, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.0 },
        ],
        instructions: ['Cook chicken', 'Add peanuts'],
        dietaryTags: ['None'],
        allergens: ['Peanuts', 'Gluten'],
        equipmentNeeded: ['Hob Only'],
      },
      {
        title: 'Garlic Butter Salmon',
        slug: 'garlic-butter-salmon',
        description: 'Salmon with garlic butter and greens',
        image: 'https://example.com/s.jpg',
        cuisine: 'Mediterranean',
        vibes: ['Speedy Meals', 'Protein Packed'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 12,
        servings: 2,
        calories: 550,
        carbsGrams: 10,
        proteinGrams: 45,
        fatGrams: 30,
        ingredients: [
          { name: 'Garlic', quantity: 3, unit: 'cloves', aisle: 'Fresh Produce', estimatedCost: 0.6 },
          { name: 'Salmon Fillets', quantity: 2, unit: 'pc', aisle: 'Meat & Seafood', estimatedCost: 5.0 },
        ],
        instructions: ['Sear salmon', 'Add garlic butter'],
        dietaryTags: ['Pescatarian'],
        allergens: ['Fish', 'Dairy'],
        equipmentNeeded: ['Hob Only'],
      },
      {
        title: 'Vegan Lentil Stew',
        slug: 'vegan-lentil-stew',
        description: 'Wholesome allergen-free lentil stew',
        image: 'https://example.com/l.jpg',
        cuisine: 'British',
        vibes: ['Healthy Comfort', 'Gut Friendly'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 25,
        servings: 2,
        calories: 450,
        carbsGrams: 60,
        proteinGrams: 22,
        fatGrams: 8,
        ingredients: [
          { name: 'Garlic', quantity: 1, unit: 'cloves', aisle: 'Fresh Produce', estimatedCost: 0.2 },
          { name: 'Lentils', quantity: 200, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.0 },
        ],
        instructions: ['Boil lentils', 'Stir and simmer'],
        dietaryTags: ['Vegan', 'Vegetarian'],
        allergens: [],
        equipmentNeeded: ['Hob Only'],
      },
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('mise-backend-api');
  });

  it('POST /api/v1/auth/register should create user and set cookie', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test Cook',
      email: 'testcook@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('testcook@example.com');
    testUserId = res.body.data.id;

    // Cookie verification
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    authCookie = cookies[0];
  });

  it('POST /api/v1/auth/login should authenticate user with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'testcook@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Cook');
  });

  it('STRICT ALLERGY EXCLUSION: Must completely filter out allergen-containing recipes', async () => {
    // Set user preference to exclude Peanuts
    const pref = await Preference.findOne({ user: testUserId });
    expect(pref).toBeDefined();
    pref!.allergies = ['Peanuts'];
    await pref!.save();

    // Query engine
    const safeQuery = PlannerService.buildSafetyQuery(pref!);
    const safeRecipes = await Recipe.find(safeQuery);

    // Assert that NO recipe with Peanuts was returned
    const containsPeanuts = safeRecipes.some((r) => r.allergens.includes('Peanuts'));
    expect(containsPeanuts).toBe(false);

    // Peanut recipe must not be in safeRecipes
    const peanutRecipe = safeRecipes.find((r) => r.slug === 'peanut-chicken-stir-fry');
    expect(peanutRecipe).toBeUndefined();
  });

  it('SHOPPING LIST INGREDIENT MERGING: Merges identical ingredients across recipes', async () => {
    const pref = await Preference.findOne({ user: testUserId });
    pref!.allergies = [];
    pref!.cookingDays = ['Monday', 'Tuesday'];
    pref!.householdSize = 2; // size ratio = 1.0
    await pref!.save();

    // Generate plan
    const plan = await PlannerService.generateWeeklyPlan(testUserId, pref!);
    expect(plan.dinners.length).toBe(2);

    // Generate shopping list
    const shoppingList = await ShoppingListService.generateOrUpdateShoppingList(
      testUserId,
      plan._id.toString()
    );

    // In both recipes chosen (or in our recipes), Garlic is used in multiple dishes.
    // The shopping list must have ONLY ONE consolidated "Garlic" item
    const garlicItems = shoppingList.items.filter(
      (i) => ShoppingListService.normalizeIngredientName(i.name) === 'garlic'
    );

    expect(garlicItems.length).toBe(1);
    expect(garlicItems[0].totalQuantity).toBeGreaterThan(0);
    expect(garlicItems[0].aisle).toBe('Fresh Produce');
  });

  it('PATCH /api/v1/shopping-list/item/:id should toggle bought status', async () => {
    const list = await ShoppingList.findOne({ user: testUserId });
    const firstItem = list!.items[0];

    const res = await request(app)
      .patch(`/api/v1/shopping-list/item/${firstItem.id}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = res.body.data.items.find((i: any) => i.id === firstItem.id);
    expect(updated.isBought).toBe(!firstItem.isBought);
  });
});
