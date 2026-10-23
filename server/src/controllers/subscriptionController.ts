import { Response } from 'express';
import { User } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

export const getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        isActive: user.subscriptionTier === 'pro' && user.subscriptionStatus === 'active',
        planDetails: {
          name: user.subscriptionTier === 'pro' ? 'Mise Pro Chef' : 'Mise Starter (Trial)',
          billingPeriod: 'Monthly',
          price: user.subscriptionTier === 'pro' ? '$4.99 / month' : 'Free Trial',
          features: [
            'Unlimited weekly dinner planning',
            'Smart consolidated supermarket shopping list',
            'Full dietary and allergy safety filters',
            'Instant 1-tap meal swapping',
            'Access to all world cuisines and vibes',
          ],
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const mockUpgrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const newTier = user.subscriptionTier === 'pro' ? 'free' : 'pro';
    const newStatus = newTier === 'pro' ? 'active' : 'trial';

    user.subscriptionTier = newTier;
    user.subscriptionStatus = newStatus;
    await user.save();

    res.json({
      success: true,
      data: {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
      },
      message: `Subscription tier switched to ${newTier.toUpperCase()}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const webhook = async (req: any, res: any): Promise<void> => {
  try {
    const { event, data } = req.body;

    if (!event || !data) {
      res.status(400).json({ success: false, error: 'Invalid webhook payload structure' });
      return;
    }

    // Process customer subscription update events
    if (event === 'customer.subscription.updated' || event === 'customer.subscription.created') {
      const email = data.customer_email || data.email;
      if (email) {
        const user = await User.findOne({ email });
        if (user) {
          user.subscriptionTier = data.tier === 'free' ? 'free' : 'pro';
          user.subscriptionStatus = data.status || 'active';
          await user.save();
        }
      }
    } else if (event === 'customer.subscription.deleted') {
      const email = data.customer_email || data.email;
      if (email) {
        const user = await User.findOne({ email });
        if (user) {
          user.subscriptionTier = 'free';
          user.subscriptionStatus = 'cancelled';
          await user.save();
        }
      }
    }

    res.json({ received: true, event });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
