import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { Recipe } from '../models/Recipe.js';
import { MealPlan } from '../models/MealPlan.js';
import { PantryItem } from '../models/PantryItem.js';
import { Household } from '../models/Household.js';
import { BillingInvoice } from '../models/BillingInvoice.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';

export const updateUserTierSchema = z.object({
  tier: z.enum(['free', 'pro']),
  reason: z.string().optional(),
});

export const createRecipeSchema = z.object({
  title: z.string().min(2, 'Title required'),
  description: z.string().min(5, 'Description required'),
  image: z.string().url().or(z.string().min(1)),
  cuisine: z.enum(['Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean', 'British']),
  vibes: z.array(z.string()).default([]),
  prepTimeMinutes: z.number().min(1),
  cookTimeMinutes: z.number().min(0),
  servings: z.number().min(1).default(2),
  calories: z.number().min(0).default(500),
  carbsGrams: z.number().min(0).default(50),
  proteinGrams: z.number().min(0).default(30),
  fatGrams: z.number().min(0).default(15),
  ingredients: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.number().min(0.01),
      unit: z.string().default(''),
      aisle: z.enum([
        'Fresh Produce',
        'Meat & Seafood',
        'Dairy & Refrigerated',
        'Pantry & Grains',
        'Bakery',
        'Spices & Condiments',
        'Frozen',
      ]),
      estimatedCost: z.number().min(0).default(1),
      icon: z.string().optional(),
    })
  ).min(1, 'At least 1 ingredient required'),
  instructions: z.array(z.string().min(1)).min(1, 'At least 1 instruction step required'),
  dietaryTags: z.array(z.enum(['Vegetarian', 'Vegan', 'Pescatarian', 'None'])).default(['None']),
  allergens: z.array(z.string()).default([]),
  equipmentNeeded: z.array(z.string()).default(['Hob Only']),
});

export const updateRecipeSchema = createRecipeSchema.partial();

/**
 * 1. Admin Metrics Overview
 */
export const getMetrics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      freeUsers,
      proUsers,
      activePaidSubs,
      monthlySubs,
      yearlySubs,
      totalRecipes,
      totalPlans,
      totalPantryItems,
      totalHouseholds,
      totalInvoices,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscriptionTier: 'free' }),
      User.countDocuments({ subscriptionTier: 'pro' }),
      Subscription.countDocuments({ status: 'active', planId: { $ne: 'mise_free' } }),
      Subscription.countDocuments({ status: 'active', billingCycle: 'monthly', planId: { $ne: 'mise_free' } }),
      Subscription.countDocuments({ status: 'active', billingCycle: 'yearly', planId: { $ne: 'mise_free' } }),
      Recipe.countDocuments(),
      MealPlan.countDocuments(),
      PantryItem.countDocuments(),
      Household.countDocuments(),
      BillingInvoice.countDocuments({ status: 'paid' }),
    ]);

    // Estimated MRR: $4.99 per monthly subscriber + ($49.99 / 12) per yearly subscriber
    const estimatedMRR = Math.round((monthlySubs * 4.99 + yearlySubs * (49.99 / 12)) * 100) / 100;

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          free: freeUsers,
          pro: proUsers,
          conversionRate: totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0,
        },
        subscriptions: {
          activePaid: activePaidSubs,
          monthly: monthlySubs,
          yearly: yearlySubs,
          estimatedMRR,
          totalInvoicesPaid: totalInvoices,
        },
        system: {
          totalRecipes,
          totalMealPlans: totalPlans,
          totalPantryItems,
          totalHouseholds,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 2. Paginated User List (Sanitized)
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const search = req.query.search as string;
    const tier = req.query.tier as string;

    const query: any = {};
    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { email: { $regex: sanitized, $options: 'i' } },
      ];
    }
    if (tier && (tier === 'free' || tier === 'pro')) {
      query.subscriptionTier = tier;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('_id name email role subscriptionTier subscriptionStatus billingCycle createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 3. User Details with Usage Aggregates
 */
export const getUserDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(
      '_id name email role subscriptionTier subscriptionStatus billingCycle subscriptionExpiresAt createdAt updatedAt'
    );
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const [pantryCount, plansCount, household, subscription, invoices] = await Promise.all([
      PantryItem.countDocuments({ user: user._id }),
      MealPlan.countDocuments({ user: user._id }),
      Household.findOne({ 'members.user': user._id }),
      Subscription.findOne({ user: user._id }),
      BillingInvoice.find({ user: user._id }).sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      data: {
        user,
        subscription,
        invoices,
        usage: {
          pantryCount,
          plansCount,
          householdName: household ? household.name : null,
          householdMembers: household ? household.members.length : 1,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 4. Update User Subscription Tier
 */
export const updateUserTier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tier, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const previousTier = user.subscriptionTier;
    const previousExpiresAt = user.subscriptionExpiresAt;

    user.subscriptionTier = tier;
    user.subscriptionStatus = tier === 'pro' ? 'active' : 'trial';
    if (tier === 'pro') {
      user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else {
      user.subscriptionExpiresAt = undefined;
    }
    await user.save();

    await Subscription.findOneAndUpdate(
      { user: user._id },
      {
        planId: tier === 'pro' ? 'mise_pro_monthly' : 'mise_free',
        status: tier === 'pro' ? 'active' : 'trialing',
        amount: tier === 'pro' ? 4.99 : 0,
      },
      { upsert: true }
    );

    // Create Audit Log record for administrative accountability
    await AdminAuditLog.create({
      adminUser: req.user!.id,
      adminEmail: req.user!.email,
      targetUser: user._id,
      targetEmail: user.email,
      action: 'update_user_tier',
      details: {
        previousTier,
        newTier: tier,
        previousExpiresAt,
        newExpiresAt: user.subscriptionExpiresAt,
        reason: reason || 'Manual administrative tier override',
      },
      ip: req.ip,
    });

    res.json({
      success: true,
      data: { id: user._id, email: user.email, subscriptionTier: user.subscriptionTier },
      message: `User ${user.email} updated to ${tier.toUpperCase()}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * 5. Admin Recipe Management (List)
 */
export const getAdminRecipes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const search = req.query.search as string;

    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } },
      ];
    }

    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Recipe.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: recipes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 6. Admin Create Recipe
 */
export const createAdminRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const slug = req.body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const recipe = await Recipe.create({
      ...req.body,
      slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    res.status(201).json({
      success: true,
      data: recipe,
      message: `Recipe "${recipe.title}" created successfully.`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * 7. Admin Update Recipe
 */
export const updateAdminRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }

    res.json({
      success: true,
      data: recipe,
      message: `Recipe "${recipe.title}" updated successfully.`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};
