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

export type Supermarket =
  | 'Aldi'
  | 'Walmart'
  | 'Kroger'
  | 'Costco'
  | 'Publix'
  | 'Safeway'
  | 'H-E-B'
  | 'Whole Foods'
  | 'Trader Joe\'s'
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
  estimatedCost: number; // in USD base
  icon?: string;
}

export interface IRecipe {
  _id?: string;
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
}

export interface IUserPreferences {
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

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface IMealSlot {
  id?: string;
  day: DayOfWeek;
  mealType: MealType;
  recipe: any;
  servings?: number;
  isCooked: boolean;
}

export interface IDinnerSlot {
  day: DayOfWeek;
  recipe: any;
  isCooked: boolean;
}

export interface IMealPlan {
  _id?: string;
  user: string;
  weekStartDate: Date | string;
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
  user: any;
  role: HouseholdMemberRole;
  joinedAt: Date | string;
}

export interface IHousehold {
  _id?: string;
  name: string;
  owner: any;
  members: IHouseholdMemberInfo[];
  shareMealPlan: boolean;
  shareGroceryList: boolean;
  sharePantry: boolean;
}

export interface IHouseholdInvitation {
  _id?: string;
  household: any;
  invitedBy: any;
  inviteeEmail: string;
  inviteToken: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected' | 'revoked' | 'expired';
  expiresAt: Date | string;
}

export interface IPantryRecipeMatch {
  recipe: any;
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
