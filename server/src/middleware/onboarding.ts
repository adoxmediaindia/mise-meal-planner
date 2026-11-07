import { NextFunction, Response } from 'express';
import { User } from '../models/User.js';
import { AuthRequest } from './auth.js';

export const requireOnboardingComplete = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select('onboardingCompleted');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
      return;
    }
    if (!user.onboardingCompleted) {
      res.status(409).json({
        success: false,
        error: 'Finish onboarding to generate your personalized first meal plan.',
        code: 'ONBOARDING_COMPLETION_REQUIRED',
      });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};
