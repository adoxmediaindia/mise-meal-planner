# Mise Meal Planner — Comprehensive Implementation Plan

This implementation plan outlines the engineering roadmap to reconstruct Mise Meal Planner as a production-grade full-stack MERN application with complete design fidelity, robust backend architecture, database persistence, and end-to-end verification.

---

## 1. Project Architecture & Directory Layout

A unified, modular monorepo structure will be established:

```
MEAL PLANNER/
├── client/                     # Frontend (React + Vite + TypeScript)
│   ├── public/                 # Static assets, logos, screenshots, favicon
│   │   ├── assets/             # Mise logo, phone frames, screenshots
│   │   └── locales/            # i18n JSON files (en.json, de.json, fr.json, nl.json)
│   ├── src/
│   │   ├── assets/             # Bundled SVGs and images
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Button, StoreBadge, PhoneFrame, Modal, Pill, Toast
│   │   │   ├── marketing/      # Nav, Hero, Marquee, Stats, Steps, Showcase, Features, Vibes, Gallery, Reviews, FAQ, Footer
│   │   │   └── app/            # AppNav, DayCard, RecipeModal, ShoppingListAisle, VibePicker, AllergiesSelector
│   │   ├── context/            # AuthContext, LanguageContext, PlanContext, ToastContext
│   │   ├── hooks/              # useAuth, useI18n, usePlan, useShoppingList
│   │   ├── pages/              # Page views
│   │   │   ├── marketing/      # Home, Support, Privacy, Terms
│   │   │   ├── auth/           # Login, Register
│   │   │   └── app/            # PlanOverview, RecipeDetail, Explore, Favourites, Preferences, GroceryList, Settings
│   │   ├── services/           # Axios/Fetch API client wrappers
│   │   ├── types/              # TypeScript models (User, Recipe, MealPlan, ShoppingList, Preferences)
│   │   ├── utils/              # Ingredient merger, cost calculator, formatters
│   │   ├── styles/             # Tailwind & CSS custom design tokens
│   │   ├── App.tsx             # Root router configuration
│   │   └── main.tsx            # Entry point
│   ├── index.html              # HTML template with meta tags & Google fonts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                     # Backend (Node.js + Express + TypeScript + Mongoose)
│   ├── src/
│   │   ├── config/             # Environment variables, database connection
│   │   ├── controllers/        # Auth, User, Recipe, Plan, ShoppingList, Subscription
│   │   ├── middleware/         # Auth guard (JWT cookie), rate limiter, validator, errorHandler
│   │   ├── models/             # Mongoose schemas (User, Recipe, Preference, MealPlan, ShoppingList)
│   │   ├── routes/             # REST API routing modules (/api/v1/...)
│   │   ├── seeds/              # High-quality seed recipe dataset & supermarket catalog
│   │   ├── services/           # Deterministic meal planner engine, shopping list merger
│   │   ├── types/              # Server-side TypeScript interfaces
│   │   ├── utils/              # Token generation, password hasher, logger
│   │   └── index.ts            # Express server initialization
│   ├── tests/                  # Supertest API endpoint tests
│   ├── package.json
│   └── tsconfig.json
├── docs/                       # Specifications and audits
│   ├── routes.md
│   ├── feature-inventory.md
│   ├── design-system.md
│   ├── interaction-matrix.md
│   └── implementation-plan.md
└── package.json                # Root package scripts (concurrently dev, build, test)
```

---

## 2. Phase-by-Phase Execution Roadmap

### Phase 1: Audit & Foundation (Completed)
- [x] Inspect reference website (`https://misemealplanner.com/`) HTML, CSS, client scripts, locales, screenshots, and legal terms.
- [x] Extract all design tokens, font families, color palettes, and animation keyframes.
- [x] Create `routes.md`, `feature-inventory.md`, `design-system.md`, `interaction-matrix.md`, and `implementation-plan.md`.

### Phase 2: Public Website Reconstruction
1. **Vite + React + Tailwind + TypeScript Workspace Setup**:
   - Initialize `client` application.
   - Configure Tailwind CSS with audited design tokens (`--bg`, `--primary`, `--phone-frame`, `--radius-card`, serif/sans fonts).
   - Setup React Router with root routes (`/`, `/support`, `/privacy`, `/terms`).
2. **Assets & i18n Engine**:
   - Copy brand assets, high-res phone screenshots, and SVG store badges.
   - Implement `LanguageProvider` with `en`, `de`, `fr`, and `nl` translations matching `i18n.js`.
3. **Marketing Page Components**:
   - **Sticky Nav**: Brand logo, anchor navigation, language selector dropdown, mobile hamburger drawer.
   - **Hero Section**: Eyebrow badge, Georgia serif header with green accent, store badges, star rating trust badge, 3-phone perspective mockups with CSS float keyframe.
   - **Supermarket Marquee**: CSS infinite scrolling ticker with 11 retailers.
   - **Stats Section**: 4 stat cards with Georgia numbers and responsive grid.
   - **How It Works**: 4-step process cards with rounded step numbers.
   - **Showcase A & B**: Split columns with phone mockups and checkmark lists.
   - **Features Grid**: 9 features with distinct pastel icon backgrounds.
   - **Meal Vibes Section**: 8 colored cards with emojis and hover lift/tilt.
   - **Gallery Section**: Horizontal scroll snap container with 6 phone screens.
   - **Reviews Section**: 6 customer review cards with star ratings and user initials.
   - **Accordion FAQ**: Expandable questions with rotating `+` icon and privacy link.
   - **CTA Banner**: Gradient banner card with decorative blurred blobs and store badges.
   - **Footer**: 4-column footer with about text, navigation columns, copyright, and UK badge.
4. **Informational & Legal Pages**:
   - `/support`: Customer support cards, email link, common questions, allergy notice.
   - `/privacy`: Full GDPR data controller terms.
   - `/terms`: Complete Terms of Service with Section 4 allergy disclaimer.

### Phase 3: Backend API Architecture & Database
1. **Express + TypeScript + Mongoose Setup**:
   - Initialize `server` module with strict TypeScript compilation.
   - Configure MongoDB connection with retry logic and environment variables (`.env`).
   - Setup security middlewares: `helmet`, `cors` (with credentials), `cookie-parser`, `express-rate-limit`.
2. **Mongoose Database Schemas**:
   - `User`: Name, email (unique index), passwordHash, role, subscriptionTier (`trial`, `active`, `cancelled`), createdAt.
   - `Preference`: UserId (indexed), supermarket, householdSize, cookingDays, weeklyBudget, dietaryNeeds, allergies, kitchenEquipment, vibes.
   - `Recipe`: Title, slug, description, image, cuisine, vibes, prepTimeMinutes, cookTimeMinutes, servings, calories, carbs, protein, fat, ingredients (name, quantity, unit, aisle), instructions, dietaryTags, allergens.
   - `MealPlan`: UserId (indexed), weekStartDate, dinners (array of { day, recipeId, isCooked }), totalEstimatedCost, status.
   - `ShoppingList`: UserId (indexed), planId, items (array of { name, quantity, unit, aisle, isBought, sourceRecipes }).
3. **Authentication Module**:
   - Register, Login, Me, Logout endpoints.
   - Password hashing with `bcryptjs`.
   - JWT token stored in secure, `httpOnly`, `sameSite: 'lax'` cookie.
   - Zod request validation middleware.
4. **Recipe Engine & Deterministic Planner**:
   - Seed database with 30+ complete recipes spanning all cuisines and vibes.
   - Deterministic planning algorithm:
     - Input: Active user preferences (cooking days, household size, vibes, budget, allergens).
     - Filter out any recipe where `recipe.allergens` overlaps with `user.allergies`.
     - Filter for `recipe.dietaryTags` matching user diet (e.g. Vegetarian).
     - Prioritize recipes matching user's selected vibes.
     - Match total recipes to selected cooking days.
     - Optimize for ingredient overlap to minimize grocery waste.
5. **Shopping List Aggregation Engine**:
   - Merge duplicate ingredients across recipes in the active weekly plan.
   - Group into supermarket aisles.
   - Persist checked/bought status.

### Phase 4: Full Application Frontend Implementation
1. **Auth & Onboarding**:
   - `/auth/login` and `/auth/register` with form validation and error handling.
   - `/onboarding` step wizard: Supermarket choice -> Household size -> Cooking days -> Budget -> Diet & Allergies -> Equipment -> Vibes.
2. **Weekly Plan Dashboard (`/app/plan`)**:
   - Header with greeting and budget vs cost meter.
   - Shortcut grocery card showing "X / Y items bought".
   - Day-by-day dinner cards matching `plan-overview.png`.
   - Single meal swap modal and regenerate whole week plan button.
3. **Recipe Detail (`/app/recipes/:id`)**:
   - Hero banner with floating back and favorite heart.
   - Nutrition summary card (Kcal, Time, Servings, Macros).
   - Thumbs up / down feedback controls.
   - Prominent allergy safety warning.
   - Ingredients list with emoji icons and scaled quantities.
   - Cooking instructions steps.
4. **Smart Grocery List (`/app/grocery-list`)**:
   - Consolidated items grouped by aisle.
   - Interactive checkbox with strikethrough animation.
   - Progress bar (`X / Y items bought`).
   - "Copy list to clipboard" and "Reset all" actions.
5. **Explore & Favorites (`/app/explore` and `/app/favourites`)**:
   - Browse by cuisine cards matching `explore-by-cuisine.png`.
   - Filter by vibes and search keyword.
   - Saved recipes view with quick swap into plan.
6. **Preferences & Settings (`/app/preferences` & `/app/settings`)**:
   - Live preference controls matching `preferences-setup.png` and `preferences-vibes.png`.
   - Simulated subscription management with toggleable tiers.

### Phase 5: Verification, Testing & Quality Assurance
1. **Automated Unit & Integration Tests**:
   - Vitest for frontend components and ingredient merger logic.
   - Supertest for backend auth, recipe filtering, and allergy exclusion tests.
2. **Strict Allergy Exclusion Testing**:
   - Unit test asserting that when `Peanuts` or `Gluten` is selected as an allergy, zero recipes containing those allergens are returned in meal plan generation or recipe suggestions.
3. **Responsive Visual Verification**:
   - Test desktop (1280px), tablet (768px), and mobile (375px) viewports.
   - Verify layout matching reference screenshots.
4. **Build & Production Check**:
   - Full TypeScript compile (`tsc --noEmit`).
   - Vite production bundle build (`npm run build`).
   - Express backend production build.
