import { Response, Request } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { SubscriptionService } from '../services/subscriptionService.js';
import { EntitlementService } from '../services/entitlementService.js';

export const upgradePlanSchema = z.object({
  planId: z.enum(['mise_pro_monthly', 'mise_pro_yearly']),
});

export const getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const status = await SubscriptionService.getStatus(userId);
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const upgradeSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { planId } = req.body;

    const isProduction = process.env.NODE_ENV === 'production';
    const isMockAllowed = !isProduction || process.env.ENABLE_MOCK_BILLING === 'true';

    // In production without mock billing enabled, direct self-upgrades are rejected
    if (!isMockAllowed) {
      res.status(402).json({
        success: false,
        error: 'Payment verification required: Direct self-upgrades without a verified payment processor are disabled in production.',
        code: 'PAYMENT_VERIFICATION_REQUIRED',
      });
      return;
    }

    const result = await SubscriptionService.upgrade(userId, planId);
    res.json({
      success: true,
      data: result.subscription,
      message: result.message,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await SubscriptionService.cancelSubscription(userId);
    res.json({
      success: true,
      data: result.subscription,
      message: result.message,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const reactivateSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await SubscriptionService.reactivateSubscription(userId);
    res.json({
      success: true,
      data: result.subscription,
      message: result.message,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const invoices = await SubscriptionService.getInvoices(userId);
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getUsageStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const stats = await EntitlementService.getUserUsageStats(userId);
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const mockUpgrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const isMockAllowed = !isProduction || process.env.ENABLE_MOCK_BILLING === 'true';

    if (!isMockAllowed) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Mock upgrades are disabled in production environment.',
        code: 'MOCK_UPGRADES_DISABLED',
      });
      return;
    }

    const userId = req.user!.id;
    const currentStatus = await SubscriptionService.getStatus(userId);

    if (currentStatus.tier === 'pro') {
      const result = await SubscriptionService.downgrade(userId);
      res.json({
        success: true,
        data: { tier: 'free', status: 'trial' },
        message: result.message,
      });
    } else {
      const result = await SubscriptionService.upgrade(userId, 'mise_pro_monthly');
      res.json({
        success: true,
        data: { tier: 'pro', status: 'active' },
        message: result.message,
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const webhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = (req as any).rawBody;
    const result = await SubscriptionService.processWebhook(req.body, req.headers, rawBody);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};
