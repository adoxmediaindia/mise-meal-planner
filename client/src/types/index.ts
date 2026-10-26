export type Language = 'en' | 'de' | 'fr' | 'nl';

export type DietaryNeed = 'Vegetarian' | 'Vegan' | 'Pescatarian' | 'None';

export type Allergen =
  | 'Gluten'
  | 'Dairy'
  | 'Peanuts'
  | 'Tree Nuts'
  | 'Eggs'
  | 'Fish'
  | 'Shellfish'
  | 'Soy'
  | 'Sesame';

export type KitchenEquipment =
  | 'Air Fryer'
  | 'Slow Cooker'
  | 'Hob Only'
  | 'Oven'
  | 'Blender'
  | 'Instant Pot';

export type MealVibe =
  | 'Speedy Meals'
  | 'Low Calorie'
  | 'Family Favs'
  | 'Healthy Comfort'
  | 'Fakeaway'
  | 'Gut Friendly'
  | 'Protein Packed'
  | 'British Staples';

export type Cuisine =
  | 'Italian'
  | 'Asian'
  | 'Mexican'
  | 'Indian'
  | 'Mediterranean'
  | 'British';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Supermarket =
  | 'Aldi'
  | 'Walmart'
  | 'Kroger'
  | 'Costco'
  | 'Publix'
  | 'Safeway'
  | 'H-E-B'
  | 'Whole Foods'
  | "Trader Joe's"
  | 'Food Lion'
  | 'Sprouts';

export type SupermarketAisle =
  | 'Fresh Produce'
  | 'Meat & Seafood'
  | 'Dairy & Refrigerated'
  | 'Pantry & Grains'
  | 'Bakery'
  | 'Spices & Condiments'
  | 'Frozen';

export interface IIngredient {
  name: string;
  quantity: number;
  unit: string;
  aisle: SupermarketAisle;
  estimatedCost: number;
  icon?: string;
}

export interface IRecipe {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  cuisine: Cuisine;
  vibes: MealVibe[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  calories: number;
  carbsGrams: number;
  proteinGrams: number;
  fatGrams: number;
  ingredients: IIngredient[];
  instructions: string[];
  dietaryTags: DietaryNeed[];
  allergens: Allergen[];
  equipmentNeeded: KitchenEquipment[];
  upvotes?: number;
  downvotes?: number;
}

export interface IDinnerSlot {
  day: DayOfWeek;
  recipe: IRecipe;
  isCooked: boolean;
}

export interface IMealSlot {
  id: string;
  day: DayOfWeek;
  mealType: MealType;
  recipe: IRecipe;
  servings?: number;
  isCooked: boolean;
}

export interface IMealPlan {
  _id: string;
  user: string;
  weekStartDate: string;
  dinners: IDinnerSlot[];
  meals?: IMealSlot[];
  householdSize: number;
  estimatedCost: number;
  budgetLimit: number;
  isArchived?: boolean;
}

export interface IShoppingItem {
  id: string;
  name: string;
  totalQuantity: number;
  unit: string;
  aisle: SupermarketAisle;
  estimatedCost: number;
  isBought: boolean;
  recipeTitles: string[];
  icon?: string;
  isCustom?: boolean;
  pantryNote?: string;
}

export interface IPantryItem {
  _id?: string;
  id?: string;
  user?: string;
  name: string;
  quantity: number;
  unit: string;
  category: SupermarketAisle;
  expiryDate?: Date | string;
  icon?: string;
  notes?: string;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  daysUntilExpiry?: number;
}

export type HouseholdMemberRole = 'owner' | 'admin' | 'member';

export interface IHouseholdMemberInfo {
  user: {
    _id: string;
    id?: string;
    name: string;
    email: string;
  };
  role: HouseholdMemberRole;
  joinedAt: Date | string;
}

export interface IHousehold {
  _id?: string;
  name: string;
  owner: {
    _id: string;
    id?: string;
    name: string;
    email: string;
  };
  members: IHouseholdMemberInfo[];
  shareMealPlan: boolean;
  shareGroceryList: boolean;
  sharePantry: boolean;
}

export interface IHouseholdInvitation {
  _id?: string;
  household: {
    _id: string;
    name: string;
    owner: string;
  };
  invitedBy: {
    _id: string;
    name: string;
    email: string;
  };
  inviteeEmail: string;
  inviteToken: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected' | 'revoked' | 'expired';
  expiresAt: Date | string;
}

export interface IPantryRecipeMatch {
  recipe: IRecipe;
  matchPercentage: number;
  availableIngredients: {
    name: string;
    quantity: number;
    unit: string;
    pantryQuantity: number;
    pantryUnit: string;
  }[];
  missingIngredients: {
    name: string;
    quantity: number;
    unit: string;
    deficitQuantity: number;
    aisle: SupermarketAisle;
    estimatedCost: number;
  }[];
  canCookFully: boolean;
}

export interface IShoppingList {
  _id: string;
  user: string;
  plan: string;
  supermarket: Supermarket;
  items: IShoppingItem[];
  totalEstimatedCost: number;
  itemsBoughtCount: number;
  totalItemsCount: number;
}

export interface IUserPreferences {
  _id?: string;
  supermarket: Supermarket;
  householdSize: number;
  cookingDays: DayOfWeek[];
  weeklyBudget: number;
  dietaryNeeds: DietaryNeed[];
  allergies: Allergen[];
  equipment: KitchenEquipment[];
  vibes: MealVibe[];
  maxCookTimeMinutes?: number;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  subscriptionTier: 'free' | 'pro';
  subscriptionStatus: 'active' | 'trial' | 'cancelled';
  favorites?: string[];
}

export interface ISubscription {
  _id?: string;
  planId: 'mise_free' | 'mise_pro_monthly' | 'mise_pro_yearly';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface IBillingInvoice {
  _id?: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  billingCycle: 'monthly' | 'yearly';
  planName: string;
  paidAt?: string;
}

export interface IUserUsageStats {
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

export interface IAdminMetrics {
  users: {
    total: number;
    free: number;
    pro: number;
    conversionRate: number;
  };
  subscriptions: {
    activePaid: number;
    monthly: number;
    yearly: number;
    estimatedMRR: number;
    totalInvoicesPaid: number;
  };
  system: {
    totalRecipes: number;
    totalMealPlans: number;
    totalPantryItems: number;
    totalHouseholds: number;
  };
}
