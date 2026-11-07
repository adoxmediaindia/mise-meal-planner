import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/index.js';
import { User } from '../src/models/User.js';
import { Preference } from '../src/models/Preference.js';
import { MealPlan } from '../src/models/MealPlan.js';
import { ShoppingList } from '../src/models/ShoppingList.js';
import { Recipe } from '../src/models/Recipe.js';
import { AiService } from '../src/services/aiService.js';
import { PlannerService } from '../src/services/plannerService.js';
import { ShoppingListService } from '../src/services/shoppingListService.js';

describe('Meltto Onboarding API & Shared Data Model Suite', () => {
  let userToken: string;
  let userId: string;
  const completedOnboarding = {
    usualCookingTime: '30–45 min',
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currencyCode: 'GBP',
    householdSize: 3,
    cookingDays: ['Monday', 'Wednesday', 'Friday'],
    weeklyBudget: 95,
    weeklyBudgetCurrency: 'GBP',
    mealMoods: ['Speedy Meals'],
    dietaryPreferences: ['Vegan'],
    allergies: ['Nut free'],
    appliances: ['Stovetop', 'Air Fryer'],
    onboardingStep: 25,
    onboardingCompleted: true,
  };

  const registerReliabilityUser = async (email: string) => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Reliability Test', email, password: 'password123' });
    expect(response.status).toBe(201);
    return { id: response.body.data.id as string, token: response.body.data.token as string };
  };

  const cleanupReliabilityUser = async (id: string, email: string) => {
    await ShoppingList.deleteMany({ user: id });
    await MealPlan.deleteMany({ user: id });
    await Preference.deleteMany({ user: id });
    await User.deleteMany({ _id: id, email });
  };

  const persistInitialReservation = async (
    userIdForPlan: string,
    preference: Preference,
    options?: { initialOnboardingClaimToken?: string; initialOnboardingReservationId?: string }
  ) => {
    const plan = await MealPlan.findOneAndUpdate(
      {
        _id: options?.initialOnboardingReservationId,
        user: userIdForPlan,
        isInitialOnboardingPlan: true,
        initialPlanGenerationStatus: 'pending',
        initialPlanGenerationToken: options?.initialOnboardingClaimToken,
        initialPlanGenerationLeaseUntil: { $gt: new Date() },
      },
      {
        $set: {
          weekStartDate: new Date(),
          dinners: [{
            day: 'Monday',
            recipe: new mongoose.Types.ObjectId(),
            isCooked: false,
          }],
          meals: [],
          householdSize: preference.householdSize || 2,
          estimatedCost: 0,
          budgetLimit: preference.weeklyBudget || 40,
          initialPlanGenerationStatus: 'ready',
        },
      },
      { new: true }
    ).setOptions({ includePendingInitialPlan: true });

    if (!plan) throw new Error('Test claim did not own the initial plan reservation.');
    return plan;
  };

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/mise_meal_planner_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean test users
    await User.deleteMany({ email: 'onboarding_test_user@example.com' });

    // Register a fresh user
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Initial Name',
        email: 'onboarding_test_user@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    userToken = res.body.data.token;
    userId = res.body.data.id;
  }, 30000);

      it('blocks incomplete users from AI plan intent and meal-slot plan creation', async () => {
        const email = 'onboarding_route_bypass@example.com';
        const account = await registerReliabilityUser(email);
        const aiGeneration = vi.spyOn(AiService, 'customizePlanWithIntent');
        const mealSlotGeneration = vi.spyOn(PlannerService, 'addMealSlot');

        try {
          const aiResponse = await request(app)
            .post('/api/v1/ai/plan-intent')
            .set('Authorization', `Bearer ${account.token}`)
            .send({ prompt: 'A quick vegetarian meal plan' });
          expect(aiResponse.status).toBe(409);
          expect(aiResponse.body.code).toBe('ONBOARDING_COMPLETION_REQUIRED');

          const mealResponse = await request(app)
            .post('/api/v1/plan/meals')
            .set('Authorization', `Bearer ${account.token}`)
            .send({
              day: 'Monday',
              mealType: 'lunch',
              recipeId: new mongoose.Types.ObjectId().toString(),
            });
          expect(mealResponse.status).toBe(409);
          expect(mealResponse.body.code).toBe('ONBOARDING_COMPLETION_REQUIRED');
          expect(aiGeneration).not.toHaveBeenCalled();
          expect(mealSlotGeneration).not.toHaveBeenCalled();
          expect(await MealPlan.countDocuments({ user: account.id })).toBe(0);
        } finally {
          aiGeneration.mockRestore();
          mealSlotGeneration.mockRestore();
          await cleanupReliabilityUser(account.id, email);
        }
      });

      it('keeps AI plan intent and meal-slot behavior available to fully onboarded users', async () => {
        const email = 'onboarding_routes_complete@example.com';
        const account = await registerReliabilityUser(email);
        let recipeId: mongoose.Types.ObjectId | undefined;
        const aiGeneration = vi.spyOn(AiService, 'customizePlanWithIntent');

        try {
          await User.updateOne({ _id: account.id }, { $set: { onboardingCompleted: true } });
          const plan = await MealPlan.create({
            user: account.id,
            weekStartDate: new Date(),
            dinners: [],
            meals: [],
            householdSize: 2,
            estimatedCost: 0,
            budgetLimit: 40,
          });
          aiGeneration.mockResolvedValue({
            plan,
            summary: 'Plan customized',
            isAiGenerated: false,
            fallback: true,
          });

          const aiResponse = await request(app)
            .post('/api/v1/ai/plan-intent')
            .set('Authorization', `Bearer ${account.token}`)
            .send({ prompt: 'A quick vegetarian meal plan' });
          expect(aiResponse.status).toBe(200);
          expect(aiGeneration).toHaveBeenCalledTimes(1);

          const recipe = await Recipe.create({
            title: 'Onboarding route test meal',
            slug: 'onboarding-route-test-meal',
            description: 'A test meal',
            image: 'https://example.com/meal.jpg',
            cuisine: 'Italian',
            vibes: ['Speedy Meals'],
            prepTimeMinutes: 5,
            cookTimeMinutes: 15,
            servings: 2,
            calories: 300,
            carbsGrams: 40,
            proteinGrams: 10,
            fatGrams: 8,
            ingredients: [],
            instructions: ['Prepare the test meal'],
            dietaryTags: ['Vegetarian'],
            allergens: [],
            equipmentNeeded: ['Hob Only'],
          });
          recipeId = recipe._id as mongoose.Types.ObjectId;
          await Preference.create({
            user: account.id,
            householdSize: 2,
            cookingDays: ['Monday'],
            weeklyBudget: 40,
            dietaryNeeds: ['None'],
            allergies: [],
            equipment: ['Hob Only'],
            vibes: ['Speedy Meals'],
          });

          const mealResponse = await request(app)
            .post('/api/v1/plan/meals')
            .set('Authorization', `Bearer ${account.token}`)
            .send({ day: 'Monday', mealType: 'lunch', recipeId: recipe._id.toString() });
          expect(mealResponse.status).toBe(201);
          expect(mealResponse.body.success).toBe(true);
          expect((await MealPlan.findById(plan._id))?.meals).toHaveLength(1);
        } finally {
          aiGeneration.mockRestore();
          if (recipeId) await Recipe.deleteOne({ _id: recipeId });
          await cleanupReliabilityUser(account.id, email);
        }
      });

      it('preserves an existing ordinary plan and refuses to complete onboarding around it', async () => {
        const email = 'onboarding_existing_ordinary_plan@example.com';
        const account = await registerReliabilityUser(email);
        const ordinaryPlan = await MealPlan.create({
          user: account.id,
          weekStartDate: new Date(),
          dinners: [],
          meals: [],
          householdSize: 4,
          estimatedCost: 27,
          budgetLimit: 60,
        });

        try {
          const response = await request(app)
            .patch('/api/v1/auth/onboarding')
            .set('Authorization', `Bearer ${account.token}`)
            .send(completedOnboarding);

          expect(response.status).toBe(409);
          expect(response.body.code).toBe('INITIAL_PLAN_CONFLICT');
          expect(response.body.retryable).toBe(false);
          const user = await User.findById(account.id);
          const savedPlan = await MealPlan.findById(ordinaryPlan._id);
          expect(user?.onboardingStep).toBe(25);
          expect(user?.onboardingCompleted).toBe(false);
          expect(savedPlan?.isInitialOnboardingPlan).not.toBe(true);
          expect(savedPlan?.householdSize).toBe(4);
          expect(savedPlan?.estimatedCost).toBe(27);
          expect(await MealPlan.countDocuments({ user: account.id })).toBe(1);
        } finally {
          await cleanupReliabilityUser(account.id, email);
        }
      });

  afterAll(async () => {
    if (userId) {
      await ShoppingList.deleteMany({ user: userId });
      await MealPlan.deleteMany({ user: userId });
      await Preference.deleteMany({ user: userId });
    }
    await User.deleteMany({ email: 'onboarding_test_user@example.com' });
  }, 30000);

  it('rejects unauthenticated onboarding updates with HTTP 401', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .send({ preferredLanguage: 'de' });

    expect(res.status).toBe(401);
  });

  it('SCREEN 1: updates and persists preferred language', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ preferredLanguage: 'sv' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.preferredLanguage).toBe('sv');

    // Verify GET /auth/me reflects the updated language
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.preferredLanguage).toBe('sv');
  });

  it('SCREEN 3: updates user name with strict trimming and validation', async () => {
    // Valid name with surrounding spaces
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: '  Sarah Jenkins  ' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Sarah Jenkins');

    // Reject whitespace-only name
    const emptyRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: '   ' });

    expect(emptyRes.status).toBe(400);
  });

  it('SCREEN 4: updates age range safely from allowed options', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ageRange: '25-34' });

    expect(res.status).toBe(200);
    expect(res.body.data.ageRange).toBe('25-34');

    // Rejects invalid age range
    const invalidRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ageRange: 'invalid-age' });

    expect(invalidRes.status).toBe(400);
  });

  it('SCREEN 5: updates meal planning goal and preserves onboarding not completed', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        primaryGoal: 'Meal prep for the week',
        onboardingStep: 5,
        onboardingCompleted: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.primaryGoal).toBe('Meal prep for the week');
    expect(res.body.data.onboardingStep).toBe(5);
    expect(res.body.data.onboardingCompleted).toBe(false);

    // Verify database directly
    const dbUser = await User.findById(userId);
    expect(dbUser?.preferredLanguage).toBe('sv');
    expect(dbUser?.name).toBe('Sarah Jenkins');
    expect(dbUser?.ageRange).toBe('25-34');
    expect(dbUser?.primaryGoal).toBe('Meal prep for the week');
    expect(dbUser?.onboardingStep).toBe(5);
    expect(dbUser?.onboardingCompleted).toBe(false);
  });

  it('GUEST SYNC SAFETY: ensures existing user fields are never overwritten by empty updates', async () => {
    // Current user has Sarah Jenkins and sv
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        // Payload without name or ageRange
        preferredLanguage: 'de',
        onboardingStep: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.preferredLanguage).toBe('de');
    expect(res.body.data.name).toBe('Sarah Jenkins'); // Preserved!
    expect(res.body.data.ageRange).toBe('25-34'); // Preserved!
    expect(res.body.data.primaryGoal).toBe('Meal prep for the week'); // Preserved!
  });

  it('IDEMPOTENCY: repeated updates do not create duplicate users or alter user id', async () => {
    const countBefore = await User.countDocuments({ email: 'onboarding_test_user@example.com' });
    expect(countBefore).toBe(1);

    // Call update 3 times in rapid succession
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .patch('/api/v1/auth/onboarding')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          preferredLanguage: 'en',
          primaryGoal: 'Feed my family',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(userId);
    }

    const countAfter = await User.countDocuments({ email: 'onboarding_test_user@example.com' });
    expect(countAfter).toBe(1);
  });

  it('AUTH SYNC: login and registration responses include complete onboarding profile state', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'onboarding_test_user@example.com',
        password: 'password123',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.preferredLanguage).toBe('en');
    expect(loginRes.body.data.ageRange).toBe('25-34');
    expect(loginRes.body.data.primaryGoal).toBe('Feed my family');
    expect(loginRes.body.data.onboardingStep).toBe(3);
    expect(loginRes.body.data.onboardingCompleted).toBe(false);
  });

  it('SCREEN 6: updates cookingBarrier safely and rejects invalid options', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cookingBarrier: 'Lack of time',
        onboardingStep: 7,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.cookingBarrier).toBe('Lack of time');
    expect(res.body.data.onboardingStep).toBe(7);

    // Reject invalid barrier
    const invalidRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ cookingBarrier: 'Not an allowed barrier' });

    expect(invalidRes.status).toBe(400);
  });

  it('SCREEN 8: updates shoppingSavingsConfidence safely and rejects invalid options', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        shoppingSavingsConfidence: 'Definitely',
        onboardingStep: 9,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.shoppingSavingsConfidence).toBe('Definitely');

    // Reject invalid savings option
    const invalidRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ shoppingSavingsConfidence: 'Maybe later' });

    expect(invalidRes.status).toBe(400);
  });

  it('SCREEN 9: updates usualCookingTime safely and rejects invalid options', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        usualCookingTime: '30–45 min',
        onboardingStep: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.usualCookingTime).toBe('30–45 min');

    // Reject invalid time
    const invalidRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ usualCookingTime: '5 hours' });

    expect(invalidRes.status).toBe(400);
  });

  it('SCREEN 10: updates referralSource safely, keeps onboardingCompleted false', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        referralSource: 'Instagram',
        onboardingStep: 10,
        onboardingCompleted: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.referralSource).toBe('Instagram');
    expect(res.body.data.onboardingStep).toBe(10);
    expect(res.body.data.onboardingCompleted).toBe(false);

    // Verify database document has all Batch 1 and Batch 2 fields persisted correctly
    const dbUser = await User.findById(userId);
    expect(dbUser?.cookingBarrier).toBe('Lack of time');
    expect(dbUser?.shoppingSavingsConfidence).toBe('Definitely');
    expect(dbUser?.usualCookingTime).toBe('30–45 min');
    expect(dbUser?.referralSource).toBe('Instagram');
    expect(dbUser?.onboardingCompleted).toBe(false);

    // Verify GET /auth/me returns the complete Batch 2 state
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.cookingBarrier).toBe('Lack of time');
    expect(meRes.body.data.shoppingSavingsConfidence).toBe('Definitely');
    expect(meRes.body.data.usualCookingTime).toBe('30–45 min');
    expect(meRes.body.data.referralSource).toBe('Instagram');
  });

  it('SCREEN 12: updates country and currency safely and rejects invalid currency', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        countryCode: 'US',
        countryName: 'United States',
        currencyCode: 'USD',
        onboardingStep: 13,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.countryCode).toBe('US');
    expect(res.body.data.countryName).toBe('United States');
    expect(res.body.data.currencyCode).toBe('USD');
    expect(res.body.data.onboardingStep).toBe(13);

    // Reject invalid currency
    const invalidRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ currencyCode: 'XYZ' });

    expect(invalidRes.status).toBe(400);
  });

  it('SCREEN 13: updates householdSize safely between 1 and 20 and rejects out-of-range values', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        householdSize: 4,
        onboardingStep: 14,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.householdSize).toBe(4);

    // Reject 0
    const zeroRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ householdSize: 0 });

    expect(zeroRes.status).toBe(400);

    // Reject > 20
    const overRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ householdSize: 25 });

    expect(overRes.status).toBe(400);
  });

  it('SCREEN 14: updates cookingDays, deduplicates and sorts in weekday order, rejects empty array', async () => {
    // Send un-ordered days with duplicate
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cookingDays: ['Friday', 'Monday', 'Wednesday', 'Friday'],
        onboardingStep: 15,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.cookingDays).toEqual(['Monday', 'Wednesday', 'Friday']);

    // Reject empty days array
    const emptyRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ cookingDays: [] });

    expect(emptyRes.status).toBe(400);

    // Reject invalid day string
    const invalidRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ cookingDays: ['Funday'] });

    expect(invalidRes.status).toBe(400);
  });

  it('SCREEN 15: updates weeklyBudget and currency, keeps onboardingCompleted false, and verifies DB', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        weeklyBudget: 150,
        weeklyBudgetCurrency: 'USD',
        onboardingStep: 15,
        onboardingCompleted: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.weeklyBudget).toBe(150);
    expect(res.body.data.weeklyBudgetCurrency).toBe('USD');
    expect(res.body.data.onboardingStep).toBe(15);
    expect(res.body.data.onboardingCompleted).toBe(false);

    // Reject negative budget
    const negRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ weeklyBudget: -50 });

    expect(negRes.status).toBe(400);

    // Verify User record in DB directly
    const dbUser = await User.findById(userId);
    expect(dbUser?.countryCode).toBe('US');
    expect(dbUser?.countryName).toBe('United States');
    expect(dbUser?.currencyCode).toBe('USD');
    expect(dbUser?.householdSize).toBe(4);
    expect(dbUser?.cookingDays).toEqual(['Monday', 'Wednesday', 'Friday']);
    expect(dbUser?.weeklyBudget).toBe(150);
    expect(dbUser?.weeklyBudgetCurrency).toBe('USD');
    expect(dbUser?.onboardingCompleted).toBe(false);

    // Verify GET /auth/me reflects the complete state
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.countryCode).toBe('US');
    expect(meRes.body.data.householdSize).toBe(4);
    expect(meRes.body.data.cookingDays).toEqual(['Monday', 'Wednesday', 'Friday']);
    expect(meRes.body.data.weeklyBudget).toBe(150);
  });

  it('SCREEN 17: updates and persists mealMoods up to 3 options, rejects 4', async () => {
    // Valid 3 moods
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        mealMoods: ['Speedy Meals', 'Healthy Comfort', 'Protein Packed'],
        onboardingStep: 17,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.mealMoods).toEqual(['Speedy Meals', 'Healthy Comfort', 'Protein Packed']);

    // Rejects more than 3 moods
    const overLimitRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        mealMoods: ['Speedy Meals', 'Low Calorie', 'Family Favs', 'Protein Packed'],
      });

    expect(overLimitRes.status).toBe(400);
  });

  it('SCREEN 18: updates dietaryPreferences, enforces "None" mutual exclusivity', async () => {
    // Valid specific dietary preferences
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        dietaryPreferences: ['Vegetarian', 'Pescatarian'],
        onboardingStep: 18,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.dietaryPreferences).toEqual(['Vegetarian', 'Pescatarian']);

    // Valid 'None' alone
    const noneRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        dietaryPreferences: ['None'],
      });

    expect(noneRes.status).toBe(200);
    expect(noneRes.body.data.dietaryPreferences).toEqual(['None']);

    // Rejects invalid combination of None + Vegetarian
    const invalidRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        dietaryPreferences: ['None', 'Vegetarian'],
      });

    expect(invalidRes.status).toBe(400);
  });

  it('SCREEN 19: updates allergies, enforces "None" mutual exclusivity', async () => {
    // Valid specific allergies
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        allergies: ['Gluten free', 'Nut free'],
        onboardingStep: 19,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.allergies).toEqual(['Gluten free', 'Nut free']);

    // Valid 'None' alone
    const noneRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        allergies: ['None'],
      });

    expect(noneRes.status).toBe(200);
    expect(noneRes.body.data.allergies).toEqual(['None']);

    // Rejects None + specific allergy combination
    const invalidRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        allergies: ['None', 'Dairy free'],
      });

    expect(invalidRes.status).toBe(400);
  });

  it('SCREEN 20: updates appliances, requires at least one, syncs preferences, keeps onboardingCompleted false', async () => {
    // Valid appliance selection
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        appliances: ['Stovetop', 'Oven', 'Air Fryer', 'Microwave'],
        onboardingStep: 20,
        onboardingCompleted: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.appliances).toEqual(['Stovetop', 'Oven', 'Air Fryer', 'Microwave']);
    expect(res.body.data.onboardingStep).toBe(20);
    expect(res.body.data.onboardingCompleted).toBe(false);

    // Rejects empty appliances
    const emptyRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        appliances: [],
      });

    expect(emptyRes.status).toBe(400);

    // Verify DB direct
    const dbUser = await User.findById(userId);
    expect(dbUser?.mealMoods).toEqual(['Speedy Meals', 'Healthy Comfort', 'Protein Packed']);
    expect(dbUser?.dietaryPreferences).toEqual(['None']);
    expect(dbUser?.allergies).toEqual(['None']);
    expect(dbUser?.appliances).toEqual(['Stovetop', 'Oven', 'Air Fryer', 'Microwave']);
    expect(dbUser?.onboardingCompleted).toBe(false);
  });

  it('SCREEN 22: POST /api/v1/plan/preview generates a valid meal plan preview for onboarding without requiring user account', async () => {
    const previewRes = await request(app)
      .post('/api/v1/plan/preview')
      .send({
        supermarket: 'Aldi',
        householdSize: 2,
        cookingDays: ['Monday', 'Tuesday', 'Wednesday'],
        weeklyBudget: 60,
        dietaryNeeds: ['None'],
        allergies: ['None'],
        vibes: ['Speedy Meals'],
      });

    expect(previewRes.status).toBe(200);
    expect(previewRes.body.success).toBe(true);
    expect(previewRes.body.data).toBeDefined();
    expect(Array.isArray(previewRes.body.data.dinners)).toBe(true);
    expect(previewRes.body.data.dinners.length).toBeGreaterThanOrEqual(1);
    expect(previewRes.body.data.estimatedCost).toBeGreaterThan(0);
    expect(previewRes.body.data.supermarket).toBe('Aldi');
  });

  it('SCREEN 22: POST /api/v1/plan/preview strictly enforces dietary and allergy safety and returns 422 if no compliant recipes exist', async () => {
    // Impossible filter: all major allergens excluded plus extreme cook time
    const res = await request(app)
      .post('/api/v1/plan/preview')
      .send({
        dietaryNeeds: ['Vegan'],
        allergies: ['Gluten', 'Dairy', 'Soy', 'Nuts', 'Eggs', 'Fish', 'Shellfish', 'Sesame', 'Peanuts', 'Tree Nuts'],
        maxCookTimeMinutes: 1, // impossible 1-minute cook time
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NO_RECIPES_FOUND');
  });

  it('SCREEN 24: updates and persists trial reminder preference with strict validation', async () => {
    // 1 day before
    const res1 = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        trialReminderPreference: '1_day_before',
        onboardingStep: 24,
      });

    expect(res1.status).toBe(200);
    expect(res1.body.data.trialReminderPreference).toBe('1_day_before');
    expect(res1.body.data.onboardingStep).toBe(24);

    // 2 days before
    const res2 = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        trialReminderPreference: '2_days_before',
        onboardingStep: 25,
        onboardingCompleted: false,
      });

    expect(res2.status).toBe(200);
    expect(res2.body.data.trialReminderPreference).toBe('2_days_before');
    expect(res2.body.data.onboardingStep).toBe(25);
    expect(res2.body.data.onboardingCompleted).toBe(false);

    // Rejects invalid reminder preference
    const invalidRes = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        trialReminderPreference: '5_days_before',
      });

    expect(invalidRes.status).toBe(400);

    // Verify DB direct
    const dbUser = await User.findById(userId);
    expect(dbUser?.trialReminderPreference).toBe('2_days_before');
    expect(dbUser?.onboardingStep).toBe(25);
    expect(dbUser?.onboardingCompleted).toBe(false);
  });

  it('SCREEN 25: verifies trial eligibility and safeguards against premature billing activation', async () => {
    const statusRes = await request(app)
      .get('/api/v1/subscriptions/status')
      .set('Authorization', `Bearer ${userToken}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.tier).toBe('free');
    expect(statusRes.body.data.amount).toBe(0);

    // Verifies opening screen did NOT alter subscription tier
    const userDoc = await User.findById(userId);
    expect(userDoc?.subscriptionTier).toBe('free');
  });

  it('keeps intermediate onboarding incomplete and does not create a meal plan', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        householdSize: 4,
        onboardingStep: 20,
        onboardingCompleted: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.onboardingCompleted).toBe(false);
    expect(await MealPlan.countDocuments({ user: userId })).toBe(0);
  });

  it("maps the 60+ cooking-time choice to the planner's uncapped setting", async () => {
    const res = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        usualCookingTime: '60+ min',
        onboardingStep: 20,
        onboardingCompleted: false,
      });

    expect(res.status).toBe(200);
    const preference = await Preference.findOne({ user: userId });
    expect(preference?.maxCookTimeMinutes).toBe(0);
    expect(await MealPlan.countDocuments({ user: userId })).toBe(0);
  });

  it('saves final answers but keeps onboarding incomplete if first-plan generation fails', async () => {
    const generation = vi
      .spyOn(PlannerService, 'generateWeeklyPlan')
      .mockRejectedValueOnce(new Error('No matching recipes'));

    try {
      const res = await request(app)
        .patch('/api/v1/auth/onboarding')
        .set('Authorization', `Bearer ${userToken}`)
        .send(completedOnboarding);

      expect(res.status).toBe(503);
      expect(res.body.code).toBe('INITIAL_PLAN_RETRY_REQUIRED');
      expect(res.body.retryable).toBe(true);
      const user = await User.findById(userId);
      const preference = await Preference.findOne({ user: userId });
      expect(user?.onboardingStep).toBe(25);
      expect(user?.onboardingCompleted).toBe(false);
      expect(user?.currencyCode).toBe('GBP');
      expect(user?.weeklyBudgetCurrency).toBe('GBP');
      expect(preference?.currencyCode).toBe('GBP');
      expect(preference?.weeklyBudget).toBe(95);
      expect(preference?.maxCookTimeMinutes).toBe(45);
      expect(preference?.dietaryNeeds).toEqual(['Vegan']);
      expect(preference?.allergies).toEqual(['Peanuts', 'Tree Nuts']);
      const pendingReservation = await MealPlan.findOne({ user: userId }).setOptions({
        includePendingInitialPlan: true,
      });
      expect(pendingReservation?.initialPlanGenerationStatus).toBe('pending');
      expect(await MealPlan.countDocuments({ user: userId })).toBe(1);
    } finally {
      generation.mockRestore();
    }

    const retryGeneration = vi.spyOn(PlannerService, 'generateWeeklyPlan')
      .mockImplementation(async (forUser, savedPreference, options) =>
        persistInitialReservation(forUser, savedPreference, options)
      );
    try {
      const retry = await request(app)
        .patch('/api/v1/auth/onboarding')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ onboardingStep: 25, onboardingCompleted: true });

      expect(retry.status).toBe(200);
      expect(retry.body.data.onboardingCompleted).toBe(true);
      expect((await User.findById(userId))?.onboardingCompleted).toBe(true);
      expect(await MealPlan.countDocuments({ user: userId })).toBe(1);
      await ShoppingList.deleteMany({ user: userId });
      await MealPlan.deleteMany({ user: userId });
      await User.updateOne({ _id: userId }, { $set: { onboardingCompleted: false } });
    } finally {
      retryGeneration.mockRestore();
    }
  });

  it('generates one first plan from saved preferences and marks onboarding complete', async () => {
    let preferencesAtGeneration: Preference | null = null;
    const generation = vi
      .spyOn(PlannerService, 'generateWeeklyPlan')
      .mockImplementation(async (userIdForPlan, preference, options) => {
        preferencesAtGeneration = await Preference.findOne({ user: userIdForPlan });
        await new Promise((resolve) => setTimeout(resolve, 50));
        return persistInitialReservation(userIdForPlan, preference, options);
      });

    try {
      const sendCompletion = () =>
        request(app)
          .patch('/api/v1/auth/onboarding')
          .set('Authorization', `Bearer ${userToken}`)
          .send(completedOnboarding);
      const responses = await Promise.all([sendCompletion(), sendCompletion()]);
      const successfulResponse = responses.find((response) => response.status === 200);

      expect(successfulResponse?.body.data.onboardingCompleted).toBe(true);
      expect(responses.filter((response) => response.status === 409)).toHaveLength(1);
      expect(preferencesAtGeneration?.currencyCode).toBe('GBP');
      expect(preferencesAtGeneration?.weeklyBudget).toBe(95);
      expect(preferencesAtGeneration?.maxCookTimeMinutes).toBe(45);
      expect(preferencesAtGeneration?.dietaryNeeds).toEqual(['Vegan']);
      expect(preferencesAtGeneration?.allergies).toEqual(['Peanuts', 'Tree Nuts']);
      expect(preferencesAtGeneration?.equipment).toEqual(['Hob Only', 'Air Fryer']);
      expect(generation).toHaveBeenCalledTimes(1);
      expect(await MealPlan.countDocuments({ user: userId })).toBe(1);

      const retry = await sendCompletion();
      expect(retry.status).toBe(200);
      expect(retry.body.data.onboardingCompleted).toBe(true);
      expect(generation).toHaveBeenCalledTimes(1);

      const planBeforeLogin = await MealPlan.findOne({ user: userId });
      expect(planBeforeLogin?.initialPlanGenerationStatus).toBe('complete');
      expect(planBeforeLogin?.dinners).toHaveLength(1);
      const login = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'onboarding_test_user@example.com',
          password: 'password123',
        });
      expect(login.status).toBe(200);
      expect(await MealPlan.countDocuments({ user: userId })).toBe(1);
      expect((await MealPlan.findOne({ user: userId }))?._id.toString()).toBe(
        planBeforeLogin?._id.toString()
      );
    } finally {
      generation.mockRestore();
    }
  });

  it('reclaims an expired claim and finalizes using a new unique owner token', async () => {
    const email = 'onboarding_stale_claim@example.com';
    const account = await registerReliabilityUser(email);
    const initial = await request(app)
      .patch('/api/v1/auth/onboarding')
      .set('Authorization', `Bearer ${account.token}`)
      .send({ ...completedOnboarding, onboardingCompleted: false });
    expect(initial.status).toBe(200);

    const reservation = await MealPlan.create({
      user: account.id,
      weekStartDate: new Date(),
      dinners: [],
      meals: [],
      householdSize: 2,
      estimatedCost: 0,
      budgetLimit: 40,
      isInitialOnboardingPlan: true,
      initialPlanGenerationStatus: 'pending',
      initialPlanGenerationToken: 'expired-owner',
      initialPlanGenerationLeaseUntil: new Date(Date.now() - 1_000),
    });

    const generation = vi.spyOn(PlannerService, 'generateWeeklyPlan').mockImplementation(
      async (forUser, preference, options) => {
        expect(options?.initialOnboardingClaimToken).toBeTruthy();
        expect(options?.initialOnboardingClaimToken).not.toBe('expired-owner');
        expect(options?.initialOnboardingReservationId).toBe(reservation._id.toString());
        return persistInitialReservation(forUser, preference, options);
      }
    );

    try {
      const response = await request(app)
        .patch('/api/v1/auth/onboarding')
        .set('Authorization', `Bearer ${account.token}`)
        .send({ onboardingStep: 25, onboardingCompleted: true });

      expect(response.status).toBe(200);
      expect(response.body.data.onboardingCompleted).toBe(true);
      expect(await MealPlan.countDocuments({ user: account.id })).toBe(1);
      const savedPlan = await MealPlan.findOne({ user: account.id });
      expect(savedPlan?.initialPlanGenerationStatus).toBe('complete');
      expect(savedPlan?.initialPlanGenerationToken).toBeUndefined();
      expect(generation).toHaveBeenCalledTimes(1);
    } finally {
      generation.mockRestore();
      await cleanupReliabilityUser(account.id, email);
    }
  });

  it('enforces a database uniqueness fence for initial plans per user', async () => {
    const email = 'onboarding_unique_plan@example.com';
    const account = await registerReliabilityUser(email);
    const plan = {
      user: account.id,
      weekStartDate: new Date(),
      dinners: [],
      meals: [],
      householdSize: 2,
      estimatedCost: 0,
      budgetLimit: 40,
      isInitialOnboardingPlan: true,
    };

    try {
      await MealPlan.init();
      await MealPlan.create(plan);
      await expect(MealPlan.create(plan)).rejects.toMatchObject({ code: 11000 });
    } finally {
      await cleanupReliabilityUser(account.id, email);
    }
  });

  it('does not bypass onboarding through current-plan, regenerate, or preference updates', async () => {
    const email = 'onboarding_no_bypass@example.com';
    const account = await registerReliabilityUser(email);
    const generation = vi.spyOn(PlannerService, 'generateWeeklyPlan');
    try {
      const current = await request(app)
        .get('/api/v1/plan/current')
        .set('Authorization', `Bearer ${account.token}`);
      expect(current.status).toBe(200);
      expect(current.body.data).toBeNull();

      const regenerate = await request(app)
        .post('/api/v1/plan/generate')
        .set('Authorization', `Bearer ${account.token}`);
      expect(regenerate.status).toBe(409);
      expect(regenerate.body.code).toBe('ONBOARDING_COMPLETION_REQUIRED');

      const update = await request(app)
        .put('/api/v1/preferences')
        .set('Authorization', `Bearer ${account.token}`)
        .send({ householdSize: 2, autoRegenerate: true });
      expect(update.status).toBe(200);
      expect(update.body.message).toMatch(/Finish onboarding/);
      expect(generation).not.toHaveBeenCalled();
      expect((await Preference.findOne({ user: account.id }))?.householdSize).toBe(2);
      expect(await MealPlan.countDocuments({ user: account.id })).toBe(0);
    } finally {
      generation.mockRestore();
      await cleanupReliabilityUser(account.id, email);
    }
  });

  it('blocks incomplete users from archiving or regenerating an existing plan', async () => {
    const email = 'onboarding_archive_existing_plan@example.com';
    const account = await registerReliabilityUser(email);
    const plan = await MealPlan.create({
      user: account.id,
      weekStartDate: new Date('2026-11-02T00:00:00.000Z'),
      dinners: [],
      meals: [],
      householdSize: 4,
      estimatedCost: 31,
      budgetLimit: 80,
      isArchived: false,
    });
    const shoppingList = await ShoppingList.create({
      user: account.id,
      plan: plan._id,
      supermarket: 'Tesco',
      items: [{
        id: 'preserve-on-archive-block',
        name: 'Test ingredient',
        totalQuantity: 2,
        unit: 'pcs',
        aisle: 'Fresh Produce',
        estimatedCost: 3,
        isBought: true,
        recipeTitles: ['Test recipe'],
      }],
      totalEstimatedCost: 3,
      itemsBoughtCount: 1,
      totalItemsCount: 1,
    });
    const planBefore = await MealPlan.findById(plan._id).lean();
    const shoppingListBefore = await ShoppingList.findById(shoppingList._id).lean();
    const archive = vi.spyOn(PlannerService, 'archiveCurrentPlan');
    const generate = vi.spyOn(PlannerService, 'generateWeeklyPlan');
    const updateShoppingList = vi.spyOn(ShoppingListService, 'generateOrUpdateShoppingList');

    try {
      const response = await request(app)
        .post('/api/v1/plan/archive')
        .set('Authorization', `Bearer ${account.token}`);

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('ONBOARDING_COMPLETION_REQUIRED');
      expect(archive).not.toHaveBeenCalled();
      expect(generate).not.toHaveBeenCalled();
      expect(updateShoppingList).not.toHaveBeenCalled();
      expect(await MealPlan.findById(plan._id).lean()).toEqual(planBefore);
      expect(await ShoppingList.findById(shoppingList._id).lean()).toEqual(shoppingListBefore);
    } finally {
      archive.mockRestore();
      generate.mockRestore();
      updateShoppingList.mockRestore();
      await cleanupReliabilityUser(account.id, email);
    }
  });

  it('blocks incomplete users from archive even when they have no plan', async () => {
    const email = 'onboarding_archive_no_plan@example.com';
    const account = await registerReliabilityUser(email);
    const archive = vi.spyOn(PlannerService, 'archiveCurrentPlan');
    const generate = vi.spyOn(PlannerService, 'generateWeeklyPlan');

    try {
      const response = await request(app)
        .post('/api/v1/plan/archive')
        .set('Authorization', `Bearer ${account.token}`);

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('ONBOARDING_COMPLETION_REQUIRED');
      expect(archive).not.toHaveBeenCalled();
      expect(generate).not.toHaveBeenCalled();
      expect(await MealPlan.countDocuments({ user: account.id })).toBe(0);
      expect(await ShoppingList.countDocuments({ user: account.id })).toBe(0);
    } finally {
      archive.mockRestore();
      generate.mockRestore();
      await cleanupReliabilityUser(account.id, email);
    }
  });

  it('retains archive and regeneration behavior for completed users', async () => {
    const email = 'onboarding_archive_completed@example.com';
    const account = await registerReliabilityUser(email);
    const plan = await MealPlan.create({
      user: account.id,
      weekStartDate: new Date(),
      dinners: [],
      meals: [],
      householdSize: 2,
      estimatedCost: 0,
      budgetLimit: 40,
      isArchived: false,
    });
    await Preference.create({
      user: account.id,
      householdSize: 2,
      cookingDays: ['Monday'],
      weeklyBudget: 40,
      dietaryNeeds: ['None'],
      allergies: [],
      equipment: ['Hob Only'],
      vibes: ['Speedy Meals'],
    });
    await User.updateOne({ _id: account.id }, { $set: { onboardingCompleted: true } });
    const generation = vi.spyOn(PlannerService, 'generateWeeklyPlan')
      .mockResolvedValue(plan);

    try {
      const response = await request(app)
        .post('/api/v1/plan/archive')
        .set('Authorization', `Bearer ${account.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(generation).toHaveBeenCalledTimes(1);
      expect(generation).toHaveBeenCalledWith(
        account.id,
        expect.objectContaining({ householdSize: 2 })
      );
      expect((await MealPlan.findById(plan._id))?.isArchived).toBe(true);
    } finally {
      generation.mockRestore();
      await cleanupReliabilityUser(account.id, email);
    }
  });

  it('prevents incomplete users from mutating plans or shopping lists through plan-edit routes', async () => {
    const email = 'onboarding_plan_edits_blocked@example.com';
    const account = await registerReliabilityUser(email);
    const recipeId = new mongoose.Types.ObjectId();
    const plan = await MealPlan.create({
      user: account.id,
      weekStartDate: new Date('2026-11-02T00:00:00.000Z'),
      dinners: [{ day: 'Monday', recipe: recipeId, isCooked: false }],
      meals: [
        {
          id: 'blocked-monday-dinner',
          day: 'Monday',
          mealType: 'dinner',
          recipe: recipeId,
          servings: 4,
          isCooked: false,
        },
        {
          id: 'blocked-tuesday-lunch',
          day: 'Tuesday',
          mealType: 'lunch',
          recipe: recipeId,
          servings: 4,
          isCooked: false,
        },
      ],
      householdSize: 4,
      estimatedCost: 31,
      budgetLimit: 80,
    });
    await Preference.create({
      user: account.id,
      householdSize: 4,
      cookingDays: ['Monday', 'Tuesday'],
      weeklyBudget: 80,
      dietaryNeeds: ['None'],
      allergies: [],
      equipment: ['Hob Only'],
      vibes: ['Speedy Meals'],
    });
    await ShoppingList.create({
      user: account.id,
      plan: plan._id,
      supermarket: 'Tesco',
      items: [{
        id: 'blocked-shopping-item',
        name: 'Preserved ingredient',
        totalQuantity: 2,
        unit: 'pcs',
        aisle: 'Fresh Produce',
        estimatedCost: 3,
        isBought: true,
        recipeTitles: ['Preserved recipe'],
      }],
      totalEstimatedCost: 3,
      itemsBoughtCount: 1,
      totalItemsCount: 1,
    });
    const planBefore = await MealPlan.findById(plan._id).lean();
    const shoppingListBefore = await ShoppingList.findOne({ user: account.id }).lean();
    const preferenceBefore = await Preference.findOne({ user: account.id }).lean();
    const swap = vi.spyOn(PlannerService, 'swapMeal');
    const remove = vi.spyOn(PlannerService, 'removeMealSlot');
    const edit = vi.spyOn(PlannerService, 'editMealSlot');
    const updateHouseholdSize = vi.spyOn(PlannerService, 'updateHouseholdSize');
    const updateShoppingList = vi.spyOn(ShoppingListService, 'generateOrUpdateShoppingList');

    try {
      const responses = await Promise.all([
        request(app)
          .put('/api/v1/plan/swap-meal')
          .set('Authorization', `Bearer ${account.token}`)
          .send({ day: 'Monday' }),
        request(app)
          .patch('/api/v1/plan/dinners/Monday/cooked')
          .set('Authorization', `Bearer ${account.token}`),
        request(app)
          .delete('/api/v1/plan/meals/blocked-tuesday-lunch')
          .set('Authorization', `Bearer ${account.token}`),
        request(app)
          .patch('/api/v1/plan/meals/blocked-monday-dinner')
          .set('Authorization', `Bearer ${account.token}`)
          .send({ servings: 7 }),
        request(app)
          .patch('/api/v1/plan/household-size')
          .set('Authorization', `Bearer ${account.token}`)
          .send({ householdSize: 7 }),
      ]);

      for (const response of responses) {
        expect(response.status).toBe(409);
        expect(response.body.code).toBe('ONBOARDING_COMPLETION_REQUIRED');
      }
      expect(swap).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
      expect(edit).not.toHaveBeenCalled();
      expect(updateHouseholdSize).not.toHaveBeenCalled();
      expect(updateShoppingList).not.toHaveBeenCalled();
      expect(await MealPlan.findById(plan._id).lean()).toEqual(planBefore);
      expect(await ShoppingList.findOne({ user: account.id }).lean()).toEqual(shoppingListBefore);
      expect(await Preference.findOne({ user: account.id }).lean()).toEqual(preferenceBefore);
    } finally {
      swap.mockRestore();
      remove.mockRestore();
      edit.mockRestore();
      updateHouseholdSize.mockRestore();
      updateShoppingList.mockRestore();
      await cleanupReliabilityUser(account.id, email);
    }
  });

  it('allows completed users to edit plans and synchronizes the swapped meal shopping list', async () => {
    const email = 'onboarding_plan_edits_completed@example.com';
    const account = await registerReliabilityUser(email);
    const recipeBase = {
      description: 'A plan-edit route test meal',
      image: 'https://example.com/meal.jpg',
      cuisine: 'Italian' as const,
      vibes: ['Speedy Meals'],
      prepTimeMinutes: 5,
      cookTimeMinutes: 15,
      servings: 2,
      calories: 300,
      carbsGrams: 40,
      proteinGrams: 10,
      fatGrams: 8,
      instructions: ['Prepare the test meal'],
      dietaryTags: ['Vegetarian'],
      allergens: [],
      equipmentNeeded: ['Hob Only'],
    };
    const originalRecipe = await Recipe.create({
      ...recipeBase,
      title: 'Plan edit original meal',
      slug: 'plan-edit-original-meal',
      ingredients: [{
        name: 'Original ingredient',
        quantity: 1,
        unit: 'pcs',
        aisle: 'Fresh Produce',
        estimatedCost: 1,
      }],
    });
    const replacementRecipe = await Recipe.create({
      ...recipeBase,
      title: 'Plan edit replacement meal',
      slug: 'plan-edit-replacement-meal',
      ingredients: [{
        name: 'Replacement ingredient',
        quantity: 2,
        unit: 'pcs',
        aisle: 'Fresh Produce',
        estimatedCost: 2,
      }],
    });
    const plan = await MealPlan.create({
      user: account.id,
      weekStartDate: new Date(),
      dinners: [{ day: 'Monday', recipe: originalRecipe._id, isCooked: false }],
      meals: [
        {
          id: 'completed-monday-dinner',
          day: 'Monday',
          mealType: 'dinner',
          recipe: originalRecipe._id,
          servings: 2,
          isCooked: false,
        },
        {
          id: 'completed-tuesday-lunch',
          day: 'Tuesday',
          mealType: 'lunch',
          recipe: originalRecipe._id,
          servings: 2,
          isCooked: false,
        },
      ],
      householdSize: 2,
      estimatedCost: 1,
      budgetLimit: 40,
    });
    await Preference.create({
      user: account.id,
      householdSize: 2,
      cookingDays: ['Monday', 'Tuesday'],
      weeklyBudget: 40,
      dietaryNeeds: ['None'],
      allergies: [],
      equipment: ['Hob Only'],
      vibes: ['Speedy Meals'],
      maxCookTimeMinutes: 60,
    });
    await User.updateOne({ _id: account.id }, { $set: { onboardingCompleted: true } });

    try {
      const swap = await request(app)
        .put('/api/v1/plan/swap-meal')
        .set('Authorization', `Bearer ${account.token}`)
        .send({ day: 'Monday', targetRecipeId: replacementRecipe._id.toString() });
      expect(swap.status).toBe(200);
      expect((await MealPlan.findById(plan._id))?.dinners[0].recipe.toString())
        .toBe(replacementRecipe._id.toString());
      const syncedShoppingList = await ShoppingList.findOne({ user: account.id });
      expect(syncedShoppingList?.items.map((item) => item.name)).toContain('Replacement ingredient');

      const cooked = await request(app)
        .patch('/api/v1/plan/dinners/Monday/cooked')
        .set('Authorization', `Bearer ${account.token}`);
      expect(cooked.status).toBe(200);
      expect((await MealPlan.findById(plan._id))?.dinners[0].isCooked).toBe(true);

      const removed = await request(app)
        .delete('/api/v1/plan/meals/completed-tuesday-lunch')
        .set('Authorization', `Bearer ${account.token}`);
      expect(removed.status).toBe(200);
      expect((await MealPlan.findById(plan._id))?.meals.some(
        (slot) => slot.id === 'completed-tuesday-lunch'
      )).toBe(false);
      expect((await ShoppingList.findOne({ user: account.id }))?.items.map((item) => item.name))
        .not.toContain('Original ingredient');

      const edited = await request(app)
        .patch('/api/v1/plan/meals/completed-monday-dinner')
        .set('Authorization', `Bearer ${account.token}`)
        .send({ servings: 5 });
      expect(edited.status).toBe(200);
      expect((await MealPlan.findById(plan._id))?.meals.find(
        (slot) => slot.id === 'completed-monday-dinner'
      )?.servings).toBe(5);

      const household = await request(app)
        .patch('/api/v1/plan/household-size')
        .set('Authorization', `Bearer ${account.token}`)
        .send({ householdSize: 6 });
      expect(household.status).toBe(200);
      expect((await MealPlan.findById(plan._id))?.householdSize).toBe(6);
      expect((await Preference.findOne({ user: account.id }))?.householdSize).toBe(6);
    } finally {
      await cleanupReliabilityUser(account.id, email);
      await Recipe.deleteMany({ _id: { $in: [originalRecipe._id, replacementRecipe._id] } });
    }
  });

  it('saves incomplete-user preferences without regenerating or changing an ordinary plan', async () => {
    const email = 'preferences_incomplete_ordinary_plan@example.com';
    const account = await registerReliabilityUser(email);
    const existingPlan = await MealPlan.create({
      user: account.id,
      weekStartDate: new Date('2026-11-02T00:00:00.000Z'),
      dinners: [],
      meals: [],
      householdSize: 4,
      estimatedCost: 31,
      budgetLimit: 80,
    });
    const originalPlan = {
      weekStartDate: existingPlan.weekStartDate.toISOString(),
      householdSize: existingPlan.householdSize,
      estimatedCost: existingPlan.estimatedCost,
      budgetLimit: existingPlan.budgetLimit,
      updatedAt: existingPlan.updatedAt.toISOString(),
    };
    const generation = vi.spyOn(PlannerService, 'generateWeeklyPlan');

    try {
      const response = await request(app)
        .put('/api/v1/preferences')
        .set('Authorization', `Bearer ${account.token}`)
        .send({ householdSize: 6, weeklyBudget: 110, autoRegenerate: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/Finish onboarding/);
      expect(generation).not.toHaveBeenCalled();
      expect((await Preference.findOne({ user: account.id }))?.householdSize).toBe(6);

      const savedPlan = await MealPlan.findById(existingPlan._id);
      expect({
        weekStartDate: savedPlan?.weekStartDate.toISOString(),
        householdSize: savedPlan?.householdSize,
        estimatedCost: savedPlan?.estimatedCost,
        budgetLimit: savedPlan?.budgetLimit,
        updatedAt: savedPlan?.updatedAt.toISOString(),
      }).toEqual(originalPlan);
    } finally {
      generation.mockRestore();
      await cleanupReliabilityUser(account.id, email);
    }
  });

  it('saves incomplete-user preferences without regenerating or changing an initial plan reservation', async () => {
    const email = 'preferences_incomplete_initial_plan@example.com';
    const account = await registerReliabilityUser(email);
    const reservation = await MealPlan.create({
      user: account.id,
      weekStartDate: new Date('2026-11-02T00:00:00.000Z'),
      dinners: [],
      meals: [],
      householdSize: 2,
      estimatedCost: 0,
      budgetLimit: 40,
      isInitialOnboardingPlan: true,
      initialPlanGenerationStatus: 'pending',
      initialPlanGenerationToken: 'existing-owner',
      initialPlanGenerationLeaseUntil: new Date(Date.now() + 60_000),
    });
    const generation = vi.spyOn(PlannerService, 'generateWeeklyPlan');

    try {
      const response = await request(app)
        .put('/api/v1/preferences')
        .set('Authorization', `Bearer ${account.token}`)
        .send({ weeklyBudget: 125, autoRegenerate: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/Finish onboarding/);
      expect(generation).not.toHaveBeenCalled();
      expect((await Preference.findOne({ user: account.id }))?.weeklyBudget).toBe(125);

      const savedReservation = await MealPlan.findById(reservation._id).setOptions({
        includePendingInitialPlan: true,
      });
      expect(savedReservation?.initialPlanGenerationStatus).toBe('pending');
      expect(savedReservation?.initialPlanGenerationToken).toBe('existing-owner');
      expect(savedReservation?.householdSize).toBe(2);
      expect(savedReservation?.budgetLimit).toBe(40);
    } finally {
      generation.mockRestore();
      await cleanupReliabilityUser(account.id, email);
    }
  });

  it('keeps auto-regeneration available for completed users with an ordinary plan', async () => {
    const email = 'preferences_completed_ordinary_plan@example.com';
    const account = await registerReliabilityUser(email);
    const existingPlan = await MealPlan.create({
      user: account.id,
      weekStartDate: new Date(),
      dinners: [],
      meals: [],
      householdSize: 2,
      estimatedCost: 0,
      budgetLimit: 40,
    });
    await User.updateOne({ _id: account.id }, { $set: { onboardingCompleted: true } });
    const generation = vi.spyOn(PlannerService, 'generateWeeklyPlan')
      .mockResolvedValue(existingPlan);

    try {
      const response = await request(app)
        .put('/api/v1/preferences')
        .set('Authorization', `Bearer ${account.token}`)
        .send({ householdSize: 3, autoRegenerate: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Preferences updated successfully');
      expect(generation).toHaveBeenCalledTimes(1);
      expect(generation).toHaveBeenCalledWith(
        account.id,
        expect.objectContaining({ householdSize: 3 })
      );
    } finally {
      generation.mockRestore();
      await cleanupReliabilityUser(account.id, email);
    }
  });

  it('does not let a late expired generator persist a plan or disturb the new claim owner', async () => {
    const email = 'onboarding_late_claim@example.com';
    const account = await registerReliabilityUser(email);
    const preference = await Preference.create({
      user: account.id,
      cookingDays: ['Monday'],
      householdSize: 2,
      weeklyBudget: 40,
      dietaryNeeds: ['Vegan'],
      allergies: [],
      equipment: ['Hob Only'],
      vibes: ['Speedy Meals'],
      maxCookTimeMinutes: 45,
    });
    const reservation = await MealPlan.create({
      user: account.id,
      weekStartDate: new Date(),
      dinners: [],
      meals: [],
      householdSize: 2,
      estimatedCost: 0,
      budgetLimit: 40,
      isInitialOnboardingPlan: true,
      initialPlanGenerationStatus: 'pending',
      initialPlanGenerationToken: 'old-owner',
      initialPlanGenerationLeaseUntil: new Date(Date.now() + 20),
    });

    let beginRecipeLookup!: () => void;
    let finishRecipeLookup!: (recipes: any[]) => void;
    const recipeLookupStarted = new Promise<void>((resolve) => {
      beginRecipeLookup = resolve;
    });
    const recipeLookup = new Promise<any[]>((resolve) => {
      finishRecipeLookup = resolve;
    });
    const recipeId = new mongoose.Types.ObjectId();
    const recipes = vi.spyOn(Recipe, 'find').mockImplementation((() => {
      beginRecipeLookup();
      return recipeLookup;
    }) as any);

    try {
      const lateGeneration = PlannerService.generateWeeklyPlan(
        account.id,
        preference,
        {
          initialOnboardingClaimToken: 'old-owner',
          initialOnboardingReservationId: reservation._id.toString(),
        }
      );
      await recipeLookupStarted;
      await new Promise((resolve) => setTimeout(resolve, 30));
      const newOwnerClaim = await MealPlan.findOneAndUpdate(
        {
          _id: reservation._id,
          initialPlanGenerationStatus: 'pending',
          initialPlanGenerationLeaseUntil: { $lte: new Date() },
        },
        {
          $set: {
            initialPlanGenerationToken: 'new-owner',
            initialPlanGenerationLeaseUntil: new Date(Date.now() + 60_000),
          },
        },
        { new: true }
      ).setOptions({ includePendingInitialPlan: true });
      expect(newOwnerClaim?.initialPlanGenerationToken).toBe('new-owner');
      finishRecipeLookup([{
        _id: recipeId,
        title: 'Safe vegan meal',
        cookTimeMinutes: 20,
        allergens: [],
        dietaryTags: ['Vegan'],
        ingredients: [],
        vibes: ['Speedy Meals'],
      }]);

      await expect(lateGeneration).rejects.toThrow('request expired');
      const afterLateResponse = await MealPlan.findOne({
        _id: reservation._id,
      }).setOptions({ includePendingInitialPlan: true });
      expect(afterLateResponse?.initialPlanGenerationStatus).toBe('pending');
      expect(afterLateResponse?.initialPlanGenerationToken).toBe('new-owner');

      const newOwnerPlan = await PlannerService.generateWeeklyPlan(account.id, preference, {
        initialOnboardingClaimToken: 'new-owner',
        initialOnboardingReservationId: reservation._id.toString(),
      });
      expect(newOwnerPlan.initialPlanGenerationStatus).toBe('ready');
      expect(newOwnerPlan.initialPlanGenerationToken).toBe('new-owner');
      expect(await MealPlan.countDocuments({ user: account.id })).toBe(1);
    } finally {
      recipes.mockRestore();
      await cleanupReliabilityUser(account.id, email);
    }
  });

  it('allows immediate retry after an initial plan database save failure', async () => {
    const email = 'onboarding_plan_save_retry@example.com';
    const account = await registerReliabilityUser(email);
    const preference = await Preference.create({
      user: account.id,
      cookingDays: ['Monday'],
      householdSize: 2,
      weeklyBudget: 40,
      dietaryNeeds: ['Vegan'],
      allergies: [],
      equipment: ['Hob Only'],
      vibes: ['Speedy Meals'],
      maxCookTimeMinutes: 45,
    });
    const reservation = await MealPlan.create({
      user: account.id,
      weekStartDate: new Date(),
      dinners: [],
      meals: [],
      householdSize: 2,
      estimatedCost: 0,
      budgetLimit: 40,
      isInitialOnboardingPlan: true,
      initialPlanGenerationStatus: 'pending',
      initialPlanGenerationToken: 'retry-owner',
      initialPlanGenerationLeaseUntil: new Date(Date.now() + 60_000),
    });

    const recipeId = new mongoose.Types.ObjectId();
    const recipes = vi.spyOn(Recipe, 'find').mockResolvedValue([{
      _id: recipeId,
      title: 'Safe vegan meal',
      cookTimeMinutes: 20,
      allergens: [],
      dietaryTags: ['Vegan'],
      ingredients: [],
      vibes: ['Speedy Meals'],
    }] as any);
    const persist = vi.spyOn(MealPlan, 'findOneAndUpdate').mockImplementationOnce(() => {
      throw new Error('simulated plan save failure');
    });

    try {
      await expect(
        PlannerService.generateWeeklyPlan(
          account.id,
          preference,
          {
            initialOnboardingClaimToken: 'retry-owner',
            initialOnboardingReservationId: reservation._id.toString(),
          }
        )
      ).rejects.toThrow('simulated plan save failure');

      const retryPlan = await PlannerService.generateWeeklyPlan(
        account.id,
        preference,
        {
          initialOnboardingClaimToken: 'retry-owner',
          initialOnboardingReservationId: reservation._id.toString(),
        }
      );
      expect(retryPlan.isInitialOnboardingPlan).toBe(true);
      expect(retryPlan.initialPlanGenerationStatus).toBe('ready');
      expect(await MealPlan.countDocuments({ user: account.id })).toBe(1);
    } finally {
      recipes.mockRestore();
      persist.mockRestore();
      await cleanupReliabilityUser(account.id, email);
    }
  });
});
