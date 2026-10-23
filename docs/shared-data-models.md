# Mise Meal Planner — Shared Data Models & Schemas

This document defines the canonical TypeScript interfaces and domain schemas that govern the shared data contracts between the **Backend API**, the **Web Client (React)**, and the **Mobile Client (React Native + Expo)**.

---

## 1. Core Domain Types

```typescript
export type Cuisine =
  | 'Italian'
  | 'Asian'
  | 'Mexican'
  | 'Indian'
  | 'Mediterranean'
  | 'British';

export type MealVibe =
  | 'Speedy Meals'
  | 'Family Favs'
  | 'Budget Friendly'
  | 'Healthy & Fresh'
  | 'Comfort Food'
  | 'One Pot Wonders'
  | 'Date Night'
  | 'Kids Choice';

export type DietaryNeed =
  | 'None'
  | 'Vegetarian'
  | 'Vegan'
  | 'Gluten-Free'
  | 'Dairy-Free'
  | 'Pescatarian'
  | 'Low Carb';

export type Allergen =
  | 'Peanuts'
  | 'Tree Nuts'
  | 'Dairy'
  | 'Eggs'
  | 'Wheat'
  | 'Soy'
  | 'Fish'
  | 'Shellfish'
  | 'Sesame';

export type KitchenEquipment =
  | 'Hob Only'
  | 'Oven'
  | 'Slow Cooker'
  | 'Air Fryer'
  | 'Microwave'
  | 'Blender';

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
```

---

## 2. Entity Interfaces

### 2.1 User & Session
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionTier: 'free' | 'pro';
  subscriptionStatus: 'active' | 'trial' | 'cancelled';
  favorites?: string[];
  token?: string; // JWT token returned for mobile SecureStore
}
```

### 2.2 Household Preference
```typescript
export interface Preference {
  _id?: string;
  user: string;
  supermarket: Supermarket;
  householdSize: number;
  cookingDays: DayOfWeek[];
  weeklyBudget: number;
  dietaryNeeds: DietaryNeed[];
  allergies: Allergen[];
  equipment: KitchenEquipment[];
  vibes: MealVibe[];
  updatedAt?: string;
}
```

### 2.3 Recipe & Ingredients
```typescript
export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  aisle: SupermarketAisle;
  estimatedCost: number;
  icon?: string;
}

export interface Recipe {
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
  ingredients: Ingredient[];
  instructions: string[];
  dietaryTags: DietaryNeed[];
  allergens: Allergen[];
  equipmentNeeded: KitchenEquipment[];
  upvotes: number;
  downvotes: number;
}
```

### 2.4 Weekly Meal Plan
```typescript
export interface DinnerSlot {
  day: DayOfWeek;
  recipe: Recipe;
  isCooked: boolean;
}

export interface MealPlan {
  _id: string;
  user: string;
  weekStartDate: string;
  dinners: DinnerSlot[];
  householdSize: number;
  estimatedCost: number;
  budgetLimit: number;
  updatedAt?: string;
}
```

### 2.5 Consolidated Shopping List
```typescript
export interface ShoppingItem {
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

export interface ShoppingList {
  _id: string;
  user: string;
  plan: string;
  supermarket: Supermarket;
  items: ShoppingItem[];
  totalEstimatedCost: number;
  itemsBoughtCount: number;
  totalItemsCount: number;
  updatedAt?: string;
}
```

---

## 3. Cross-Platform Validation Guarantees

1. **Household Size**: Bound between 1 and 12 persons.
2. **Weekly Budget**: Minimum £/$/€ 10.
3. **Meal Vibes**: Maximum 3 vibes selectable for optimal plan diversity.
4. **Allergy Safety Filter**: Strictly excludes recipes containing any allergen selected in user preferences.
5. **Dietary Constraint Filter**: Strictly enforces Vegetarian, Vegan, Gluten-Free, and Dairy-Free recipe tags.
