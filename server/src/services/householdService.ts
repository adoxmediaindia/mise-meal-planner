import crypto from 'crypto';
import { Household, IHouseholdDoc, HouseholdMemberRole } from '../models/Household.js';
import { HouseholdInvitation, IHouseholdInvitationDoc } from '../models/HouseholdInvitation.js';
import { User } from '../models/User.js';
import { EntitlementService } from './entitlementService.js';

export class HouseholdService {
  /**
   * Retrieves the household for a user, if they belong to one
   */
  public static async getHousehold(userId: string): Promise<IHouseholdDoc | null> {
    const household = await Household.findOne({
      $or: [{ owner: userId }, { 'members.user': userId }],
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    return household;
  }

  /**
   * Creates a new household with the calling user as owner
   */
  public static async createHousehold(userId: string, name: string): Promise<IHouseholdDoc> {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Household name is required.');

    const existing = await Household.findOne({
      $or: [{ owner: userId }, { 'members.user': userId }],
    });

    if (existing) {
      throw new Error('You are already part of a household. Leave or delete your existing household first.');
    }

    const household = await Household.create({
      name: trimmedName,
      owner: userId,
      members: [
        {
          user: userId as any,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      shareMealPlan: true,
      shareGroceryList: true,
      sharePantry: true,
    });

    return household.populate(['owner', 'members.user']);
  }

  /**
   * Generates a secure, expiring invitation to join the household
   * Note: As email delivery is not configured, this returns the secure invite token & link
   * for the inviter to copy and share directly with the invitee.
   */
  public static async inviteMember(
    userId: string,
    inviteeEmail: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<{ invitation: IHouseholdInvitationDoc; inviteLink: string }> {
    const normalizedEmail = inviteeEmail.toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('A valid email address is required for invitation.');
    }

    const household = await Household.findOne({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).populate('members.user', 'email');

    if (!household) throw new Error('You do not belong to any household.');

    // Check caller permission: must be owner or admin
    const callerMember = household.members.find((m) => m.user._id.toString() === userId.toString());
    const isOwner = household.owner.toString() === userId.toString();
    const isAdmin = callerMember?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new Error('Only household owners and admins can invite new members.');
    }

    // Check if invitee is already a member
    const alreadyMember = household.members.some((m) => {
      const u = m.user as any;
      return u && u.email && u.email.toLowerCase() === normalizedEmail;
    });

    if (alreadyMember) {
      throw new Error('This user is already a member of your household.');
    }

    // Revoke any previous pending invitation for this email in this household before evaluating capacity
    await HouseholdInvitation.updateMany(
      { household: household._id, inviteeEmail: normalizedEmail, status: 'pending' },
      { status: 'revoked' }
    );

    // Enforce tier member limit (Free: 2 members, Pro: 10 members)
    await EntitlementService.assertCanInviteHouseholdMember(userId, household._id.toString());

    const inviteToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await HouseholdInvitation.create({
      household: household._id,
      invitedBy: userId,
      inviteeEmail: normalizedEmail,
      inviteToken,
      role,
      status: 'pending',
      expiresAt,
    });

    const inviteLink = `/app/settings/household?inviteToken=${inviteToken}`;

    return { invitation, inviteLink };
  }

  /**
   * Retrieves pending, unexpired invitations for a user's email
   */
  public static async getPendingInvitations(userEmail: string): Promise<IHouseholdInvitationDoc[]> {
    const normalizedEmail = userEmail.toLowerCase().trim();

    // Auto-expire outdated pending invitations
    await HouseholdInvitation.updateMany(
      {
        inviteeEmail: normalizedEmail,
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      { status: 'expired' }
    );

    return HouseholdInvitation.find({
      inviteeEmail: normalizedEmail,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('household', 'name owner')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  /**
   * Accepts a household invitation via secure token
   */
  public static async acceptInvitation(
    userId: string,
    userEmail: string,
    inviteToken: string
  ): Promise<IHouseholdDoc> {
    const normalizedEmail = userEmail.toLowerCase().trim();

    const invitation = await HouseholdInvitation.findOne({
      inviteToken,
      status: 'pending',
    });

    if (!invitation) {
      throw new Error('Invitation not found or is no longer valid.');
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      throw new Error('This invitation has expired.');
    }

    if (invitation.inviteeEmail.toLowerCase() !== normalizedEmail) {
      throw new Error('This invitation was sent to a different email address.');
    }

    // Check if user is already in another household
    const existingHousehold = await Household.findOne({
      $or: [{ owner: userId }, { 'members.user': userId }],
    });
    if (existingHousehold) {
      throw new Error('You already belong to a household. Leave your current household before accepting a new invitation.');
    }

    const household = await Household.findById(invitation.household);
    if (!household) throw new Error('Household no longer exists.');

    // Add user as member
    household.members.push({
      user: userId as any,
      role: invitation.role,
      joinedAt: new Date(),
    });

    await household.save();

    invitation.status = 'accepted';
    await invitation.save();

    return household.populate(['owner', 'members.user']);
  }

  /**
   * Rejects a household invitation
   */
  public static async rejectInvitation(userEmail: string, inviteToken: string): Promise<boolean> {
    const normalizedEmail = userEmail.toLowerCase().trim();

    const invitation = await HouseholdInvitation.findOne({
      inviteToken,
      inviteeEmail: normalizedEmail,
      status: 'pending',
    });

    if (!invitation) throw new Error('Invitation not found.');

    invitation.status = 'rejected';
    await invitation.save();
    return true;
  }

  /**
   * Revokes an invitation (owner/admin only)
   */
  public static async revokeInvitation(userId: string, invitationId: string): Promise<boolean> {
    const invitation = await HouseholdInvitation.findById(invitationId);
    if (!invitation) throw new Error('Invitation not found.');

    const household = await Household.findById(invitation.household);
    if (!household) throw new Error('Household not found.');

    const isOwner = household.owner.toString() === userId.toString();
    const callerMember = household.members.find((m) => m.user.toString() === userId.toString());
    const isAdmin = callerMember?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new Error('Only household owners and admins can revoke invitations.');
    }

    invitation.status = 'revoked';
    await invitation.save();
    return true;
  }

  /**
   * Removes a member from the household
   */
  public static async removeMember(userId: string, memberUserId: string): Promise<IHouseholdDoc> {
    const household = await Household.findOne({
      $or: [{ owner: userId }, { 'members.user': userId }],
    });
    if (!household) throw new Error('Household not found.');

    const isOwner = household.owner.toString() === userId.toString();
    const callerMember = household.members.find((m) => m.user.toString() === userId.toString());
    const isAdmin = callerMember?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new Error('Only owners and admins can remove household members.');
    }

    if (household.owner.toString() === memberUserId.toString()) {
      throw new Error('Cannot remove the household owner.');
    }

    const initialCount = household.members.length;
    household.members = household.members.filter((m) => m.user.toString() !== memberUserId.toString());

    if (household.members.length === initialCount) {
      throw new Error('Member not found in household.');
    }

    await household.save();
    return household.populate(['owner', 'members.user']);
  }

  /**
   * Allows a user to leave their current household
   */
  public static async leaveHousehold(userId: string): Promise<boolean> {
    const household = await Household.findOne({
      $or: [{ owner: userId }, { 'members.user': userId }],
    });
    if (!household) throw new Error('You do not belong to any household.');

    const isOwner = household.owner.toString() === userId.toString();

    if (isOwner) {
      const otherMembers = household.members.filter((m) => m.user.toString() !== userId.toString());
      if (otherMembers.length === 0) {
        // Last member and owner: delete household
        await Household.findByIdAndDelete(household._id);
        await HouseholdInvitation.deleteMany({ household: household._id });
        return true;
      } else {
        // Transfer ownership to first admin or oldest member
        const nextOwner = otherMembers.find((m) => m.role === 'admin') || otherMembers[0];
        household.owner = nextOwner.user;
        nextOwner.role = 'owner';
        household.members = otherMembers;
        await household.save();
        return true;
      }
    }

    // Regular member leaving
    household.members = household.members.filter((m) => m.user.toString() !== userId.toString());
    await household.save();
    return true;
  }
}
