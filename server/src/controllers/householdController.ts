import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { HouseholdService } from '../services/householdService.js';
import { EntitlementError } from '../services/entitlementService.js';

export const createHouseholdSchema = z.object({
  name: z.string().min(1, 'Household name is required').max(60),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Valid email address is required'),
  role: z.enum(['admin', 'member']).default('member'),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
});

export const getMyHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const household = await HouseholdService.getHousehold(userId);
    res.json({ success: true, data: household });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name } = req.body;
    const household = await HouseholdService.createHousehold(userId, name);
    res.status(201).json({
      success: true,
      data: household,
      message: `Household "${name}" created successfully.`,
    });
  } catch (err: any) {
    if (err instanceof EntitlementError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        feature: err.feature,
        limit: err.limit,
        current: err.current,
      });
      return;
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { email, role } = req.body;
    const result = await HouseholdService.inviteMember(userId, email, role);
    res.status(201).json({
      success: true,
      data: result.invitation,
      inviteLink: result.inviteLink,
      message: `Invitation generated for ${email}. Note: As direct email dispatch is not configured, share the invitation link or token directly.`,
    });
  } catch (err: any) {
    if (err instanceof EntitlementError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        feature: err.feature,
        limit: err.limit,
        current: err.current,
      });
      return;
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getPendingInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user!.email;
    const invitations = await HouseholdService.getPendingInvitations(userEmail);
    res.json({ success: true, count: invitations.length, data: invitations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const acceptInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    const { token } = req.body;
    const household = await HouseholdService.acceptInvitation(userId, userEmail, token);
    res.json({
      success: true,
      data: household,
      message: `You have successfully joined "${household.name}"!`,
    });
  } catch (err: any) {
    if (err instanceof EntitlementError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        feature: err.feature,
        limit: err.limit,
        current: err.current,
      });
      return;
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

export const rejectInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user!.email;
    const { token } = req.body;
    await HouseholdService.rejectInvitation(userEmail, token);
    res.json({ success: true, message: 'Invitation declined.' });
  } catch (err: any) {
    if (err instanceof EntitlementError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        feature: err.feature,
        limit: err.limit,
        current: err.current,
      });
      return;
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

export const revokeInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await HouseholdService.revokeInvitation(userId, id);
    res.json({ success: true, message: 'Invitation revoked.' });
  } catch (err: any) {
    if (err instanceof EntitlementError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        feature: err.feature,
        limit: err.limit,
        current: err.current,
      });
      return;
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { memberId } = req.params;
    const household = await HouseholdService.removeMember(userId, memberId);
    res.json({ success: true, data: household, message: 'Member removed from household.' });
  } catch (err: any) {
    if (err instanceof EntitlementError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        feature: err.feature,
        limit: err.limit,
        current: err.current,
      });
      return;
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

export const leaveHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await HouseholdService.leaveHousehold(userId);
    res.json({ success: true, message: 'You have left the household.' });
  } catch (err: any) {
    if (err instanceof EntitlementError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        feature: err.feature,
        limit: err.limit,
        current: err.current,
      });
      return;
    }
    res.status(400).json({ success: false, error: err.message });
  }
};
