# Mise Meal Planner — Architecture Audit & System Inventory

## 1. System Overview

Mise Meal Planner is designed as an all-in-one smart meal planning, automated grocery list generation, and budget optimization platform. The system operates on a **Single Authoritative Backend & Unified Database Architecture**:

```
+-----------------------------------+     +-----------------------------------+
|      Web Client (React + Vite)    |     |  Mobile App (React Native + Expo) |
|  - Desktop / Tablet / Mobile Web  |     |  - iOS & Android native apps      |
|  - Cookie / Bearer Token Auth     |     |  - Expo SecureStore + Bearer Auth |
|  - Hosted on Vercel               |     |  - Distributed via App/Play Store |
+-----------------+-----------------+     +-----------------+-----------------+
                  |                                         |
                  |           HTTPS REST API /api/v1        |
                  +--------------------+--------------------+
                                       |
                     +-----------------+-----------------+
                     |   Shared Backend (Node/Express)   |
                     |   - Single Auth Engine (JWT)      |
                     |   - Deterministic Meal Planner    |
                     |   - Consolidated Grocery Engine   |
                     |   - Ownership & Policy Enforcer   |
                     |   - Hosted on Render Web Service  |
                     +-----------------+-----------------+
                                       |
                     +-----------------+-----------------+
                     |   Shared Database (MongoDB Atlas) |
                     |   - Single Source of Truth        |
                     |   - Users, Plans, Lists, Recipes  |
                     |   - Compound & Unique Indexes     |
                     +-----------------------------------+
```

---

## 2. Authentication & Session Handling Audit

### 2.1 Dual-Client Authentication Strategy
- **Web Browsers**:
  - Authenticates via HTTP-Only, Secure cookies (`mise_token`).
  - `SameSite: 'none'` in production (enables cross-domain requests between Vercel frontend and Render backend) and `SameSite: 'lax'` in local development.
  - Mitigates Cross-Site Scripting (XSS) token extraction.
- **Mobile Clients (React Native / Expo)**:
  - Mobile apps cannot rely reliably on browser cookie jars across domains and network environments.
  - The backend returns the signed JWT in `{ token, user }` upon successful `/register` and `/login`.
  - The mobile client stores this token in hardware-backed secure storage via `expo-secure-store`.
  - All subsequent mobile requests attach the header:
    ```http
    Authorization: Bearer <token>
    ```
- **Unified Middleware (`server/src/middleware/auth.ts`)**:
  - The `authenticate` middleware inspects `req.cookies.mise_token` first; if absent, it checks `req.headers.authorization` for `Bearer <token>`.
  - Decodes and verifies the signature using `process.env.JWT_SECRET`.
  - Injects `req.user = { id, email, subscriptionTier }` into the request pipeline.
  - Fails with `401 Unauthorized` for missing, expired, or tampered tokens.

---

## 3. MongoDB Models & Indexing Audit

| Model | Collection | Primary Keys & Indexes | Constraints & Relations |
| :--- | :--- | :--- | :--- |
| **`User`** | `users` | - `_id` (ObjectId)<br>- `email`: Unique, Lowercase, Indexed | Hashes passwords with `bcryptjs` (salt rounds: 10). Contains `favorites` array referencing `Recipe`. |
| **`Preference`** | `preferences` | - `_id` (ObjectId)<br>- `user`: Unique, Indexed (1:1 with User) | Enforces allowed supermarkets (Aldi, Walmart, Kroger, etc.), household size (1–12), cooking days, dietary needs, allergens. |
| **`Recipe`** | `recipes` | - `_id` (ObjectId)<br>- `slug`: Unique, Indexed<br>- `cuisine`: Indexed<br>- `vibes`: Indexed<br>- `dietaryTags`: Indexed<br>- `allergens`: Indexed | Stores ingredients subdocuments with aisles, quantities, units, costs. Stores step-by-step instructions and macros. |
| **`MealPlan`** | `mealplans` | - `_id` (ObjectId)<br>- `user`: Indexed<br>- `weekStartDate`: Date | Contains `dinners` array with `IDinnerSlot` referencing `Recipe`. Tracks `isCooked` flag per day. |
| **`ShoppingList`** | `shoppinglists` | - `_id` (ObjectId)<br>- `user`: Indexed<br>- `plan`: Ref to MealPlan | Stores aggregated `items` subdocuments with aisle classification, quantities, recipe provenance, and `isBought` checklist state. |

---

## 4. User Ownership & Authorization Audit

All user-specific mutations and data retrieval enforce **zero-trust resource scoping**:
1. **Preferences**:
   - `GET /preferences` -> Reads `Preference.findOne({ user: req.user.id })`.
   - `PUT /preferences` -> Updates only the authenticated user's record.
2. **Meal Plan**:
   - `GET /plan/current` -> Queries `MealPlan.findOne({ user: req.user.id })`.
   - `POST /plan/generate` -> Generates plan for `req.user.id`.
   - `PUT /plan/swap-meal` -> Swaps dinner slot on `req.user.id`'s plan.
   - `PATCH /plan/dinners/:day/cooked` -> Updates dinner slot on `req.user.id`'s plan.
3. **Shopping List**:
   - `GET /shopping-list` -> Reads `ShoppingList.findOne({ user: req.user.id })`.
   - `PATCH /shopping-list/item/:itemId` -> Toggles item only in `req.user.id`'s list.
   - `POST /shopping-list/reset` -> Resets items only in `req.user.id`'s list.
4. **Favorites**:
   - `POST /recipes/:id/favorite` -> Modifies `favorites` on `User.findById(req.user.id)`.

*Conclusion*: No client-provided `userId` parameter is accepted in query params or request bodies for sensitive data access. Privilege escalation and cross-user snooping are completely mitigated.

---

## 5. Production Environment & Infrastructure Configuration

- **CORS**:
  Configured dynamically in `server/src/index.ts` to support:
  - Local development: `http://localhost:5173`, `http://127.0.0.1:5173`
  - Vercel production and preview deployments: `*.vercel.app`
  - Custom domain or explicit URL specified in `process.env.CLIENT_URL`
  - Native mobile apps (requests originating without browser `Origin` headers are permitted).
- **Security Headers & Rate Limiting**:
  - `helmet`: Enforces secure HTTP headers.
  - `express-rate-limit`: Protects `/api/v1/auth/login` and `/api/v1/auth/register` (max 100 requests per 15-minute window).
- **Database Connection**:
  - Connects securely via Mongoose with connection pooling and graceful error logging.
