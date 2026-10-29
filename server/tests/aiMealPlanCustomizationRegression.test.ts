import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/index.js';
import { User } from '../src/models/User.js';
import { Recipe } from '../src/models/Recipe.js';
import { Preference } from '../src/models/Preference.js';
import { MealPlan } from '../src/models/MealPlan.js';
import { ShoppingList } from '../src/models/ShoppingList.js';
import { PlannerService, MEAT_KEYWORDS, SEAFOOD_KEYWORDS } from '../src/services/plannerService.js';
import { AiService } from '../src/services/aiService.js';
import { SEED_RECIPES } from '../src/seeds/recipeData.js';
import * as geminiConfig from '../src/config/gemini.js';

describe('Regression Suite: Production AI Meal Plan Customization & Strict Constraints', () => {
  let authCookie: string;
  let testUserId: string;

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/mise_meal_planner_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up any existing regression test user
    await User.deleteMany({ email: /@ai-custom-regression\.com/ });

    // Ensure all 32 seed recipes are present in the test database
    for (const recipe of SEED_RECIPES) {
      await Recipe.findOneAndUpdate(
        { slug: recipe.slug },
        { $set: recipe },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Register regression test user
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Customization Tester',
      email: 'tester@ai-custom-regression.com',
      password: 'Password123!',
    });

    authCookie = regRes.headers['set-cookie'][0];
    testUserId = regRes.body.data.id;

    // Initialize user preferences with 5 cooking days
    await Preference.findOneAndUpdate(
      { user: testUserId },
      {
        $set: {
          supermarket: 'Aldi',
          householdSize: 2,
          cookingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          dietaryNeeds: ['None'],
          allergies: [],
          vibes: ['Family Favs'],
          maxCookTimeMinutes: 60,
        },
      },
      { upsert: true }
    );
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@ai-custom-regression\.com/ });
    await MealPlan.deleteMany({ user: testUserId });
    await ShoppingList.deleteMany({ user: testUserId });
    await Preference.deleteMany({ user: testUserId });
  });

  describe('1. Natural Language Intent Parsing & Deterministic Constraints', () => {
    it('correctly translates "Make my dinners vegetarian, quick, and ready in under 25 minutes" into strict planner filters', () => {
      const parsed = AiService.parseIntentConstraints(
        'Make my dinners vegetarian, quick, and ready in under 25 minutes.'
      );

      expect(parsed.dietaryNeeds).toContain('Vegetarian');
      expect(parsed.maxCookTimeMinutes).toBe(24); // Strictly under 25 min -> max 24
      expect(parsed.vibes).toContain('Speedy Meals');
    });

    it('enforces strict < 20 min when user asks for "under 20 minutes"', () => {
      const parsed = AiService.parseIntentConstraints('Give me meals under 20 minutes');
      expect(parsed.maxCookTimeMinutes).toBe(19);
    });

    it('handles inclusive phrasing "in 25 minutes or less"', () => {
      const parsed = AiService.parseIntentConstraints('Healthy dinners in 25 minutes or less');
      expect(parsed.maxCookTimeMinutes).toBe(25);
    });
  });

  describe('2. Ingredient-Level Vegetarian Verification', () => {
    it('approves recipes where all ingredients and aisles contain zero meat/seafood', async () => {
      const dahl = await Recipe.findOne({ slug: 'red-lentil-coconut-dahl' });
      expect(dahl).toBeDefined();
      const isSafe = PlannerService.validateRecipeDietarySafety(dahl!, ['Vegetarian']);
      expect(isSafe).toBe(true);
    });

    it('strictly rejects a recipe that is falsely tagged Vegetarian if it contains meat ingredients', () => {
      const fakeVegRecipe: any = {
        title: 'Sneaky Beef Pasta',
        dietaryTags: ['Vegetarian'],
        ingredients: [
          { name: 'Penne Pasta', quantity: 200, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.0 },
          { name: 'Lean Minced Beef', quantity: 150, unit: 'g', aisle: 'Meat & Seafood', estimatedCost: 2.5 },
        ],
      };

      const isSafe = PlannerService.validateRecipeDietarySafety(fakeVegRecipe, ['Vegetarian']);
      expect(isSafe).toBe(false);
    });

    it('strictly rejects a recipe tagged Vegetarian if it contains fish sauce or seafood', () => {
      const seafoodSneak: any = {
        title: 'Tofu with Fish Sauce',
        dietaryTags: ['Vegetarian'],
        ingredients: [
          { name: 'Firm Tofu', quantity: 200, unit: 'g', aisle: 'Dairy & Refrigerated', estimatedCost: 1.5 },
          { name: 'Fish Sauce', quantity: 1, unit: 'tbsp', aisle: 'Spices & Condiments', estimatedCost: 0.3 },
        ],
      };

      const isSafe = PlannerService.validateRecipeDietarySafety(seafoodSneak, ['Vegetarian']);
      expect(isSafe).toBe(false);
    });
  });

  describe('3. Production Live Test Prompt: Vegetarian and Ready in Under 25 Minutes (Before & After Comparison)', () => {
    it('compares plan before and after submitting: strictly enforces vegetarian, < 25 min across all five weekdays, and updates both dinners and meals arrays', async () => {
      // Step A: Setup existing plan BEFORE AI Customization with non-vegetarian and >25 min recipes
      const fishTacos = await Recipe.findOne({ slug: 'crispy-air-fryer-fish-tacos' }); // Pescatarian, 12 min
      const chicken = await Recipe.findOne({ slug: 'creamy-tuscan-garlic-chicken' }); // Non-veg, 20 min
      const cottagePie = await Recipe.findOne({ slug: 'hearty-lentil-veggie-cottage-pie' }); // Veg, 30 min (exceeds 25m)
      const penne = await Recipe.findOne({ slug: 'roasted-butternut-squash-sage-pasta' }); // Veg, 25 min (exceeds <25m)
      const dahl = await Recipe.findOne({ slug: 'red-lentil-coconut-dahl' }); // Veg, 20 min

      expect(fishTacos).toBeDefined();
      expect(chicken).toBeDefined();
      expect(cottagePie).toBeDefined();
      expect(penne).toBeDefined();

      const initialDinners = [
        { day: 'Monday', recipe: fishTacos!._id, isCooked: false },
        { day: 'Tuesday', recipe: penne!._id, isCooked: false }, // 25 min violation
        { day: 'Wednesday', recipe: dahl!._id, isCooked: false },
        { day: 'Thursday', recipe: cottagePie!._id, isCooked: false }, // 30 min violation
        { day: 'Friday', recipe: chicken!._id, isCooked: false }, // Meat violation
      ];

      await MealPlan.findOneAndUpdate(
        { user: testUserId },
        {
          $set: {
            dinners: initialDinners,
            meals: initialDinners.map((d, i) => ({
              id: `slot_${i}_${d.day.toLowerCase()}_dinner`,
              day: d.day,
              mealType: 'dinner',
              recipe: d.recipe,
              servings: 2,
              isCooked: false,
            })),
          },
        },
        { upsert: true }
      );

      // Verify BEFORE plan has violations
      const beforeRes = await request(app).get('/api/v1/plan/current').set('Cookie', authCookie);
      expect(beforeRes.body.data.dinners.length).toBe(5);
      const beforeTitles = beforeRes.body.data.dinners.map((d: any) => d.recipe.title);
      expect(beforeTitles).toContain('Crispy Air Fryer Fish Tacos');
      expect(beforeTitles).toContain('Creamy Tuscan Garlic Chicken');
      expect(beforeTitles).toContain('Hearty Lentil & Veggie Cottage Pie');

      // Step B: Submit AI Customization: "Make my dinners vegetarian, quick, and ready in under 25 minutes."
      const isEnabledSpy = vi.spyOn(geminiConfig, 'isAIFeatureEnabled').mockReturnValue(true);
      const getClientSpy = vi.spyOn(geminiConfig, 'getGeminiClient').mockReturnValue({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              summary: 'Tailored 5 quick vegetarian dinners ready in under 25 minutes for the week.',
              dietaryNeeds: ['Vegetarian'],
              maxCookTimeMinutes: 24,
              preferredVibes: ['Speedy Meals'],
              cuisines: ['Indian', 'Mediterranean', 'Mexican'],
              allergies: [],
              dayOverrides: {},
            }),
          }),
        },
      } as any);

      await User.findByIdAndUpdate(testUserId, {
        $set: { aiGenerationsThisWeek: 0, aiUsageTimestamps: [] },
      });

      const res = await request(app)
        .post('/api/v1/ai/plan-intent')
        .set('Cookie', authCookie)
        .send({
          prompt: 'Make my dinners vegetarian, quick, and ready in under 25 minutes.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Step C: Verify AFTER plan - all five active cooking days are present and compliant
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const dinners = res.body.data.dinners;
      expect(dinners.length).toBe(5);
      expect(dinners.map((d: any) => d.day)).toEqual(weekdays);

      for (const dinner of dinners) {
        const recipe = dinner.recipe;

        // Requirement 1 & 2: strictly under 25 minutes and vegetarian
        expect(recipe.cookTimeMinutes).toBeLessThan(25);
        expect(recipe.cookTimeMinutes).toBeLessThanOrEqual(24);

        expect(
          recipe.dietaryTags.includes('Vegetarian') || recipe.dietaryTags.includes('Vegan')
        ).toBe(true);

        expect(recipe.title).not.toBe('Roasted Butternut Squash & Sage Penne'); // 25 min
        expect(recipe.title).not.toBe('Hearty Lentil & Veggie Cottage Pie'); // 30 min
        expect(recipe.title).not.toBe('Spinach & Ricotta Stuffed Shells'); // 25 min
        expect(recipe.title).not.toBe('Crispy Air Fryer Fish Tacos'); // Seafood
        expect(recipe.title).not.toBe('Creamy Tuscan Garlic Chicken'); // Meat

        for (const ing of recipe.ingredients) {
          expect(ing.aisle).not.toBe('Meat & Seafood');
          const lower = ing.name.toLowerCase();
          for (const kw of MEAT_KEYWORDS) {
            expect(new RegExp(`\\b${kw}\\b`, 'i').test(lower)).toBe(false);
          }
          for (const kw of SEAFOOD_KEYWORDS) {
            expect(new RegExp(`\\b${kw}\\b`, 'i').test(lower)).toBe(false);
          }
        }
      }

      // Step D: Verify meals array is also synchronized for all five days
      const meals = res.body.data.meals;
      expect(meals.length).toBe(5);
      expect(meals.map((m: any) => m.day)).toEqual(weekdays);
      for (const meal of meals) {
        expect(meal.recipe.cookTimeMinutes).toBeLessThan(25);
        expect(
          meal.recipe.dietaryTags.includes('Vegetarian') || meal.recipe.dietaryTags.includes('Vegan')
        ).toBe(true);
      }

      isEnabledSpy.mockRestore();
      getClientSpy.mockRestore();
    });
  });

  describe('4. Persistence Across Page Refresh & Grocery-List Synchronization for All Five Weekdays', () => {
    it('persists the customized 5-weekday plan strictly following constraints after simulated page refresh', async () => {
      const planRes = await request(app).get('/api/v1/plan/current').set('Cookie', authCookie);

      expect(planRes.status).toBe(200);
      expect(planRes.body.success).toBe(true);
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      expect(planRes.body.data.dinners.length).toBe(5);
      expect(planRes.body.data.dinners.map((d: any) => d.day)).toEqual(weekdays);

      for (const dinner of planRes.body.data.dinners) {
        const recipe = dinner.recipe;
        expect(recipe.cookTimeMinutes).toBeLessThan(25);
        expect(
          recipe.dietaryTags.includes('Vegetarian') || recipe.dietaryTags.includes('Vegan')
        ).toBe(true);
      }

      // Also verify persisted meals array
      expect(planRes.body.data.meals.length).toBe(5);
      expect(planRes.body.data.meals.map((m: any) => m.day)).toEqual(weekdays);
    });

    it('synchronizes the shopping list with zero meat or seafood and matches the customized 5-weekday plan', async () => {
      const shopRes = await request(app).get('/api/v1/shopping-list').set('Cookie', authCookie);

      expect(shopRes.status).toBe(200);
      expect(shopRes.body.success).toBe(true);
      expect(shopRes.body.data.items.length).toBeGreaterThan(0);

      const meatAisleItems = shopRes.body.data.items.filter(
        (item: any) => item.aisle === 'Meat & Seafood'
      );
      expect(meatAisleItems.length).toBe(0);

      for (const item of shopRes.body.data.items) {
        if (!item.isCustom) {
          const l = item.name.toLowerCase();
          for (const kw of MEAT_KEYWORDS) {
            expect(new RegExp(`\\b${kw}\\b`, 'i').test(l)).toBe(false);
          }
          for (const kw of SEAFOOD_KEYWORDS) {
            expect(new RegExp(`\\b${kw}\\b`, 'i').test(l)).toBe(false);
          }
        }
      }
    });
  });

  describe('5. Insufficient Matching Recipes Handling & Honest Limitations', () => {
    it('honestly explains limitation in summary when AI is enabled but matching recipes < requested cooking days', async () => {
      const isEnabledSpy = vi.spyOn(geminiConfig, 'isAIFeatureEnabled').mockReturnValue(true);
      const getClientSpy = vi.spyOn(geminiConfig, 'getGeminiClient').mockReturnValue({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              summary: 'Planned ultra-fast meals under 10 minutes.',
              dietaryNeeds: ['Vegetarian'],
              maxCookTimeMinutes: 9,
              preferredVibes: ['Speedy Meals'],
              cuisines: [],
              allergies: [],
              dayOverrides: {},
            }),
          }),
        },
      } as any);

      await User.findByIdAndUpdate(testUserId, {
        $set: { aiGenerationsThisWeek: 0, aiUsageTimestamps: [] },
      });

      const res = await request(app)
        .post('/api/v1/ai/plan-intent')
        .set('Cookie', authCookie)
        .send({
          prompt: 'Make my dinners vegetarian and ready in under 10 minutes',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Only 1 recipe matches: Mediterranean Greek Salad (3m)
      expect(res.body.data.dinners.length).toBe(1);
      // Limitation is honestly communicated even when Gemini supplied an initial summary
      expect(res.body.summary).toContain('Found 1 recipes matching your strict criteria');
      expect(res.body.summary).toContain('Catalog has no further unique meals');

      isEnabledSpy.mockRestore();
      getClientSpy.mockRestore();
    });

    it('offers fewer valid meals rather than silently returning meals that violate constraints in fallback', async () => {
      const isEnabledSpy = vi.spyOn(geminiConfig, 'isAIFeatureEnabled').mockReturnValue(false);

      const res = await request(app)
        .post('/api/v1/ai/plan-intent')
        .set('Cookie', authCookie)
        .send({
          prompt: 'Make my dinners vegetarian and ready in under 10 minutes',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dinners = res.body.data.dinners;
      expect(dinners.length).toBe(1);
      expect(dinners[0].recipe.cookTimeMinutes).toBeLessThan(10);
      expect(res.body.summary).toContain('Found 1 recipes matching your strict criteria');

      isEnabledSpy.mockRestore();
    });

    it('honestly rejects and informs user when 0 matching recipes exist without returning invalid meals', async () => {
      await expect(
        PlannerService.generateWeeklyPlan(testUserId, {
          cookingDays: ['Monday', 'Tuesday'],
          dietaryNeeds: ['Vegan'],
          maxCookTimeMinutes: 1,
        })
      ).rejects.toThrow(/No recipes found matching your active dietary preferences/);
    });
  });

  describe('6. Missing Image Investigation & Card Integrity', () => {
    it('verifies Wednesday recipe (Mediterranean Falafel Pitta Pockets) image URL is valid and returns HTTP 200', async () => {
      const falafel = await Recipe.findOne({ slug: 'mediterranean-falafel-pitta-pockets' });
      expect(falafel).toBeDefined();
      expect(falafel!.image).not.toContain('1593001874117-c99c800e3eb7'); // old 404 URL
      expect(falafel!.image).toContain('1529006557810-274b9b2fc783'); // new 200 URL

      const imgRes = await fetch(falafel!.image, { method: 'HEAD' });
      expect(imgRes.status).toBe(200);
    });
  });
});
