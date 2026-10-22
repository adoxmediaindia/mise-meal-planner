# Mise Meal Planner — Full-Stack MERN Reconstruction

A production-grade, full-stack MERN (MongoDB, Express.js, React.js, Node.js) reconstruction of the [Mise Meal Planner](https://misemealplanner.com/) web and mobile application.

---

## 1. Project Overview & Architecture

Mise is a meal planner for weekly dinners, recipes, meal prep, and smart consolidated grocery shopping tailored to budget and supermarket selection.

This repository contains a full monorepo implementation:
- **Client (`/client`)**: React 18 with Vite, TypeScript, React Router 7, Tailwind CSS, Lucide icons, multi-language i18n support (`en`, `de`, `fr`, `nl`), accessible form controls, and mobile device-frame preview modes.
- **Server (`/server`)**: Node.js with Express.js, TypeScript, Mongoose ODM, JWT authentication using secure `httpOnly` cookie sessions, rate limiting, and Zod schema validation.
- **Database (MongoDB)**: Normalized schemas for Users, Preferences, Recipes, Meal Plans, and Shopping Lists with compound indexing and strict backend allergen exclusion queries.
- **Specifications (`/docs`)**: Phase 1 audit deliverables (`routes.md`, `feature-inventory.md`, `design-system.md`, `interaction-matrix.md`, `implementation-plan.md`).

---

## 2. Tech Stack

### Frontend:
- **Framework**: React.js 18 with Vite 6 & TypeScript 5
- **Routing**: React Router 7 (`react-router-dom`)
- **Styling**: Tailwind CSS 3 & Modular CSS with exact audited design tokens
- **Icons**: Lucide React
- **Animations**: CSS keyframe animations matching reference (`float`, `marquee`, `fadeIn`, `scaleUp`)
- **Testing**: Vitest, React Testing Library, `@testing-library/jest-dom`, JSDOM

### Backend:
- **Runtime**: Node.js v22+
- **Server**: Express.js 4 with TypeScript
- **Database**: MongoDB 8+ with Mongoose 8
- **Authentication**: JSON Web Tokens (JWT) stored in HTTP-only, SameSite cookies
- **Security**: Helmet, CORS with credentials, bcryptjs password hashing, Express Rate Limiter
- **Validation**: Zod runtime schema validation
- **Testing**: Vitest & Supertest

---

## 3. Environment Variables

Create `.env` in `server/` (or copy from `.env.example`):

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/mise_meal_planner

# Authentication
JWT_SECRET=mise_meal_planner_jwt_secret_dev_key_2026

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

---

## 4. Database Models & Schema Design

| Model | Schema Fields & Types | Key Indexes | Description |
|---|---|---|---|
| `User` | `name: string`<br>`email: string`<br>`password: string` (bcrypt)<br>`subscriptionTier: 'free' \| 'pro'`<br>`subscriptionStatus: 'active' \| 'trial'`<br>`favorites: ObjectId[]` | `email` (unique) | Manages authentication credentials, user state, and saved favorite recipes. |
| `Preference` | `user: ObjectId`<br>`supermarket: Supermarket`<br>`householdSize: number`<br>`cookingDays: DayOfWeek[]`<br>`weeklyBudget: number`<br>`dietaryNeeds: DietaryNeed[]`<br>`allergies: Allergen[]`<br>`equipment: KitchenEquipment[]`<br>`vibes: MealVibe[]` | `user` (unique) | Houses the user's primary supermarket, cooking days, allergy filters, and kitchen equipment. |
| `Recipe` | `title: string`<br>`slug: string`<br>`description: string`<br>`image: string`<br>`cuisine: Cuisine`<br>`vibes: MealVibe[]`<br>`prepTimeMinutes: number`<br>`cookTimeMinutes: number`<br>`servings: number`<br>`calories: number`<br>`carbsGrams: number`<br>`proteinGrams: number`<br>`fatGrams: number`<br>`ingredients: Ingredient[]`<br>`instructions: string[]`<br>`dietaryTags: DietaryNeed[]`<br>`allergens: Allergen[]`<br>`equipmentNeeded: KitchenEquipment[]` | `slug` (unique)<br>`cuisine: 1`<br>`vibes: 1`<br>`dietaryTags: 1`<br>`allergens: 1` | Verified recipe catalog with macros, ingredients, steps, and explicit allergen declarations. |
| `MealPlan` | `user: ObjectId`<br>`weekStartDate: Date`<br>`dinners: { day, recipe, isCooked }[]`<br>`householdSize: number`<br>`estimatedCost: number`<br>`budgetLimit: number` | `user: 1` | Active weekly dinner plan assigned to user-selected cooking days. |
| `ShoppingList` | `user: ObjectId`<br>`plan: ObjectId`<br>`supermarket: Supermarket`<br>`items: ShoppingItem[]`<br>`totalEstimatedCost: number`<br>`itemsBoughtCount: number`<br>`totalItemsCount: number` | `user: 1` | Deduplicated and consolidated supermarket shopping list grouped by aisle. |

---

## 5. REST API Documentation (`/api/v1`)

### Authentication & Users
- `POST /api/v1/auth/register` — Create a new account with default preferences and plan.
- `POST /api/v1/auth/login` — Sign in and receive secure HTTP-only session cookie.
- `GET /api/v1/auth/me` — Retrieve current authenticated user profile and favorites.
- `POST /api/v1/auth/logout` — Clear session cookie.

### Preferences
- `GET /api/v1/preferences` — Get active user kitchen preferences.
- `PUT /api/v1/preferences` — Update supermarket, household size, cooking days, budget, diet, allergies, and vibes. Optional `autoRegenerate: true`.

### Recipes
- `GET /api/v1/recipes` — List recipes with optional query filters (`cuisine`, `vibe`, `dietary`, `search`, `limit`).
- `GET /api/v1/recipes/:id` — Retrieve single recipe by MongoDB ID or slug.
- `POST /api/v1/recipes/:id/favorite` — Toggle recipe bookmark for current user.
- `POST /api/v1/recipes/:id/reaction` — Submit feedback reaction (`{ type: 'up' | 'down' }`).

### Meal Planning & Swapping
- `GET /api/v1/plan/current` — Get current weekly meal plan with populated recipe details.
- `POST /api/v1/plan/generate` — Deterministically regenerate a full week plan respecting active allergy exclusions and selected cooking days.
- `PUT /api/v1/plan/swap-meal` — Swap a single day's meal with a compliant alternative.
- `PATCH /api/v1/plan/dinners/:day/cooked` — Toggle cooked status for a planned dinner.

### Smart Shopping List
- `GET /api/v1/shopping-list` — Get consolidated grocery list grouped by supermarket aisle.
- `PATCH /api/v1/shopping-list/item/:itemId` — Toggle checked/bought status of a grocery item.
- `POST /api/v1/shopping-list/reset` — Reset all items to unbought.

### Subscriptions (Simulation)
- `GET /api/v1/subscriptions/status` — Get tier and feature access.
- `POST /api/v1/subscriptions/mock-upgrade` — Toggle between Free and Pro Chef membership tiers.

---

## 6. Setup & Running Instructions

### Prerequisites
- Node.js v20+
- MongoDB running on `mongodb://127.0.0.1:27017`

### 1. Install All Dependencies
```bash
npm install
```

### 2. Seed the Database
Populates 12+ recipes across all 6 cuisines and 8 vibes, and creates the demo chef user account:
```bash
npm run seed --workspace=server
```

**Demo Account Credentials**:
- **Email**: `chef@misemealplanner.com`
- **Password**: `Password123!`

### 3. Run Development Servers
Runs both Express backend (`http://localhost:5000`) and Vite frontend (`http://localhost:5173`):
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 7. Test Results & Verification

### Automated Backend Tests (`server/tests/api.test.ts`)
```bash
npm run test --workspace=server
```
- **Health Check (`GET /api/health`)**: Verified 200 OK.
- **Registration & JWT Cookie**: Verified user creation and secure cookie emission.
- **Login Verification**: Verified password comparison with bcrypt.
- **Strict Allergy Exclusion**: Verified that setting an allergen (e.g. `Peanuts`) strictly excludes any recipe containing that allergen using `$nin` queries.
- **Ingredient Deduplication**: Verified that identical ingredients across planned dinners (e.g., Garlic across multiple dishes) are merged into a single item with scaled quantities.
- **Shopping Item Toggle**: Verified updating item bought state persists in MongoDB.

### Automated Frontend Tests (`client/src/__tests__/app.test.tsx`)
```bash
npm run test --workspace=client
```
- **Mandatory Allergy Disclaimer Banner**: Verified rendering and Terms link.
- **Button Component**: Verified primary styles and loading spinner states.
- **Store Badges**: Verified App Store & Google Play badge accessibility.
- **Marketing Stats Section**: Verified 4-card metric display and locale strings.

---

## 8. Verified Features vs Blocked & Missing Credentials

### Verified and Fully Operational:
- Public Marketing Landing page (`/`) with exact typography, supermarket marquee, 3-phone perspective mockups, and reviews.
- Multi-language switching (`en`, `de`, `fr`, `nl`) with live locale dictionaries.
- Information pages: Support (`/support`), Privacy Policy (`/privacy`), Terms of Service (`/terms`).
- Full authentication cycle (Register, Login with 1-Click Demo Chef, Logout, Protected routes).
- 4-step onboarding wizard for new cooks.
- Weekly dinner plan dashboard matching reference screenshots (`plan-overview.png`).
- 1-tap single meal swapping and full-week plan regeneration.
- Recipe detail view matching reference screenshots (`recipe-detail.png` & `spaghetti-bolognese-recipe-detail.png`).
- Smart grocery list with aisle grouping, ingredient merging, and copy-to-clipboard.
- Explore by cuisine catalog matching `explore-by-cuisine.png`.
- User preferences hub matching `preferences-setup.png` and `preferences-vibes.png`.

### Blocked Features / Missing Credentials:
- **Apple StoreKit & Google Play In-App Purchase Receipts**: Third-party mobile app store APIs require iOS/Android native app wrapping and developer team keys. Implemented as a high-fidelity mock subscription manager in `/app/settings`.
- **Live Supermarket Inventory Scraping**: Live retailer APIs (e.g. Kroger Developer API) require merchant partner contracts. Implemented as deterministic, supermarket-specific grocery cost multipliers calibrated for Aldi, Walmart, Kroger, Whole Foods, etc.

---

## 9. Food Safety & Mandatory Allergen Disclaimer

As specified in Section 4 of the Mise Terms of Service:
> *Mise is a meal-planning tool, not an allergen-safety certification service. Automated recommendations can contain mistakes or formulation changes. Always independently inspect packaging labels, manufacturer allergen warnings, and avoid allergen cross-contact. An allergy setting or the absence of an allergen warning does not guarantee safety.*
