# Mise Meal Planner — Routes Specification

This document details all routes for both the public marketing website and the full-stack web application reconstruction. Every route lists its path, layout, access level, data requirements, and verification status.

---

## 1. Public Marketing Website Routes

| Route | Page Title | Access Level | Description & Key Sections | Verification Status |
|---|---|---|---|---|
| `/` | `mise · Meal Planner App \| Weekly Meal Plans, Recipes & Meal Prep` | Public | **Homepage**: Sticky Nav with logo & menu links, Hero with 3-phone showcase & CTA badges, Supermarket Marquee, 4 Stats cards, How It Works (4 steps), Showcase A (Personalisation), Showcase B (Normal food recipes), Features Grid (9 features), Meal Vibes (8 vibes), Screenshot Gallery (6 app screens), Testimonials/Reviews (6 reviews), Accordion FAQ (6 questions), Bottom CTA Banner, 4-column Footer with copyright. | **Verified** (from live site HTML, CSS, assets, & i18n locales) |
| `/support` | `Support · mise meal planner` | Public | **Customer Support Page**: Nav, Hero "We're here to help", Contact Card (`support@misemealplanner.com`), Common questions (Changing meal plan, Shopping list mechanics, App Store/Google Play subscription management, Account/data deletion, Allergy disclaimer), Footer. | **Verified** (from live site HTML & CSS) |
| `/privacy` | `Privacy Policy · mise meal planner` | Public | **Privacy Policy Page**: Legal notice by TEGS LABS LTD, Information collected (name, email, diet preferences, allergies, supermarket, kitchen kit), How data is used, Legal basis (UK GDPR), Meal planning accuracy disclaimer, Security & retention. | **Verified** (from live site HTML & CSS) |
| `/terms` | `Terms of Service · Mise` | Public | **Terms of Service Page**: Legal agreement, accounts, permitted use, **Section 4: Allergies, dietary requirements, and food safety limitations** (mandatory disclaimer that outputs are software-generated and not certified allergen-safe), Subscription billing & cancellations, governing law. | **Verified** (from live site HTML & CSS) |

---

## 2. Authentication & Onboarding Routes

| Route | Page Title | Access Level | Description & Key Sections | Verification Status |
|---|---|---|---|---|
| `/auth/login` | `Sign In · mise` | Public / Guest Only | Email and password sign-in form with "Remember Me", validation errors, demo account quick-fill, link to registration, password reset placeholder. | **Verified flow** (standardized for reconstructed web app) |
| `/auth/register` | `Create Account · mise` | Public / Guest Only | Name, email, password, confirm password, acceptance checkbox for Terms and Privacy Policy. Directs to Onboarding upon creation. | **Verified flow** (in line with GDPR privacy policy) |
| `/onboarding` | `Set Up Your Kitchen · mise` | Protected (Authenticated) | Multi-step onboarding wizard for new users: <br>1. Select Primary Supermarket<br>2. Household Size (counter)<br>3. Cooking Days selection (Mon-Sun pills)<br>4. Weekly Target Budget<br>5. Dietary Needs & Allergies / Exclusions<br>6. Kitchen Equipment selection<br>7. Initial Meal Vibes (up to 3 moods). Completing writes initial preferences and generates Week 1 meal plan. | **Verified from screenshots** (`preferences-setup.png`, `preferences-vibes.png`) |

---

## 3. Application Routes (Protected Dashboard)

All application routes share the responsive mobile-matched viewport container, top status/greeting bar, and the 4-tab bottom navigation (`Plan`, `Explore / Favourites`, `Preferences`, `Settings`), plus desktop-responsive wrapper.

| Route | Page Title | Access Level | Description & Key Sections | Verification Status |
|---|---|---|---|---|
| `/app/plan` | `Weekly Plan · mise` | Protected (User) | **Plan Overview Screen**: Header ("GOOD AFTERNOON, Chef!"), Est. Cost vs Weekly Budget bar with progress fill, "Tap to view Grocery list" shortcut card (items checked/total), Day-by-day dinner cards (Day pill attached to top border, recipe thumbnail, meal title, vibe tag, cooking time, serving count). Actions: Swap single meal, Regenerate whole week plan, Click recipe card to open detail. | **Verified from screenshot** (`plan-overview.png`) |
| `/app/recipes/:id` | `:recipeName · mise` | Protected (User) | **Recipe Detail View**: Hero banner image with floating circular Back button & floating Favorite Heart toggle, Recipe title overlay, Floating nutrition & time summary card (Kcal, Prep/Cook time, Servings, Carbs, Protein, Fat), Thumbs up / Thumbs down feedback buttons, Mandatory Allergy Safety notice, Ingredients list with emoji/icons & exact quantities, Step-by-step cooking instructions, "Swap this recipe into your plan" or "Cook tonight" action. | **Verified from screenshots** (`recipe-detail.png`, `spaghetti-bolognese-recipe-detail.png`) |
| `/app/grocery-list` | `Grocery List · mise` | Protected (User) | **Smart Consolidated Shopping List**: Auto-aggregated ingredients for the current week's chosen recipes. Grouped by supermarket aisle (Produce, Meat & Poultry, Dairy & Eggs, Bakery, Pantry & Spices, Frozen). Interactive check-off boxes, strike-through text, progress counter (`X / Y items bought`), "Copy list to clipboard", "Clear checked" button. | **Verified from app copy & screenshot** (`plan-overview.png` card) |
| `/app/explore` | `Explore Recipes · mise` | Protected (User) | **Explore by Cuisine & Vibes**: Cuisine category grid (Italian, Asian, Mexican, Indian, Mediterranean, British Classics), search filter by keyword or vibe chip, recipe card feed. Allows previewing and swapping recipes directly into any day of the weekly plan. | **Verified from screenshot** (`explore-by-cuisine.png`) |
| `/app/favourites` | `Saved Recipes · mise` | Protected (User) | **User Favorites & Custom Library**: Collection of recipes favorited by the user (heart icon active), with quick button to "Add to Plan" or inspect instructions. | **Verified from bottom tab bar** (`favourites` tab) |
| `/app/preferences` | `Preferences · mise` | Protected (User) | **Preferences Hub**: <br>- Supermarket selector dropdown (Aldi, Walmart, Kroger, Whole Foods, Trader Joe's, etc.)<br>- Household size stepper (`-`, count, `+`)<br>- Cooking days picker (Mon, Tue, Wed, Thu, Fri, Sat, Sun pills)<br>- Meal mood / vibes (Pick up to 3: Speedy Meals, Low Calorie, Family Favs, Healthy Comfort, Fakeaway, Gut Friendly, Protein Packed, British Staples)<br>- Dietary needs & allergen exclusions (None, Vegetarian, Vegan, Pescatarian, Gluten-free, Peanut-free, Dairy-free, etc.)<br>- Kitchen Equipment toggles (Air Fryer, Slow Cooker, Hob only, Oven, etc.). Changes instantly save and prompt to regenerate weekly plan. | **Verified from screenshots** (`preferences-setup.png`, `preferences-vibes.png`) |
| `/app/settings` | `Settings · mise` | Protected (User) | **User Account & Subscription**: User profile (Name, Email), Subscription simulation (Free plan / Pro Plan with status and mock billing toggle), App language switcher (EN, DE, FR, NL), Data Export (JSON), Danger Zone (Clear Plan, Reset All Preferences, Delete Account). | **Verified from bottom tab bar** (`settings` tab) & Terms/Privacy requirements |

---

## 4. Backend REST API Route Structure

All API endpoints reside under `/api/v1` and return standardized JSON responses `{ success: boolean, data?: any, error?: string, message?: string }`.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user account | No |
| `POST` | `/api/v1/auth/login` | Authenticate user, issue secure HTTP-only JWT cookie | No |
| `POST` | `/api/v1/auth/logout` | Clear auth cookie | Yes |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile & subscription | Yes |
| `GET` | `/api/v1/preferences` | Fetch user's active preferences & allergen exclusions | Yes |
| `PUT` | `/api/v1/preferences` | Update supermarket, household size, cooking days, vibes, equipment | Yes |
| `GET` | `/api/v1/recipes` | List recipes with filters (cuisine, vibes, diet, search) | Yes |
| `GET` | `/api/v1/recipes/:id` | Fetch full recipe details including allergens & instructions | Yes |
| `POST` | `/api/v1/recipes/:id/favorite` | Toggle favorite status for recipe | Yes |
| `POST` | `/api/v1/recipes/:id/reaction` | Submit thumbs up / down feedback | Yes |
| `GET` | `/api/v1/plan/current` | Fetch active weekly plan with cost calculation and day assignments | Yes |
| `POST` | `/api/v1/plan/generate` | Deterministically generate a weekly plan based on active preferences & exclusions | Yes |
| `PUT` | `/api/v1/plan/swap-meal` | Swap a single day's recipe with an alternative matching preferences | Yes |
| `GET` | `/api/v1/shopping-list` | Fetch aggregated, merged shopping list for the current week | Yes |
| `PATCH` | `/api/v1/shopping-list/item/:id` | Toggle purchased/checked status of a shopping list item | Yes |
| `POST` | `/api/v1/shopping-list/reset` | Uncheck all items or recalculate from current plan | Yes |
| `GET` | `/api/v1/subscriptions/status` | Get current user's subscription tier | Yes |
| `POST` | `/api/v1/subscriptions/mock-upgrade` | Simulate subscription upgrade/downgrade for testing | Yes |

---

## 5. Verified Behavior vs Assumptions

- **Verified**: The public marketing site consists of a 1-page landing with smooth anchor navigation, plus dedicated `/support`, `/privacy`, and `/terms` subpages.
- **Verified**: Language switching updates text dynamically across 4 locales (`en`, `de`, `fr`, `nl`) without page reloads.
- **Verified**: Mobile app displays a 4-tab bottom navigation (`plan`, `favourites` / `meals`, `preferences`, `settings`).
- **Assumption / Extension for Web Application**: The native mobile app (distributed on iOS App Store & Google Play) uses local secure storage; our reconstruction provisions a complete responsive web application with JWT cookie authentication, MongoDB persistence, and an interactive mobile-frame preview or full-screen mode for desktop.
