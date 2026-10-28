# Mise Meal Planner — API Contract Specification

**Base URL**: `/api/v1` (also aliased under `/api`)  
**Data Format**: `application/json`  
**Authentication**:
- Web Client: HTTP-Only cookie `mise_token`
- Mobile Client: HTTP header `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Endpoints

### 1.1 Register
- **Endpoint**: `POST /auth/register`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "664fa9c...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "subscriptionTier": "free",
      "subscriptionStatus": "trial",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 1.2 Login
- **Endpoint**: `POST /auth/login`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "664fa9c...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "subscriptionTier": "free",
      "subscriptionStatus": "trial",
      "favorites": [],
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 1.3 Logout
- **Endpoint**: `POST /auth/logout`
- **Auth**: Public (clears cookie)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### 1.4 Current User Profile
- **Endpoint**: `GET /auth/me`
- **Auth**: Required (`Bearer` or Cookie)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "664fa9c...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "subscriptionTier": "free",
      "subscriptionStatus": "trial",
      "favorites": ["664fa8a..."],
      "createdAt": "2026-10-23T00:00:00.000Z"
    }
  }
  ```

### 1.5 Account Recovery: Forgot Password
- **Endpoint**: `POST /auth/forgot-password`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "jane@example.com"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "If an account with this email exists, password reset instructions have been sent.",
    "resetToken": "optional-token-in-dev-mode"
  }
  ```

### 1.6 Account Recovery: Reset Password
- **Endpoint**: `POST /auth/reset-password`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "token": "reset-token-string",
    "newPassword": "NewSecurePassword123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Password reset successfully. You can now log in with your new password."
  }
  ```

---

## 2. Household Preferences Endpoints

### 2.1 Get Preferences
- **Endpoint**: `GET /preferences`
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "664faa1...",
      "user": "664fa9c...",
      "supermarket": "Aldi",
      "householdSize": 2,
      "cookingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "weeklyBudget": 40,
      "dietaryNeeds": ["None"],
      "allergies": [],
      "equipment": ["Hob Only", "Oven"],
      "vibes": ["Speedy Meals", "Family Favs"]
    }
  }
  ```

### 2.2 Update Preferences
- **Endpoint**: `PUT /preferences`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "supermarket": "Walmart",
    "householdSize": 3,
    "weeklyBudget": 50,
    "dietaryNeeds": ["Gluten-Free"],
    "allergies": ["Peanuts"],
    "vibes": ["Healthy & Fresh", "Speedy Meals"],
    "autoRegenerate": true
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": { ...updatedPreferences },
    "message": "Preferences updated successfully"
  }
  ```

---

## 3. Recipes Endpoints

### 3.1 List Recipes
- **Endpoint**: `GET /recipes`
- **Auth**: Public
- **Query Parameters**:
  - `cuisine`: e.g. `Italian`, `Asian`, `Mexican`, `Indian`, `Mediterranean`, `British`
  - `vibe`: e.g. `Speedy Meals`, `Budget Friendly`, `Family Favs`, `Healthy & Fresh`
  - `dietary`: e.g. `Vegetarian`, `Vegan`, `Gluten-Free`, `Dairy-Free`
  - `search`: search substring matching title, description, ingredients
  - `limit`: number of results (default `50`)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 12,
    "data": [
      {
        "_id": "664fa8a...",
        "title": "Creamy Tuscan Garlic Chicken",
        "slug": "creamy-tuscan-garlic-chicken",
        "description": "Tender chicken breasts in a rich garlic and sun-dried tomato sauce.",
        "image": "https://images.unsplash.com/photo-...",
        "cuisine": "Italian",
        "vibes": ["Speedy Meals", "Family Favs"],
        "prepTimeMinutes": 10,
        "cookTimeMinutes": 20,
        "servings": 2,
        "calories": 480,
        "carbsGrams": 14,
        "proteinGrams": 42,
        "fatGrams": 28,
        "ingredients": [
          {
            "name": "Chicken Breast",
            "quantity": 2,
            "unit": "fillets",
            "aisle": "Meat & Seafood",
            "estimatedCost": 3.5,
            "icon": "🍗"
          }
        ],
        "instructions": ["Step 1...", "Step 2..."],
        "dietaryTags": ["Gluten-Free"],
        "allergens": ["Dairy"],
        "equipmentNeeded": ["Hob Only"],
        "upvotes": 42,
        "downvotes": 1
      }
    ]
  }
  ```

### 3.2 Get Recipe Details
- **Endpoint**: `GET /recipes/:id` (supports MongoDB ObjectId or `slug`)
- **Auth**: Public
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": { ...recipeObject }
  }
  ```

### 3.3 Toggle Favorite
- **Endpoint**: `POST /recipes/:id/favorite`
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "isFavorited": true,
    "favorites": ["664fa8a..."]
  }
  ```

### 3.4 Community Reaction (Upvote/Downvote)
- **Endpoint**: `POST /recipes/:id/reaction`
- **Auth**: Public
- **Request Body**: `{ "type": "up" }` or `{ "type": "down" }`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "upvotes": 43,
    "downvotes": 1
  }
  ```

---

## 4. Weekly Meal Plan Endpoints

### 4.1 Get Current Weekly Plan
- **Endpoint**: `GET /plan/current`
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "664fac0...",
      "user": "664fa9c...",
      "weekStartDate": "2026-10-23T00:00:00.000Z",
      "dinners": [
        {
          "day": "Monday",
          "recipe": { ...populatedRecipeObject },
          "isCooked": false
        }
      ],
      "householdSize": 2,
      "estimatedCost": 38.5,
      "budgetLimit": 40
    }
  }
  ```

### 4.2 Regenerate Weekly Plan
- **Endpoint**: `POST /plan/generate`
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": { ...populatedPlanObject },
    "message": "Plan regenerated successfully"
  }
  ```

### 4.3 Swap Single Dinner Meal
- **Endpoint**: `PUT /plan/swap-meal`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "day": "Wednesday",
    "targetRecipeId": "optional-specific-recipe-id"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": { ...updatedPlanObject },
    "message": "Dinner for Wednesday swapped!"
  }
  ```

### 4.4 Toggle Dinner Cooked Status
- **Endpoint**: `PATCH /plan/dinners/:day/cooked`
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": { ...updatedPlanObject }
  }
  ```

---

## 5. Consolidated Shopping List Endpoints

### 5.1 Get Active Shopping List
- **Endpoint**: `GET /shopping-list`
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "664fac5...",
      "user": "664fa9c...",
      "plan": "664fac0...",
      "supermarket": "Aldi",
      "totalEstimatedCost": 36.4,
      "itemsBoughtCount": 3,
      "totalItemsCount": 18,
      "items": [
        {
          "id": "item_0_chicken_breast",
          "name": "Chicken Breast",
          "totalQuantity": 4,
          "unit": "fillets",
          "aisle": "Meat & Seafood",
          "estimatedCost": 7.0,
          "isBought": false,
          "recipeTitles": ["Creamy Tuscan Garlic Chicken", "Chicken Fajitas"],
          "icon": "🍗"
        }
      ]
    }
  }
  ```

### 5.2 Toggle Shopping Item Checkoff
- **Endpoint**: `PATCH /shopping-list/item/:itemId`
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": { ...updatedShoppingListObject }
  }
  ```

### 5.3 Reset Checklist
- **Endpoint**: `POST /shopping-list/reset`
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": { ...resetShoppingListObject },
    "message": "All items marked as unbought"
  }
  ```

---

## 6. Subscriptions & Billing Endpoints

### 6.1 Get Subscription Status
- **Endpoint**: `GET /subscriptions/status`
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "tier": "free",
      "status": "trial",
      "isActive": false,
      "planDetails": {
        "name": "Mise Starter (Trial)",
        "billingPeriod": "Monthly",
        "price": "Free Trial",
        "features": [
          "Unlimited weekly dinner planning",
          "Smart consolidated supermarket shopping list",
          "Full dietary and allergy safety filters"
        ]
      }
    }
  }
  ```

### 6.2 Mock Subscription Upgrade
- **Endpoint**: `POST /subscriptions/mock-upgrade`
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "tier": "pro",
      "status": "active"
    },
    "message": "Subscription tier switched to PRO"
  }
  ```

### 6.3 Billing Webhook
- **Endpoint**: `POST /subscriptions/webhook`
- **Auth**: Signature verified (Stripe / App Store)
- **Response `200 OK`**:
  ```json
  {
    "received": true,
    "message": "Webhook event processed"
  }
  ```

---

## 7. AI Endpoints (Google Gemini Integration)

### 7.1 Leftover Recipe Generator
- **Endpoint**: `POST /ai/leftover-recipe`
- **Auth**: Required (`authenticate`)
- **Rate Limit**: 15 requests / 10 minutes (`aiLimiter`)
- **Quota**: 5 generations/week for Free tier, 50 generations/week for Pro tier
- **Request Body**:
  ```json
  {
    "ingredients": ["tomatoes", "garlic", "pasta", "olive oil"],
    "maxTimeMinutes": 30,
    "additionalNotes": "Kid-friendly dinner"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "recipe": {
        "title": "Rustic Tomato Garlic Pasta",
        "slug": "rustic-tomato-garlic-pasta",
        "description": "A quick and fragrant pasta dinner.",
        "cuisine": "Italian",
        "vibes": ["Speedy Meals", "Family Favs"],
        "prepTimeMinutes": 10,
        "cookTimeMinutes": 15,
        "servings": 2,
        "calories": 420,
        "carbsGrams": 65,
        "proteinGrams": 12,
        "fatGrams": 14,
        "ingredients": [
          {
            "name": "pasta",
            "quantity": 200,
            "unit": "g",
            "aisle": "Pantry & Dry Goods",
            "estimatedCost": 1.2
          }
        ],
        "instructions": ["Boil pasta...", "Saute garlic and tomatoes..."],
        "dietaryTags": ["Vegetarian"],
        "allergens": ["Gluten"],
        "equipmentNeeded": ["Hob Only"]
      },
      "isAiGenerated": true,
      "fallback": false
    }
  }
  ```
- **Error Response `403 Forbidden`** (Quota Exceeded):
  ```json
  {
    "success": false,
    "error": "You have reached your weekly AI generation limit (5/5). Upgrade to Pro for 50 AI generations/week.",
    "code": "UPGRADE_REQUIRED"
  }
  ```

### 7.2 Meal Plan Intent Parser
- **Endpoint**: `POST /ai/plan-intent`
- **Auth**: Required (`authenticate`)
- **Rate Limit**: 15 requests / 10 minutes (`aiLimiter`)
- **Quota**: 5 generations/week for Free tier, 50 generations/week for Pro tier
- **Request Body**:
  ```json
  {
    "prompt": "I want high protein Mediterranean dinners from Monday to Wednesday, and quick comfort food on Thursday and Friday"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "plan": {
        "_id": "664fa9c...",
        "user": "664fa9c...",
        "householdSize": 2,
        "estimatedCost": 42.50,
        "dinners": [...],
        "meals": [...]
      },
      "summary": "Tailored high protein Mediterranean meals early in the week with quick comfort favorites for the weekend.",
      "isAiGenerated": true,
      "fallback": false
    }
  }
  ```
