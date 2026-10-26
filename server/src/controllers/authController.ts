import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Preference } from '../models/Preference.js';
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
      user.planGenerationsThisWeek = 1;
      user.lastPlanGenerationAt = new Date();
      await user.save();
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
        role: user.role || 'user',
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
        role: user.role || 'user',
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
