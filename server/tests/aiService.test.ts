import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/index.js';
import { User } from '../src/models/User.js';
import { Recipe } from '../src/models/Recipe.js';
import { Preference } from '../src/models/Preference.js';
import { MealPlan } from '../src/models/MealPlan.js';
import { AiService } from '../src/services/aiService.js';
import { EntitlementService, EntitlementError } from '../src/services/entitlementService.js';
import * as geminiConfig from '../src/config/gemini.js';

describe('Google Gemini AI Integration & Allergen Safety Guardrails', () => {
  let authCookie: string;
  let testUserId: string;

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/mise_meal_planner_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up test users
    await User.deleteMany({ email: /@ai-test\.com/ });

    // Register test user
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'AI Test User',
      email: 'aiuser@ai-test.com',
      password: 'Password123!',
    });

    authCookie = res.headers['set-cookie'][0];
    testUserId = res.body.data.id;

    // Seed test preference
    await Preference.findOneAndUpdate(
      { user: testUserId },
      {
        $set: {
          supermarket: 'Kroger',
          householdSize: 2,
          cookingDays: ['Monday', 'Tuesday', 'Wednesday'],
          dietaryNeeds: ['Vegetarian'],
          allergies: ['Peanuts', 'Dairy'],
          vibes: ['Speedy Meals'],
        },
      },
      { upsert: true }
    );
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@ai-test\.com/ });
  });

  describe('1. Deterministic Server-Side Safety Audit', () => {
    it('approves a completely safe vegetarian recipe with no peanuts or dairy', () => {
      const safeRecipe: any = {
        title: 'Safe Lentil Bowl',
        description: 'Nutritious lentil bowl with greens',
        cuisine: 'Indian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 450,
        carbsGrams: 65,
        proteinGrams: 20,
        fatGrams: 10,
        ingredients: [
          { name: 'Brown Lentils', quantity: 200, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 0.9 },
          { name: 'Baby Spinach', quantity: 100, unit: 'g', aisle: 'Fresh Produce', estimatedCost: 1.2 },
          { name: 'Olive Oil', quantity: 1, unit: 'tbsp', aisle: 'Pantry & Grains', estimatedCost: 0.2 },
        ],
        instructions: ['Boil lentils', 'Toss spinach'],
        dietaryTags: ['Vegan', 'Vegetarian'],
        allergens: [],
        equipmentNeeded: ['Hob Only'],
      };

      const audit = AiService.auditRecipeSafety(safeRecipe, ['Peanuts', 'Dairy'], ['Vegetarian']);
      expect(audit.safe).toBe(true);
    });

    it('rejects an AI recipe that includes an excluded allergen in its allergen tags', () => {
      const unsafeRecipe: any = {
        title: 'Satay Noodles',
        description: 'Satay noodles',
        cuisine: 'Asian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 500,
        carbsGrams: 50,
        proteinGrams: 20,
        fatGrams: 20,
        ingredients: [
          { name: 'Rice Noodles', quantity: 150, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.0 },
        ],
        instructions: ['Boil noodles'],
        dietaryTags: ['Vegetarian'],
        allergens: ['Peanuts'], // VIOLATION!
        equipmentNeeded: ['Hob Only'],
      };

      const audit = AiService.auditRecipeSafety(unsafeRecipe, ['Peanuts', 'Dairy'], ['Vegetarian']);
      expect(audit.safe).toBe(false);
      expect(audit.reason).toContain('Recipe declared excluded allergen tag: Peanuts');
    });

    it('rejects an AI recipe that hallucinates a dairy ingredient even if allergen tag was omitted', () => {
      const sneakyDairyRecipe: any = {
        title: 'Creamy Pasta',
        description: 'Creamy pasta bowl',
        cuisine: 'Italian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 550,
        carbsGrams: 60,
        proteinGrams: 15,
        fatGrams: 22,
        ingredients: [
          { name: 'Penne', quantity: 200, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 1.0 },
          { name: 'Grated Parmesan Cheese', quantity: 40, unit: 'g', aisle: 'Dairy & Refrigerated', estimatedCost: 1.2 }, // VIOLATION!
        ],
        instructions: ['Boil pasta', 'Stir cheese'],
        dietaryTags: ['Vegetarian'],
        allergens: [], // Sneakily left empty by AI
        equipmentNeeded: ['Hob Only'],
      };

      const audit = AiService.auditRecipeSafety(sneakyDairyRecipe, ['Peanuts', 'Dairy'], ['Vegetarian']);
      expect(audit.safe).toBe(false);
      expect(audit.reason).toContain('matches excluded allergen "Dairy"');
    });

    it('rejects an AI recipe that includes meat when user profile is Vegetarian', () => {
      const meatRecipe: any = {
        title: 'Chicken Stir-Fry',
        description: 'Chicken with veg',
        cuisine: 'Asian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 500,
        carbsGrams: 30,
        proteinGrams: 45,
        fatGrams: 15,
        ingredients: [
          { name: 'Chicken Breast Strips', quantity: 250, unit: 'g', aisle: 'Meat & Seafood', estimatedCost: 3.5 },
        ],
        instructions: ['Cook chicken'],
        dietaryTags: ['None'],
        allergens: [],
        equipmentNeeded: ['Hob Only'],
      };

      const audit = AiService.auditRecipeSafety(meatRecipe, [], ['Vegetarian']);
      expect(audit.safe).toBe(false);
      expect(audit.reason).toContain('Vegetarian violation: Ingredient "Chicken Breast Strips" contains meat');
    });
  });

  describe('2. Deterministic Fallback & Graceful Degradation', () => {
    it('returns a safe verified database recipe with fallback=true when AI features are unconfigured or offline', async () => {
      // With ENABLE_AI_FEATURES unconfigured or disabled, endpoint should safely return verified DB recipe
      const res = await request(app)
        .post('/api/v1/ai/leftover-recipe')
        .set('Cookie', authCookie)
        .send({
          ingredients: ['Spinach', 'Chickpeas'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.fallback).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBeDefined();
      // Ensure the returned recipe contains none of the user's allergens (Peanuts, Dairy)
      expect(res.body.data.allergens).not.toContain('Peanuts');
      expect(res.body.data.allergens).not.toContain('Dairy');
    });

    it('handles natural-language plan intent with deterministic fallback when AI is disabled', async () => {
      const res = await request(app)
        .post('/api/v1/ai/plan-intent')
        .set('Cookie', authCookie)
        .send({
          prompt: 'I want quick speedy comfort meals for gym weeknights',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.fallback).toBe(true);
      expect(res.body.data.dinners.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Validation & Entitlement Quota Limits', () => {
    it('rejects empty ingredients array with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/ai/leftover-recipe')
        .set('Cookie', authCookie)
        .send({
          ingredients: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects prompts that are too short with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/ai/plan-intent')
        .set('Cookie', authCookie)
        .send({
          prompt: 'hi',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('enforces weekly AI quota and returns 403 UPGRADE_REQUIRED when limit is reached', async () => {
      // Simulate quota exhaustion
      await User.findByIdAndUpdate(testUserId, {
        $set: { aiGenerationsThisWeek: 5, lastAiGenerationAt: new Date() },
      });

      const res = await request(app)
        .post('/api/v1/ai/leftover-recipe')
        .set('Cookie', authCookie)
        .send({
          ingredients: ['Rice', 'Beans'],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UPGRADE_REQUIRED');
      expect(res.body.feature).toBe('maxWeeklyAiQueries');
    });

    it('prunes expired timestamps (>7 days) so old usage does not block new queries', async () => {
      // Simulate 5 queries made 8 days ago
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      await User.findByIdAndUpdate(testUserId, {
        $set: {
          aiGenerationsThisWeek: 5,
          lastAiGenerationAt: eightDaysAgo,
          aiUsageTimestamps: [eightDaysAgo, eightDaysAgo, eightDaysAgo, eightDaysAgo, eightDaysAgo],
        },
      });

      // User should now be permitted to query
      const res = await request(app)
        .post('/api/v1/ai/leftover-recipe')
        .set('Cookie', authCookie)
        .send({
          ingredients: ['Spinach', 'Chickpeas'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('refunds reserved quota when fallback is triggered due to offline AI', async () => {
      // Reset user to 0 queries
      await User.findByIdAndUpdate(testUserId, {
        $set: { aiGenerationsThisWeek: 0, aiUsageTimestamps: [] },
      });

      const res = await request(app)
        .post('/api/v1/ai/leftover-recipe')
        .set('Cookie', authCookie)
        .send({
          ingredients: ['Spinach', 'Chickpeas'],
        });

      expect(res.status).toBe(200);
      expect(res.body.fallback).toBe(true);

      // Verify that the user was NOT charged quota for the offline fallback
      const user = await User.findById(testUserId);
      expect(user?.aiUsageTimestamps?.length || 0).toBe(0);
      expect(user?.aiGenerationsThisWeek || 0).toBe(0);
    });
  });

  describe('4. Google Gemini SDK Integration, Streaming & Failures', () => {
    it('cleanJson helper strips markdown code fences correctly', () => {
      const fenced = '```json\n{"title": "Gemini Curry"}\n```';
      expect(AiService.cleanJson(fenced)).toBe('{"title": "Gemini Curry"}');

      const plainFenced = '```\n{"title": "Gemini Curry"}\n```';
      expect(AiService.cleanJson(plainFenced)).toBe('{"title": "Gemini Curry"}');

      const raw = '{"title": "Gemini Curry"}';
      expect(AiService.cleanJson(raw)).toBe('{"title": "Gemini Curry"}');
    });

    it('returns isAiGenerated=true and commits quota when Gemini returns a valid safe recipe', async () => {
      const mockRecipe = {
        title: 'Gemini Vegetable Fried Rice',
        description: 'A fragrant vegetarian fried rice with greens',
        cuisine: 'Asian',
        vibes: ['Speedy Meals'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        calories: 380,
        carbsGrams: 55,
        proteinGrams: 14,
        fatGrams: 8,
        ingredients: [
          { name: 'Jasmine Rice', quantity: 200, unit: 'g', aisle: 'Pantry & Grains', estimatedCost: 0.8 },
          { name: 'Baby Spinach', quantity: 100, unit: 'g', aisle: 'Fresh Produce', estimatedCost: 1.2 },
        ],
        instructions: ['Cook rice', 'Stir-fry with spinach and olive oil'],
        dietaryTags: ['Vegetarian'],
        allergens: [],
        equipmentNeeded: ['Hob Only'],
      };

      const isEnabledSpy = vi.spyOn(geminiConfig, 'isAIFeatureEnabled').mockReturnValue(true);
      const getClientSpy = vi.spyOn(geminiConfig, 'getGeminiClient').mockReturnValue({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify(mockRecipe),
          }),
        },
      } as any);

      await User.findByIdAndUpdate(testUserId, {
        $set: { aiGenerationsThisWeek: 0, aiUsageTimestamps: [] },
      });

      const res = await request(app)
        .post('/api/v1/ai/leftover-recipe')
        .set('Cookie', authCookie)
        .send({
          ingredients: ['Rice', 'Spinach'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Gemini Vegetable Fried Rice');
      expect(res.body.isAiGenerated).toBe(true);
      expect(res.body.fallback).toBe(false);

      // Verify quota was committed
      const user = await User.findById(testUserId);
      expect(user?.aiUsageTimestamps?.length).toBe(1);

      isEnabledSpy.mockRestore();
      getClientSpy.mockRestore();
    });

    it('handles malformed Gemini JSON by rolling back quota and returning safe database fallback', async () => {
      const isEnabledSpy = vi.spyOn(geminiConfig, 'isAIFeatureEnabled').mockReturnValue(true);
      const getClientSpy = vi.spyOn(geminiConfig, 'getGeminiClient').mockReturnValue({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: 'I cannot generate JSON right now.',
          }),
        },
      } as any);

      await User.findByIdAndUpdate(testUserId, {
        $set: { aiGenerationsThisWeek: 0, aiUsageTimestamps: [] },
      });

      const res = await request(app)
        .post('/api/v1/ai/leftover-recipe')
        .set('Cookie', authCookie)
        .send({
          ingredients: ['Spinach', 'Chickpeas'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.fallback).toBe(true);
      expect(res.body.data).toBeDefined();

      // Verify quota was refunded
      const user = await User.findById(testUserId);
      expect(user?.aiUsageTimestamps?.length || 0).toBe(0);

      isEnabledSpy.mockRestore();
      getClientSpy.mockRestore();
    });

    it('handles Gemini timeout by rolling back quota and returning safe database fallback', async () => {
      const isEnabledSpy = vi.spyOn(geminiConfig, 'isAIFeatureEnabled').mockReturnValue(true);
      const getClientSpy = vi.spyOn(geminiConfig, 'getGeminiClient').mockReturnValue({
        models: {
          generateContent: vi.fn().mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini request timed out after 15000ms')), 50))),
        },
      } as any);

      await User.findByIdAndUpdate(testUserId, {
        $set: { aiGenerationsThisWeek: 0, aiUsageTimestamps: [] },
      });

      const res = await request(app)
        .post('/api/v1/ai/leftover-recipe')
        .set('Cookie', authCookie)
        .send({
          ingredients: ['Spinach', 'Chickpeas'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.fallback).toBe(true);

      const user = await User.findById(testUserId);
      expect(user?.aiUsageTimestamps?.length || 0).toBe(0);

      isEnabledSpy.mockRestore();
      getClientSpy.mockRestore();
    });

    it('parses plan intent with Gemini and updates weekly meal plan', async () => {
      const isEnabledSpy = vi.spyOn(geminiConfig, 'isAIFeatureEnabled').mockReturnValue(true);
      const getClientSpy = vi.spyOn(geminiConfig, 'getGeminiClient').mockReturnValue({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              summary: 'Healthy Asian vibes tailored for early week',
              preferredVibes: ['Speedy Meals'],
              dayOverrides: {
                Monday: { vibe: 'Speedy Meals', cuisine: 'Asian' },
              },
            }),
          }),
        },
      } as any);

      const res = await request(app)
        .post('/api/v1/ai/plan-intent')
        .set('Cookie', authCookie)
        .send({
          prompt: 'I want quick speedy Asian dinners this week',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isAiGenerated).toBe(true);
      expect(res.body.fallback).toBe(false);
      expect(res.body.summary).toBe('Healthy Asian vibes tailored for early week');
      expect(res.body.data.dinners.length).toBeGreaterThanOrEqual(1);

      isEnabledSpy.mockRestore();
      getClientSpy.mockRestore();
    });
  });
});
