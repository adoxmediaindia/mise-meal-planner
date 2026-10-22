import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Preference } from '../models/Preference.js';
import { AuthRequest } from '../middleware/auth.js';
import { PlannerService } from '../services/plannerService.js';
import { ShoppingListService } from '../services/shoppingListService.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const generateTokenAndSetCookie = (res: Response, user: any) => {
  const secret = process.env.JWT_SECRET || 'mise_meal_planner_jwt_secret_dev_key_2026';
  const token = jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    },
    secret,
    { expiresIn: '30d' }
  );

  res.cookie('mise_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
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

    // Create default preferences
    const pref = await Preference.create({
      user: user._id,
      supermarket: 'Aldi',
      householdSize: 2,
      cookingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      weeklyBudget: 40,
      dietaryNeeds: ['None'],
      allergies: [],
      equipment: ['Hob Only'],
      vibes: ['Speedy Meals', 'Family Favs'],
    });

    // Generate initial plan & shopping list
    try {
      const plan = await PlannerService.generateWeeklyPlan(user._id.toString(), pref);
      await ShoppingListService.generateOrUpdateShoppingList(user._id.toString(), plan._id.toString());
    } catch (planErr) {
      console.warn('Initial plan generation skipped or failed:', planErr);
    }

    const token = generateTokenAndSetCookie(res, user);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
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
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        favorites: user.favorites,
        token,
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
  res.clearCookie('mise_token');
  res.json({ success: true, message: 'Logged out successfully' });
};
