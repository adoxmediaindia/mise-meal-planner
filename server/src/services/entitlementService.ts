import { User, IUser } from '../models/User.js';
import { PantryItem } from '../models/PantryItem.js';
import { Household } from '../models/Household.js';
import { HouseholdInvitation } from '../models/HouseholdInvitation.js';
import { ShoppingList } from '../models/ShoppingList.js';
import { MealPlan } from '../models/MealPlan.js';

export interface PlanEntitlements {
  tier: 'free' | 'pro';
  maxWeeklyGenerations: number;
  maxWeeklyAiQueries: number;
  maxPantryItems: number;
  maxHouseholdMembers: number;
  maxSavedCustomGroceryItems: number;
  canArchivePlanHistory: boolean;
  maxPlanHistoryWeeks: number;
  canAccessPantryRecipeMatching: boolean;
  prioritySupport: boolean;
}

export interface UserUsageStats {
  tier: 'free' | 'pro';
  status: string;
  pantry: {
    count: number;
    limit: number;
    isLimitReached: boolean;
  };
  weeklyGenerations: {
    count: number;
    limit: number;
    isLimitReached: boolean;
    resetsInDays: number;
  };
  household: {
    membersCount: number;
    limit: number;
    isLimitReached: boolean;
  };
  customGroceryItems: {
    count: number;
    limit: number;
  };
}

export class EntitlementError extends Error {
  public statusCode: number = 403;
  public code: string = 'UPGRADE_REQUIRED';
  public feature: string;
  public limit: number;
  public current: number;

  constructor(message: string, feature: string, limit: number, current: number) {
    super(message);
    this.name = 'EntitlementError';
    this.feature = feature;
    this.limit = limit;
    this.current = current;
  }
}

export class EntitlementService {
  public static getEntitlements(user: {
    subscriptionTier: string;
    subscriptionExpiresAt?: Date;
    subscriptionStatus?: string;
    role?: string;
  }): PlanEntitlements {
    const now = new Date();
    const isPro =
      user.subscriptionTier === 'pro' &&
      user.subscriptionStatus === 'active' &&
      (user.role === 'admin' ||
        (user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) > now : process.env.NODE_ENV === 'test'));

    if (isPro) {
      return {
        tier: 'pro',
        maxWeeklyGenerations: -1, // Unlimited
        maxWeeklyAiQueries: 50,
        maxPantryItems: -1,       // Unlimited
        maxHouseholdMembers: 10,
        maxSavedCustomGroceryItems: -1, // Unlimited
        canArchivePlanHistory: true,
        maxPlanHistoryWeeks: -1, // Unlimited
        canAccessPantryRecipeMatching: true,
        prioritySupport: true,
      };
    }

    const freeGenerations = process.env.FREE_TIER_WEEKLY_GENERATIONS
      ? parseInt(process.env.FREE_TIER_WEEKLY_GENERATIONS, 10)
      : (process.env.NODE_ENV === 'test' ? 3 : 10);

    const freeAiQueries = process.env.FREE_TIER_WEEKLY_AI_QUERIES
      ? parseInt(process.env.FREE_TIER_WEEKLY_AI_QUERIES, 10)
      : 5;

    return {
      tier: 'free',
      maxWeeklyGenerations: freeGenerations,
      maxWeeklyAiQueries: freeAiQueries,
      maxPantryItems: 15,
      maxHouseholdMembers: 2,
      maxSavedCustomGroceryItems: 15,
      canArchivePlanHistory: true,
      maxPlanHistoryWeeks: 2,
      canAccessPantryRecipeMatching: true,
      prioritySupport: false,
    };
  }

  /**
   * Asserts whether user has allowance to generate a new weekly meal plan
   */
  public static async assertCanGeneratePlan(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const entitlements = this.getEntitlements(user);
    if (entitlements.maxWeeklyGenerations === -1) return; // Pro: unlimited

    // Count plans generated in the last 7 rolling days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let generationsCount = user.planGenerationsThisWeek || 0;
    if (user.lastPlanGenerationAt && new Date(user.lastPlanGenerationAt) < sevenDaysAgo) {
      generationsCount = 0;
    }

    const recentPlansCount = await MealPlan.countDocuments({
      user: userId,
      createdAt: { $gte: sevenDaysAgo },
    });

    const totalRecentGenerations = Math.max(generationsCount, recentPlansCount);

    if (totalRecentGenerations >= entitlements.maxWeeklyGenerations) {
      throw new EntitlementError(
        `Weekly meal plan generation limit reached on the Free plan (${entitlements.maxWeeklyGenerations}/week). Upgrade to Mise Pro for unlimited generations.`,
        'maxWeeklyGenerations',
        entitlements.maxWeeklyGenerations,
        totalRecentGenerations
      );
    }
  }

  /**
   * Asserts whether user has allowance to make an AI query
   */
  public static async assertCanUseAi(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const entitlements = this.getEntitlements(user);
    if (entitlements.maxWeeklyAiQueries === -1) return; // Pro: unlimited

    // Count AI queries generated in the last 7 rolling days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let count = 0;

    if (user.aiUsageTimestamps && user.aiUsageTimestamps.length > 0) {
      count = user.aiUsageTimestamps.filter((t) => new Date(t) >= sevenDaysAgo).length;
    } else if (user.lastAiGenerationAt && new Date(user.lastAiGenerationAt) >= sevenDaysAgo) {
      count = user.aiGenerationsThisWeek || 0;
    }

    if (count >= entitlements.maxWeeklyAiQueries) {
      throw new EntitlementError(
        `Weekly AI assistant query limit reached on the Free plan (${entitlements.maxWeeklyAiQueries}/week). Upgrade to Mise Pro for higher AI limits.`,
        'maxWeeklyAiQueries',
        entitlements.maxWeeklyAiQueries,
        count
      );
    }
  }

  /**
   * Atomically reserves an AI query slot across server instances and concurrent requests.
   * If the operation fails or is rejected, callers must invoke `rollback()` to refund the reservation.
   */
  public static async reserveAiUsage(
    userId: string
  ): Promise<{ commit: () => Promise<void>; rollback: () => Promise<void> }> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const entitlements = this.getEntitlements(user);
    if (entitlements.maxWeeklyAiQueries === -1) {
      return {
        commit: async () => {},
        rollback: async () => {},
      };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Prune expired timestamps older than 7 days
    await User.updateOne(
      { _id: userId },
      { $pull: { aiUsageTimestamps: { $lt: sevenDaysAgo } } }
    );

    // Atomic reservation checking rolling 7-day usage
    const updated = await User.findOneAndUpdate(
      {
        _id: userId,
        $expr: {
          $lt: [
            {
              $add: [
                {
                  $size: {
                    $filter: {
                      input: { $ifNull: ['$aiUsageTimestamps', []] },
                      as: 'ts',
                      cond: { $gte: ['$$ts', sevenDaysAgo] },
                    },
                  },
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: [{ $size: { $ifNull: ['$aiUsageTimestamps', []] } }, 0] },
                        { $gte: [{ $ifNull: ['$lastAiGenerationAt', new Date(0)] }, sevenDaysAgo] },
                      ],
                    },
                    { $ifNull: ['$aiGenerationsThisWeek', 0] },
                    0,
                  ],
                },
              ],
            },
            entitlements.maxWeeklyAiQueries,
          ],
        },
      },
      {
        $push: { aiUsageTimestamps: now },
        $inc: { aiGenerationsThisWeek: 1 },
        $set: { lastAiGenerationAt: now },
      },
      { new: true }
    );

    if (!updated) {
      // Re-read current count to provide descriptive EntitlementError
      const latest = await User.findById(userId);
      const currentCount =
        latest?.aiUsageTimestamps && latest.aiUsageTimestamps.length > 0
          ? latest.aiUsageTimestamps.filter((t) => new Date(t) >= sevenDaysAgo).length
          : latest?.aiGenerationsThisWeek || entitlements.maxWeeklyAiQueries;

      throw new EntitlementError(
        `Weekly AI assistant query limit reached on the Free plan (${entitlements.maxWeeklyAiQueries}/week). Upgrade to Mise Pro for higher AI limits.`,
        'maxWeeklyAiQueries',
        entitlements.maxWeeklyAiQueries,
        currentCount
      );
    }

    return {
      commit: async () => {
        // Already recorded atomically
      },
      rollback: async () => {
        await User.updateOne(
          { _id: userId },
          {
            $pull: { aiUsageTimestamps: now },
            $inc: { aiGenerationsThisWeek: -1 },
          }
        );
      },
    };
  }

  /**
   * Atomically records AI usage for a user with rolling reset
   */
  public static async recordAiUsage(userId: string): Promise<void> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const user = await User.findById(userId);
    if (!user) return;

    if (user.lastAiGenerationAt && new Date(user.lastAiGenerationAt) < sevenDaysAgo) {
      user.aiGenerationsThisWeek = 1;
      user.lastAiGenerationAt = now;
      user.aiUsageTimestamps = [now];
      await user.save();
    } else {
      await User.findByIdAndUpdate(userId, {
        $push: { aiUsageTimestamps: now },
        $inc: { aiGenerationsThisWeek: 1 },
        $set: { lastAiGenerationAt: now },
      });
    }
  }

  /**
   * Asserts whether user has capacity to add another pantry inventory item
   */
  public static async assertCanAddPantryItem(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const entitlements = this.getEntitlements(user);
    if (entitlements.maxPantryItems === -1) return; // Pro: unlimited

    const currentCount = await PantryItem.countDocuments({ user: userId });
    if (currentCount >= entitlements.maxPantryItems) {
      throw new EntitlementError(
        `Pantry inventory limit reached on the Free plan (${entitlements.maxPantryItems} items). Upgrade to Mise Pro for unlimited kitchen pantry tracking.`,
        'maxPantryItems',
        entitlements.maxPantryItems,
        currentCount
      );
    }
  }

  /**
   * Asserts whether a household can invite additional members under entitlement limits
   */
  public static async assertCanInviteHouseholdMember(userId: string, householdId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const entitlements = this.getEntitlements(user);

    const [household, pendingCount] = await Promise.all([
      Household.findById(householdId),
      HouseholdInvitation.countDocuments({ household: householdId, status: 'pending' }),
    ]);

    if (!household) throw new Error('Household not found');

    const totalOccupants = household.members.length + pendingCount;
    if (totalOccupants >= entitlements.maxHouseholdMembers) {
      throw new EntitlementError(
        `Household member limit reached (${entitlements.maxHouseholdMembers} members on your current plan). Upgrade to Mise Pro to share with up to 10 family members.`,
        'maxHouseholdMembers',
        entitlements.maxHouseholdMembers,
        totalOccupants
      );
    }
  }

  /**
   * Asserts whether user can add custom shopping items
   */
  public static async assertCanAddCustomShoppingItem(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const entitlements = this.getEntitlements(user);
    if (entitlements.maxSavedCustomGroceryItems === -1) return;

    const list = await ShoppingList.findOne({ user: userId });
    if (!list) return;

    const customItemsCount = list.items.filter((i) => i.isCustom).length;
    if (customItemsCount >= entitlements.maxSavedCustomGroceryItems) {
      throw new EntitlementError(
        `Custom grocery item limit reached on the Free plan (${entitlements.maxSavedCustomGroceryItems} items). Upgrade to Mise Pro for unlimited custom items.`,
        'maxSavedCustomGroceryItems',
        entitlements.maxSavedCustomGroceryItems,
        customItemsCount
      );
    }
  }

  /**
   * Retrieves comprehensive usage stats for UI dashboard display
   */
  public static async getUserUsageStats(userId: string): Promise<UserUsageStats> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const entitlements = this.getEntitlements(user);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let generationsCount = user.planGenerationsThisWeek || 0;
    if (user.lastPlanGenerationAt && new Date(user.lastPlanGenerationAt) < sevenDaysAgo) {
      generationsCount = 0;
    }

    const [pantryCount, recentPlansCount, household, shoppingList] = await Promise.all([
      PantryItem.countDocuments({ user: userId }),
      MealPlan.countDocuments({ user: userId, createdAt: { $gte: sevenDaysAgo } }),
      Household.findOne({ 'members.user': userId }),
      ShoppingList.findOne({ user: userId }),
    ]);

    const weeklyPlansCount = Math.max(generationsCount, recentPlansCount);

    const householdMembersCount = household ? household.members.length : 1;
    const customItemsCount = shoppingList
      ? shoppingList.items.filter((i) => i.isCustom).length
      : 0;

    return {
      tier: entitlements.tier,
      status: user.subscriptionStatus,
      pantry: {
        count: pantryCount,
        limit: entitlements.maxPantryItems,
        isLimitReached: entitlements.maxPantryItems !== -1 && pantryCount >= entitlements.maxPantryItems,
      },
      weeklyGenerations: {
        count: weeklyPlansCount,
        limit: entitlements.maxWeeklyGenerations,
        isLimitReached:
          entitlements.maxWeeklyGenerations !== -1 && weeklyPlansCount >= entitlements.maxWeeklyGenerations,
        resetsInDays: 7,
      },
      household: {
        membersCount: householdMembersCount,
        limit: entitlements.maxHouseholdMembers,
        isLimitReached: householdMembersCount >= entitlements.maxHouseholdMembers,
      },
      customGroceryItems: {
        count: customItemsCount,
        limit: entitlements.maxSavedCustomGroceryItems,
      },
    };
  }
}
