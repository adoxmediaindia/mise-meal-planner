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

export interface IMealPlan {
  _id: string;
  user: string;
  weekStartDate: string;
  dinners: IDinnerSlot[];
  householdSize: number;
  estimatedCost: number;
  budgetLimit: number;
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
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  subscriptionTier: 'free' | 'pro';
  subscriptionStatus: 'active' | 'trial' | 'cancelled';
  favorites?: string[];
  token?: string;
}
