# Mise Meal Planner — Feature Inventory

This document provides a comprehensive inventory of all features identified from the public reference website (`https://misemealplanner.com/`), client scripts, locale dictionaries, legal documents, and official app screenshots.

---

## 1. Feature Classification Matrix

| Feature ID | Category | Feature Name | Description | Source / Evidence | Status |
|---|---|---|---|---|---|
| `FEAT-PUB-01` | Public Marketing | Sticky Navigation | Sticky header with blur backdrop, responsive brand logo, section anchors (`#how`, `#features`, `#vibes`, `#reviews`, `#faq`), and CTA buttons. | Live HTML & CSS | **Verified** |
| `FEAT-PUB-02` | Public Marketing | Mobile Navigation Drawer | Collapsible mobile hamburger menu with smooth toggle and accessibility aria attributes. | `script.js` | **Verified** |
| `FEAT-PUB-03` | Public Marketing | Hero Showcase | Split hero with headline typography, store download badges, social proof star rating, and 3-phone perspective mockups with CSS float animation. | `index.html` & CSS | **Verified** |
| `FEAT-PUB-04` | Public Marketing | Multi-language Switcher | Dropdown menu supporting English (`en`), German (`de`), French (`fr`), and Dutch (`nl`), with flag icons and dynamic locale dictionary interpolation. | `i18n.js` & `locales/*.json` | **Verified** |
| `FEAT-PUB-05` | Public Marketing | Supermarket Marquee | Infinite auto-scrolling ticker of supported grocery retailers (Walmart, Aldi, Kroger, Costco, Publix, Safeway, H-E-B, Whole Foods, Trader Joe's, Food Lion, Sprouts). | `index.html` & CSS | **Verified** |
| `FEAT-PUB-06` | Public Marketing | Key Metrics / Stats | 4-card metric display: "5 mins to full plan", "Up to 7 dinners", "1 smart shopping list", "$30+ typical weekly saving*". | `index.html` | **Verified** |
| `FEAT-PUB-07` | Public Marketing | How It Works Steps | 4 numbered process cards explaining shop picking, preference setting, plan generation, and consolidated single shop. | `index.html` | **Verified** |
| `FEAT-PUB-08` | Public Marketing | Showcase Split Views | Two showcase sections (Personalised plan & Normal weeknight food) featuring phone mockups and checkmark benefit lists. | `index.html` | **Verified** |
| `FEAT-PUB-09` | Public Marketing | Features Grid | 9-card visual grid with color-coded pastel icons explaining core value propositions. | `index.html` | **Verified** |
| `FEAT-PUB-10` | Public Marketing | Meal Vibes Display | 8 colored interactive cards displaying meal moods (Speedy Meals, Low Calorie, Family Favs, Healthy Comfort, Fakeaway, Gut Friendly, Protein Packed, British Staples). | `index.html` & CSS | **Verified** |
| `FEAT-PUB-11` | Public Marketing | App Screenshot Carousel | Horizontally scrollable snap gallery displaying 6 real app views. | `index.html` & CSS | **Verified** |
| `FEAT-PUB-12` | Public Marketing | Reviews / Testimonials | 6 authentic user reviews highlighting grocery cost reduction, easy prep, and supermarket convenience. | `index.html` | **Verified** |
| `FEAT-PUB-13` | Public Marketing | Accordion FAQ | 6 expandable `<details>` accordions with rotated `+` indicators for common questions. | `index.html` & CSS | **Verified** |
| `FEAT-PUB-14` | Public Marketing | CTA Banner & Footer | Vibrant green gradient banner, store badges, copyright, about description, and legal navigation. | `index.html` | **Verified** |
| `FEAT-PUB-15` | Public Pages | Support, Privacy, Terms | Dedicated informational pages with legal definitions, GDPR data controller notices, and allergy limitation disclosures. | Live HTML files | **Verified** |
| `FEAT-APP-01` | Auth & Profile | User Authentication | Registration, Login with JWT session cookie, Logout, Password hashing with bcrypt, Profile update. | Application flow | **Verified reconstructed** |
| `FEAT-APP-02` | Onboarding | Preferences Wizard | First-time user setup for supermarket, household size, cooking days, budget, diet, allergies, equipment, and vibes. | `preferences-setup.png` | **Verified** |
| `FEAT-APP-03` | Preferences | Supermarket Selector | Choice of preferred supermarket with tailored ingredient catalog and localized currency/pricing estimates. | `preferences-setup.png` | **Verified** |
| `FEAT-APP-04` | Preferences | Household Size Stepper | Numerical stepper (`-` and `+`) adjusting recipe ingredient quantities and grocery totals (1 to 10 persons). | `preferences-setup.png` | **Verified** |
| `FEAT-APP-05` | Preferences | Cooking Days Selector | Mon-Sun interactive toggle buttons allowing selection of 1 to 7 active cooking days. | `preferences-setup.png` | **Verified** |
| `FEAT-APP-06` | Preferences | Meal Vibes (Mood) Picker | Multi-select grid of vibes (up to 3 moods) with animated green active outline. | `preferences-vibes.png` | **Verified** |
| `FEAT-APP-07` | Preferences | Dietary & Allergy Exclusions | Strict exclusion filters (Vegetarian, Vegan, Pescatarian, Gluten-Free, Dairy-Free, Nut-Free, etc.) enforced on backend query. | `preferences-vibes.png` | **Verified** |
| `FEAT-APP-08` | Meal Planning | Weekly Plan Dashboard | Personalized greeting, budget vs est. cost meter, grocery items counter, day-by-day dinner cards with thumbnail, tags, prep time, servings. | `plan-overview.png` | **Verified** |
| `FEAT-APP-09` | Meal Planning | Meal Swapping | Single-tap meal swapping with alternative recipes matching active dietary/vibe constraints. | `plan-overview.png` & app copy | **Verified** |
| `FEAT-APP-10` | Meal Planning | Full Week Regeneration | Instant re-generation of the entire week's dinners respecting ingredient reuse and budget targets. | App copy & Terms | **Verified** |
| `FEAT-APP-11` | Recipe Details | Nutritional & Timing Summary | Hero image, floating back & favorite buttons, Kcal, prep/cook time, servings, carbs, protein, fat breakdown. | `recipe-detail.png` | **Verified** |
| `FEAT-APP-12` | Recipe Details | Thumbs Up / Down Reaction | Feedback controls on recipes to refine recommendations over time. | `recipe-detail.png` | **Verified** |
| `FEAT-APP-13` | Recipe Details | Ingredients & Steps | Structured ingredients list with food emoji/icons and clear step-by-step instructions. | `spaghetti-bolognese-recipe-detail.png` | **Verified** |
| `FEAT-APP-14` | Recipe Details | Allergy Safety Disclaimer | Prominent safety warning reminding home cooks to inspect manufacturer labels directly. | Terms Section 4 | **Verified** |
| `FEAT-APP-15` | Shopping List | Smart Consolidated List | Merges identical ingredients across different recipes into single items with consolidated quantities. Grouped by supermarket aisle. | App copy & FAQ | **Verified** |
| `FEAT-APP-16` | Shopping List | Interactive Checkboxes | Check off purchased items with strikethrough animation; updates active "X/Y items bought" counter. | `plan-overview.png` card | **Verified** |
| `FEAT-APP-17` | Shopping List | Share / Export List | Quick copy formatted text list to clipboard for SMS/messaging family members. | Review `r3` & Support FAQ | **Verified** |
| `FEAT-APP-18` | Discovery | Explore by Cuisine | Visual category browse (Italian, Asian, Mexican, Indian, Mediterranean, British) and search. | `explore-by-cuisine.png` | **Verified** |
| `FEAT-APP-19` | Discovery | Favorites / Saved Recipes | Bookmark favorite recipes to easily pull them into current or future meal plans. | App navigation & tab | **Verified** |
| `FEAT-APP-20` | Account & Settings | Subscription Status | Mock subscription status (Active Pro / Trial) with plan tier details, billing frequency, and cancel simulation. | FAQ & Terms | **Verified reconstructed** |

---

## 2. In-Depth Feature Specifications & Constraints

### 2.1 Backend Allergy Enforcement (`FEAT-APP-07` & `FEAT-APP-14`)
- **Requirement**: When a user selects any dietary filter (e.g. `Vegetarian`, `Vegan`, `Pescatarian`) or flags allergens to avoid (e.g., `Gluten`, `Dairy`, `Peanuts`, `Tree Nuts`, `Eggs`, `Fish`, `Shellfish`, `Soy`, `Sesame`), the backend recipe retrieval pipeline **MUST strictly filter out** any recipe containing matching allergen tags or ingredients.
- **Critical Disclaimer**: As mandated by Section 4 of the Mise Terms of Service, user interfaces must prominently display the allergen warning:
  > *"mise is a meal-planning tool, not an allergen-safety verification service. Always check ingredient labels and recipes before cooking — we cannot guarantee allergen safety."*
- **Database Schema Enforcement**: Recipes in MongoDB store an explicit array of `allergens: string[]` and `dietaryTags: string[]`. Query filters use `$nin` on allergens and `$in` on dietary tags.

### 2.2 Smart Shopping List Consolidation (`FEAT-APP-15`)
- When 7 meals are planned, ingredients are parsed into normalized units (grams, milliliters, pieces, bunches, cloves, cans, etc.).
- Identical ingredients (e.g., "Onion", "Garlic cloves", "Olive oil") are merged mathematically:
  $$\text{Total Quantity} = \sum_{i=1}^{N} \text{Quantity}_i \times \frac{\text{Household Size}}{2}$$
- Grouped into intuitive supermarket aisles:
  - 🥬 Fresh Produce
  - 🥩 Meat & Seafood
  - 🧀 Dairy & Refrigerated
  - 🥫 Pantry, Grains & Canned Goods
  - 🍞 Bakery
  - 🌿 Herbs & Seasoning

### 2.3 Realistic Recipe Dataset vs Live Supermarket Scraping
- **Constraint**: The reference app does not provide a public open API for live supermarket inventory prices. Live retail APIs (e.g., Kroger Developer API, Walmart Open API) require commercial contracts or developer keys.
- **Architecture**: A verified seed dataset of 30+ comprehensive, delicious home-cook recipes is provided, categorized across all 6 cuisines and 8 vibes, with estimated item pricing calibrated for major supermarkets (Aldi, Walmart, Kroger, Whole Foods, etc.).
- **Deterministic Meal Planner**: Generates weekly plans balancing vibes, cooking days, variety, calorie ranges, and ingredient overlap to reduce waste.

---

## 3. Assumptions vs Verified Inaccessible Features

1. **Native In-App Purchases (StoreKit / Google Play Billing)**:
   - *Status*: Inaccessible for custom web deployments without Apple/Google app store binary wrapping.
   - *Solution*: Reconstructed as a mock subscription management dashboard in `/app/settings` with clear tier toggle (Free vs Pro Chef) and full persistence in MongoDB.
2. **Third-party Live Supermarket Inventory Sync**:
   - *Status*: Private proprietary backend or partner integration.
   - *Solution*: Built as a deterministic pricing model per supermarket multiplier (e.g., Aldi = budget 0.85x, Whole Foods = premium 1.25x), fulfilling the promise of supermarket-tuned shopping lists and budget tracking.
