import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Preference } from '../models/Preference.js';
import { MealPlan, IMealPlanDoc } from '../models/MealPlan.js';
import { AuthRequest } from '../middleware/auth.js';
import { PlannerService } from '../services/plannerService.js';
import { ShoppingListService } from '../services/shoppingListService.js';
import { EmailService } from '../services/emailService.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateOnboardingSchema = z.object({
  preferredLanguage: z.enum(['en', 'de', 'sv', 'nl', 'pt', 'es', 'fr']).optional(),
  name: z.string().trim().min(1, 'Name cannot be empty').max(50, 'Name cannot exceed 50 characters').optional(),
  ageRange: z.enum(['24 and under', '25-34', '35-44', '45-54', '55+']).optional(),
  primaryGoal: z.enum([
    'Meal prep for the week',
    'Find super simple recipes',
    'Feed myself',
    'Feed my family',
  ]).optional(),
  cookingBarrier: z.enum([
    'Lack of time',
    'Too tired after work',
    'I find cooking difficult',
    'I struggle for inspiration',
  ]).optional(),
  shoppingSavingsConfidence: z.enum([
    'Definitely',
    'Most likely',
    'Somewhat',
    'Not really',
  ]).optional(),
  usualCookingTime: z.enum([
    '15–30 min',
    '30–45 min',
    '45–60 min',
    '60+ min',
    '15-30 min',
    '30-45 min',
    '45-60 min',
  ]).optional(),
  referralSource: z.enum([
    'Instagram',
    'TikTok',
    'YouTube',
    'Facebook',
    'Word of mouth',
    'Google Play',
  ]).optional(),
  countryCode: z.string().min(2).max(10).optional(),
  countryName: z.string().min(1).max(100).optional(),
  currencyCode: z.enum(['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD', 'BRL', 'INR']).optional(),
  householdSize: z.number().int().min(1).max(20).optional(),
  cookingDays: z.array(z.enum([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ])).min(1).max(7).optional(),
  weeklyBudget: z.number().min(0).max(100000).optional(),
  weeklyBudgetCurrency: z.enum(['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD', 'BRL', 'INR']).optional(),
  mealMoods: z.array(z.string()).max(3, 'Cannot select more than 3 moods').optional(),
  dietaryPreferences: z
    .array(z.string().max(50))
    .max(15)
    .refine((arr) => {
      if (!arr || arr.length <= 1) return true;
      return !arr.includes('None');
    }, { message: '"None" cannot be combined with dietary preferences' })
    .optional(),
  allergies: z
    .array(z.string().max(50))
    .max(25)
    .refine((arr) => {
      if (!arr || arr.length <= 1) return true;
      return !arr.includes('None');
    }, { message: '"None" cannot be combined with specific allergies' })
    .optional(),
  appliances: z.array(z.string().max(50)).min(1, 'Select at least one appliance to plan with').max(15).optional(),
  trialReminderPreference: z.enum(['1_day_before', '2_days_before']).optional(),
  onboardingStep: z.number().int().min(1).max(25).optional(),
  onboardingCompleted: z.boolean().optional(),
});

const COOKING_TIME_MAX_MINUTES: Record<string, number> = {
  '15–30 min': 30,
  '15-30 min': 30,
  '30–45 min': 45,
  '30-45 min': 45,
  '45–60 min': 60,
  '45-60 min': 60,
  '60+ min': 0,
};

const ONBOARDING_PLAN_LEASE_MS = 90_000;
const ONBOARDING_PLAN_HEARTBEAT_MS = 20_000;

const claimIsAvailable = (now: Date) => ({
  $or: [
    { initialPlanGenerationToken: { $exists: false } },
    { initialPlanGenerationToken: null },
    { initialPlanGenerationLeaseUntil: { $exists: false } },
    { initialPlanGenerationLeaseUntil: null },
    { initialPlanGenerationLeaseUntil: { $lte: now } },
  ],
});

const acquireInitialPlanClaim = async (
  userId: string,
  token: string,
  now: Date
): Promise<{ plan: IMealPlanDoc; shouldGenerate: boolean } | null> => {
  const readyPlan = await MealPlan.findOne({
    user: userId,
    isInitialOnboardingPlan: true,
    initialPlanGenerationStatus: 'ready',
  });

  if (readyPlan) {
    const claimedPlan = await MealPlan.findOneAndUpdate(
      {
        _id: readyPlan._id,
        initialPlanGenerationStatus: 'ready',
        ...claimIsAvailable(now),
      },
      {
        $set: {
          initialPlanGenerationToken: token,
          initialPlanGenerationLeaseUntil: new Date(now.getTime() + ONBOARDING_PLAN_LEASE_MS),
        },
      },
      { new: true }
    );
    return claimedPlan ? { plan: claimedPlan, shouldGenerate: false } : null;
  }

  const reclaimedReservation = await MealPlan.findOneAndUpdate(
    {
      user: userId,
      isInitialOnboardingPlan: true,
      initialPlanGenerationStatus: 'pending',
      ...claimIsAvailable(now),
    },
    {
      $set: {
        initialPlanGenerationToken: token,
        initialPlanGenerationLeaseUntil: new Date(now.getTime() + ONBOARDING_PLAN_LEASE_MS),
      },
    },
    { new: true }
  ).setOptions({ includePendingInitialPlan: true });

  if (reclaimedReservation) {
    return { plan: reclaimedReservation, shouldGenerate: true };
  }

  const existingPlan = await MealPlan.findOne({ user: userId });
  if (existingPlan) {
    if (
      existingPlan.isInitialOnboardingPlan &&
      existingPlan.initialPlanGenerationStatus === 'complete'
    ) {
      return { plan: existingPlan, shouldGenerate: false };
    }
    return null;
  }

  const pendingReservation = await MealPlan.findOne({
    user: userId,
    isInitialOnboardingPlan: true,
    initialPlanGenerationStatus: 'pending',
  }).setOptions({ includePendingInitialPlan: true });
  if (pendingReservation) return null;

  const reservation = new MealPlan({
    user: userId,
    weekStartDate: now,
    dinners: [],
    meals: [],
    householdSize: 2,
    estimatedCost: 0,
    budgetLimit: 40,
    isArchived: false,
    isInitialOnboardingPlan: true,
    initialPlanGenerationStatus: 'pending',
    initialPlanGenerationToken: token,
    initialPlanGenerationLeaseUntil: new Date(now.getTime() + ONBOARDING_PLAN_LEASE_MS),
  });

  try {
    await reservation.save();
    return { plan: reservation, shouldGenerate: true };
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;

    const racedPlan = await MealPlan.findOne({ user: userId });
    if (
      racedPlan &&
      racedPlan.isInitialOnboardingPlan &&
      racedPlan.initialPlanGenerationStatus === 'complete'
    ) {
      return { plan: racedPlan, shouldGenerate: false };
    }
    return null;
  }
};

const markOnboardingComplete = async (
  userId: string,
  countInitialPlan: boolean
) => {
  const now = new Date();
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, onboardingCompleted: { $ne: true } },
    {
      $set: {
        onboardingCompleted: true,
        ...(countInitialPlan ? { lastPlanGenerationAt: now } : {}),
      },
      ...(countInitialPlan ? { $inc: { planGenerationsThisWeek: 1 } } : {}),
    },
    { new: true }
  );
  const savedUser = updatedUser || await User.findById(userId);
  if (!savedUser) throw new Error('Could not reload your completed onboarding state.');
  return savedUser;
};

const hasRequiredOnboardingAnswers = (user: {
  onboardingStep?: number;
  usualCookingTime?: string;
  countryCode?: string;
  countryName?: string;
  currencyCode?: string;
  weeklyBudgetCurrency?: string;
  householdSize?: number;
  cookingDays?: string[];
  weeklyBudget?: number;
  mealMoods?: string[];
  dietaryPreferences?: string[];
  allergies?: string[];
  appliances?: string[];
}): boolean =>
  user.onboardingStep === 25 &&
  Boolean(
    user.usualCookingTime &&
    user.countryCode &&
    user.countryName &&
    (user.currencyCode || user.weeklyBudgetCurrency) &&
    user.householdSize &&
    user.cookingDays?.length &&
    user.weeklyBudget !== undefined &&
    user.weeklyBudget !== null &&
    user.mealMoods?.length &&
    user.dietaryPreferences?.length &&
    user.allergies?.length &&
    user.appliances?.length
  );

const generateTokenAndSetCookie = (res: Response, user: any) => {
  const secret = process.env.JWT_SECRET || 'mise_meal_planner_jwt_secret_dev_key_2026';
  const token = jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role || 'user',
      subscriptionTier: user.subscriptionTier,
    },
    secret,
    { expiresIn: '30d' }
  );

  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('mise_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, error: 'Email already registered' });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      subscriptionTier: 'free',
      subscriptionStatus: 'trial',
    });

    const token = generateTokenAndSetCookie(res, user);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        preferredLanguage: user.preferredLanguage,
        ageRange: user.ageRange,
        primaryGoal: user.primaryGoal,
        cookingBarrier: user.cookingBarrier,
        shoppingSavingsConfidence: user.shoppingSavingsConfidence,
        usualCookingTime: user.usualCookingTime,
        referralSource: user.referralSource,
        countryCode: user.countryCode,
        countryName: user.countryName,
        currencyCode: user.currencyCode,
        householdSize: user.householdSize,
        cookingDays: user.cookingDays,
        weeklyBudget: user.weeklyBudget,
        weeklyBudgetCurrency: user.weeklyBudgetCurrency,
        mealMoods: user.mealMoods || [],
        dietaryPreferences: user.dietaryPreferences || [],
        allergies: user.allergies || [],
        appliances: user.appliances || [],
        trialReminderPreference: user.trialReminderPreference || '1_day_before',
        onboardingStep: user.onboardingStep,
        onboardingCompleted: user.onboardingCompleted,
        token,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = generateTokenAndSetCookie(res, user);

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        preferredLanguage: user.preferredLanguage,
        ageRange: user.ageRange,
        primaryGoal: user.primaryGoal,
        cookingBarrier: user.cookingBarrier,
        shoppingSavingsConfidence: user.shoppingSavingsConfidence,
        usualCookingTime: user.usualCookingTime,
        referralSource: user.referralSource,
        countryCode: user.countryCode,
        countryName: user.countryName,
        currencyCode: user.currencyCode,
        householdSize: user.householdSize,
        cookingDays: user.cookingDays,
        weeklyBudget: user.weeklyBudget,
        weeklyBudgetCurrency: user.weeklyBudgetCurrency,
        mealMoods: user.mealMoods || [],
        dietaryPreferences: user.dietaryPreferences || [],
        allergies: user.allergies || [],
        appliances: user.appliances || [],
        trialReminderPreference: user.trialReminderPreference || '1_day_before',
        onboardingStep: user.onboardingStep,
        onboardingCompleted: user.onboardingCompleted,
        favorites: user.favorites,
        token,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const {
      preferredLanguage,
      name,
      ageRange,
      primaryGoal,
      cookingBarrier,
      shoppingSavingsConfidence,
      usualCookingTime,
      referralSource,
      countryCode,
      countryName,
      currencyCode,
      householdSize,
      cookingDays,
      weeklyBudget,
      weeklyBudgetCurrency,
      mealMoods,
      dietaryPreferences,
      allergies,
      appliances,
      trialReminderPreference,
      onboardingStep,
      onboardingCompleted,
    } = req.body;

    if (preferredLanguage !== undefined && preferredLanguage !== null && preferredLanguage !== '') {
      user.preferredLanguage = preferredLanguage;
    }
    if (name !== undefined && name !== null && name.trim() !== '') {
      user.name = name.trim();
    }
    if (ageRange !== undefined && ageRange !== null && ageRange !== '') {
      user.ageRange = ageRange;
    }
    if (primaryGoal !== undefined && primaryGoal !== null && primaryGoal !== '') {
      user.primaryGoal = primaryGoal;
    }
    if (cookingBarrier !== undefined && cookingBarrier !== null && cookingBarrier !== '') {
      user.cookingBarrier = cookingBarrier;
    }
    if (shoppingSavingsConfidence !== undefined && shoppingSavingsConfidence !== null && shoppingSavingsConfidence !== '') {
      user.shoppingSavingsConfidence = shoppingSavingsConfidence;
    }
    if (usualCookingTime !== undefined && usualCookingTime !== null && usualCookingTime !== '') {
      user.usualCookingTime = usualCookingTime;
    }
    if (referralSource !== undefined && referralSource !== null && referralSource !== '') {
      user.referralSource = referralSource;
    }
    if (countryCode !== undefined && countryCode !== null && countryCode !== '') {
      user.countryCode = countryCode;
    }
    if (countryName !== undefined && countryName !== null && countryName !== '') {
      user.countryName = countryName;
    }
    if (currencyCode !== undefined && currencyCode !== null && currencyCode !== '') {
      user.currencyCode = currencyCode;
    }
    if (householdSize !== undefined && typeof householdSize === 'number' && householdSize >= 1 && householdSize <= 20) {
      user.householdSize = householdSize;
    }
    if (cookingDays !== undefined && Array.isArray(cookingDays) && cookingDays.length > 0) {
      const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const uniqueDays = Array.from(new Set(cookingDays));
      uniqueDays.sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
      user.cookingDays = uniqueDays;
    }
    if (weeklyBudget !== undefined && typeof weeklyBudget === 'number' && weeklyBudget >= 0) {
      user.weeklyBudget = weeklyBudget;
    }
    if (weeklyBudgetCurrency !== undefined && weeklyBudgetCurrency !== null && weeklyBudgetCurrency !== '') {
      user.weeklyBudgetCurrency = weeklyBudgetCurrency;
    }
    if (mealMoods !== undefined && Array.isArray(mealMoods)) {
      user.mealMoods = mealMoods.slice(0, 3);
    }
    if (dietaryPreferences !== undefined && Array.isArray(dietaryPreferences)) {
      if (dietaryPreferences.includes('None')) {
        user.dietaryPreferences = ['None'];
      } else {
        user.dietaryPreferences = dietaryPreferences;
      }
    }
    if (allergies !== undefined && Array.isArray(allergies)) {
      if (allergies.includes('None')) {
        user.allergies = ['None'];
      } else {
        user.allergies = allergies;
      }
    }
    if (appliances !== undefined && Array.isArray(appliances) && appliances.length > 0) {
      user.appliances = appliances;
    }
    if (trialReminderPreference !== undefined && ['1_day_before', '2_days_before'].includes(trialReminderPreference)) {
      user.trialReminderPreference = trialReminderPreference;
    }
    if (onboardingStep !== undefined && typeof onboardingStep === 'number') {
      user.onboardingStep = onboardingStep;
    }
    if (onboardingCompleted === true && !hasRequiredOnboardingAnswers(user)) {
      res.status(400).json({
        success: false,
        error: 'Complete all required onboarding questions before finishing setup.',
      });
      return;
    }

    await user.save();

    const syncSavedOnboarding = onboardingCompleted === true;
    const prefUpdates: Record<string, unknown> = {};
    if ((householdSize !== undefined || syncSavedOnboarding) && user.householdSize) {
      prefUpdates.householdSize = user.householdSize;
    }
    if ((cookingDays !== undefined || syncSavedOnboarding) && user.cookingDays?.length) {
      prefUpdates.cookingDays = user.cookingDays;
    }
    if ((weeklyBudget !== undefined || syncSavedOnboarding) && user.weeklyBudget !== undefined && user.weeklyBudget !== null) {
      prefUpdates.weeklyBudget = user.weeklyBudget;
    }
    if ((mealMoods !== undefined || syncSavedOnboarding) && user.mealMoods?.length) {
      prefUpdates.vibes = user.mealMoods;
    }
    if ((dietaryPreferences !== undefined || syncSavedOnboarding) && user.dietaryPreferences?.length) {
      prefUpdates.dietaryNeeds = user.dietaryPreferences;
    }
    if ((allergies !== undefined || syncSavedOnboarding) && user.allergies?.length) {
      if (user.allergies.includes('None')) {
        prefUpdates.allergies = [];
      } else {
        const ALLERGEN_MAP: Record<string, string[]> = {
          'Gluten free': ['Gluten'],
          'Dairy free': ['Dairy'],
          'Nut free': ['Peanuts', 'Tree Nuts'],
          'Egg free': ['Eggs'],
          'Shellfish free': ['Shellfish'],
          'Sesame free': ['Sesame'],
          'Soy free': ['Soy'],
        };
        const mappedAllergies = new Set<string>();
        for (const allergy of user.allergies) {
          if (ALLERGEN_MAP[allergy]) {
            ALLERGEN_MAP[allergy].forEach((item) => mappedAllergies.add(item));
          } else {
            mappedAllergies.add(allergy);
          }
        }
        prefUpdates.allergies = Array.from(mappedAllergies);
      }
    }
    if ((appliances !== undefined || syncSavedOnboarding) && user.appliances?.length) {
      const APPLIANCE_MAP: Record<string, string[]> = {
        Stovetop: ['Hob Only'],
        Hob: ['Hob Only'],
        Oven: ['Oven'],
        'Air Fryer': ['Air Fryer'],
        Microwave: ['Microwave'],
      };
      const mappedEquipment = new Set<string>();
      for (const appliance of user.appliances) {
        if (APPLIANCE_MAP[appliance]) {
          APPLIANCE_MAP[appliance].forEach((item) => mappedEquipment.add(item));
        } else {
          mappedEquipment.add(appliance);
        }
      }
      prefUpdates.equipment = Array.from(mappedEquipment);
    }
    if ((usualCookingTime !== undefined || syncSavedOnboarding) && user.usualCookingTime) {
      const maxCookTimeMinutes = COOKING_TIME_MAX_MINUTES[user.usualCookingTime];
      if (maxCookTimeMinutes !== undefined) {
        prefUpdates.maxCookTimeMinutes = maxCookTimeMinutes;
      }
    }
    if ((countryCode !== undefined || syncSavedOnboarding) && user.countryCode) {
      prefUpdates.countryCode = user.countryCode;
    }
    if ((countryName !== undefined || syncSavedOnboarding) && user.countryName) {
      prefUpdates.countryName = user.countryName;
    }
    if (currencyCode !== undefined || weeklyBudgetCurrency !== undefined || syncSavedOnboarding) {
      const selectedCurrency =
        user.weeklyBudgetCurrency || user.currencyCode;
      if (selectedCurrency) prefUpdates.currencyCode = selectedCurrency;
    }
    if (Object.keys(prefUpdates).length > 0) {
      await Preference.findOneAndUpdate(
        { user: user._id },
        { $set: prefUpdates },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
    }

    let responseUser = user;
    if (onboardingCompleted === true) {
      let plan = await MealPlan.findOne({ user: user._id });
      if (plan && !plan.isInitialOnboardingPlan) {
        res.status(409).json({
          success: false,
          error: 'An existing meal plan was preserved. Onboarding cannot safely replace it with a first plan.',
          code: 'INITIAL_PLAN_CONFLICT',
          retryable: false,
        });
        return;
      }

      if (
        plan &&
        (plan.initialPlanGenerationStatus === 'complete' || !plan.initialPlanGenerationStatus) &&
        plan.dinners?.length
      ) {
        if (plan.isInitialOnboardingPlan) {
          await ShoppingListService.generateOrUpdateShoppingList(
            user._id.toString(),
            plan._id.toString()
          );
        }
        responseUser = await markOnboardingComplete(
          user._id.toString(),
          true
        );
      } else {
        const claimToken = crypto.randomBytes(24).toString('hex');
        const claim = await acquireInitialPlanClaim(
          user._id.toString(),
          claimToken,
          new Date()
        );

        if (!claim) {
          const existingPlan = await MealPlan.findOne({ user: user._id });
          if (existingPlan && !existingPlan.isInitialOnboardingPlan) {
            res.status(409).json({
              success: false,
              error: 'An existing meal plan was preserved. Onboarding cannot safely replace it with a first plan.',
              code: 'INITIAL_PLAN_CONFLICT',
              retryable: false,
            });
            return;
          }
          res.status(409).json({
            success: false,
            error: 'Your first meal plan is still being prepared. Please try again shortly.',
            code: 'INITIAL_PLAN_IN_PROGRESS',
          });
          return;
        }

        if (claim.plan.initialPlanGenerationStatus === 'complete') {
          if (!claim.plan.dinners?.length) {
            res.status(503).json({
              success: false,
              error: 'Your saved answers are safe, but the first meal plan is incomplete. Please retry.',
              code: 'INITIAL_PLAN_RETRY_REQUIRED',
              retryable: true,
            });
            return;
          }
          responseUser = await markOnboardingComplete(user._id.toString(), true);
        } else {
          let heartbeatBusy = false;
          const heartbeat = setInterval(async () => {
            if (heartbeatBusy) return;
            heartbeatBusy = true;
            try {
              const now = new Date();
              const result = await MealPlan.updateOne(
                {
                  _id: claim.plan._id,
                  initialPlanGenerationToken: claimToken,
                  initialPlanGenerationLeaseUntil: { $gt: now },
                  initialPlanGenerationStatus: { $in: ['pending', 'ready'] },
                },
                {
                  $set: {
                    initialPlanGenerationLeaseUntil: new Date(
                      now.getTime() + ONBOARDING_PLAN_LEASE_MS
                    ),
                  },
                }
              );
              if (result.matchedCount === 0) {
                console.warn('[Onboarding] Initial-plan claim was reclaimed.');
              }
            } catch (error) {
              console.error('[Onboarding] Failed to renew initial-plan claim:', error);
            } finally {
              heartbeatBusy = false;
            }
          }, ONBOARDING_PLAN_HEARTBEAT_MS);

          try {
            let generatedPlan: IMealPlanDoc = claim.plan;
            if (claim.shouldGenerate) {
              const preference = await Preference.findOne({ user: user._id });
              if (!preference) throw new Error('Your saved meal preferences could not be loaded.');
              generatedPlan = await PlannerService.generateWeeklyPlan(
                user._id.toString(),
                preference,
                {
                  initialOnboardingClaimToken: claimToken,
                  initialOnboardingReservationId: claim.plan._id.toString(),
                }
              );
            }
            if (!generatedPlan.dinners?.length) {
              throw new Error('No meals were generated. Please retry your first meal plan.');
            }
            await ShoppingListService.generateOrUpdateShoppingList(
              user._id.toString(),
              generatedPlan._id.toString()
            );

            const finalizedPlan = await MealPlan.findOneAndUpdate(
              {
                _id: claim.plan._id,
                isInitialOnboardingPlan: true,
                initialPlanGenerationStatus: 'ready',
                initialPlanGenerationToken: claimToken,
                initialPlanGenerationLeaseUntil: { $gt: new Date() },
              },
              {
                $set: { initialPlanGenerationStatus: 'complete' },
                $unset: {
                  initialPlanGenerationToken: 1,
                  initialPlanGenerationLeaseUntil: 1,
                },
              },
              { new: true }
            );
            if (!finalizedPlan) {
              res.status(409).json({
                success: false,
                error: 'Your first meal plan request expired. Please retry.',
                code: 'INITIAL_PLAN_RETRY_REQUIRED',
              });
              return;
            }

            responseUser = await markOnboardingComplete(user._id.toString(), true);
          } catch (error) {
            console.error('[Onboarding] Initial meal plan generation/finalization failed:', error);
            res.status(503).json({
              success: false,
              error: 'Your onboarding answers are saved, but your first meal plan could not be prepared. Please retry.',
              code: 'INITIAL_PLAN_RETRY_REQUIRED',
              retryable: true,
            });
            return;
          } finally {
            clearInterval(heartbeat);
            try {
              await MealPlan.updateOne(
                {
                  _id: claim.plan._id,
                  initialPlanGenerationToken: claimToken,
                  initialPlanGenerationStatus: { $in: ['pending', 'ready'] },
                },
                { $set: { initialPlanGenerationLeaseUntil: new Date(0) } }
              );
            } catch (releaseError) {
              console.error('[Onboarding] Failed to release initial-plan claim:', releaseError);
            }
          }
        }
      }

      if (!responseUser.onboardingCompleted) {
        responseUser = await User.findById(user._id) || user;
      }
    }

    res.json({
      success: true,
      data: {
        id: responseUser._id,
        name: responseUser.name,
        email: responseUser.email,
        role: responseUser.role,
        subscriptionTier: responseUser.subscriptionTier,
        subscriptionStatus: responseUser.subscriptionStatus,
        preferredLanguage: responseUser.preferredLanguage,
        ageRange: responseUser.ageRange,
        primaryGoal: responseUser.primaryGoal,
        cookingBarrier: responseUser.cookingBarrier,
        shoppingSavingsConfidence: responseUser.shoppingSavingsConfidence,
        usualCookingTime: responseUser.usualCookingTime,
        referralSource: responseUser.referralSource,
        countryCode: responseUser.countryCode,
        countryName: responseUser.countryName,
        currencyCode: responseUser.currencyCode,
        householdSize: responseUser.householdSize,
        cookingDays: responseUser.cookingDays,
        weeklyBudget: responseUser.weeklyBudget,
        weeklyBudgetCurrency: responseUser.weeklyBudgetCurrency,
        mealMoods: responseUser.mealMoods || [],
        dietaryPreferences: responseUser.dietaryPreferences || [],
        allergies: responseUser.allergies || [],
        appliances: responseUser.appliances || [],
        trialReminderPreference: responseUser.trialReminderPreference || '1_day_before',
        onboardingStep: responseUser.onboardingStep,
        onboardingCompleted: responseUser.onboardingCompleted,
        favorites: responseUser.favorites,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const logout = (_req: Request, res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('mise_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Fail closed in production if transactional email service is unconfigured
    if (isProduction && !EmailService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Password reset service is temporarily unavailable. Please contact support.',
      });
      return;
    }

    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Generic safe message to prevent email account enumeration
    const genericSuccessMessage = 'If an account exists with that email address, password reset instructions have been generated.';

    // 2. Safe generic response for non-existent users
    if (!user) {
      res.json({
        success: true,
        message: genericSuccessMessage,
      });
      return;
    }

    // 3. Cryptographic token generation: raw token in email, SHA-256 hash in database
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // 4. Construct validated reset link from configured server environment
    const resetLink = EmailService.buildResetLink(rawToken);

    // 5. Dispatch email via Resend
    try {
      await EmailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetLink,
      });
    } catch (emailErr: any) {
      // Clear token so an undelivered ghost token is not left in the DB
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Log delivery error internally without leaking tokens
      console.error('[EmailService] Failed to dispatch password recovery email:', emailErr?.message || emailErr);

      // Return the uniform generic response to avoid leaking account existence via provider failure
      res.json({
        success: true,
        message: genericSuccessMessage,
      });
      return;
    }

    // 6. Generic response: NEVER expose reset token in production
    res.json({
      success: true,
      message: genericSuccessMessage,
      ...(!isProduction ? { resetToken: rawToken } : {}),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const cleanToken = token ? token.trim() : '';

    if (!cleanToken) {
      res.status(400).json({
        success: false,
        error: 'Password reset token is invalid or has expired.',
      });
      return;
    }

    // Compare SHA-256 hash of incoming raw token against stored hash
    const hashedToken = crypto.createHash('sha256').update(cleanToken).digest('hex');

    const user = await User.findOne({
      $or: [
        { resetPasswordToken: hashedToken },
        { resetPasswordToken: cleanToken } // Fallback for raw tokens in test fixtures
      ],
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Password reset token is invalid or has expired.',
      });
      return;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
