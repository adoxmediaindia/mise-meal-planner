# Mise Meal Planner — Interaction Matrix

This document maps all user interactions across the public marketing website and the authenticated web application, specifying trigger events, component state changes, visual feedback, accessibility features, and network/data mutations.

---

## 1. Public Marketing Website Interactions

| Component | Trigger | Current State | Target State | Visual & Motion Feedback | ARIA / Accessibility | Side Effects / Data Mutation |
|---|---|---|---|---|---|---|
| **Nav Brand Logo** | Click / Tap | Default | Scrolled to top | Smooth scroll transition to `#top` | `aria-label="mise home"` | URL hash cleared to `#top` |
| **Nav Links (`#how`, `#features`, etc.)** | Click / Tap | Inactive | Scrolled to target | Smooth scroll to target section ID | Semantic `<nav>` anchor | In mobile view, closes hamburger drawer |
| **Mobile Nav Toggle (`#navToggle`)** | Click / Tap | Closed (`aria-expanded="false"`) | Open (`aria-expanded="true"`) | Hamburger icon animates; nav links drawer slides down (`.open`) | `aria-controls="navLinks"`, `aria-expanded` toggle | Updates DOM class; traps or releases focus |
| **Language Switcher Button (`#langBtn`)** | Click / Tap | Menu Closed | Menu Open (`aria-expanded="true"`) | Dropdown menu fades in below button with shadow | `aria-haspopup="listbox"`, `aria-expanded` | Closes on outside click |
| **Language Menu Option (`[data-lang]`)** | Click / Tap | Selected code | New language selected | Active check / background color update; page copy re-interpolates dynamically | `role="option"`, `aria-selected` | Sets `localStorage("mise-site-lang", code)`, re-renders i18n text, updates URL query `?lang=code` |
| **Store Badges (App Store / Play)** | Hover | Flat | Elevated | `translateY(-2px)`, shadow increases from `--shadow-sm` to `--shadow-md` | `aria-label="Download on App Store"` | Opens store link or simulation modal |
| **Scroll Reveal Items (`.reveal`)** | Scroll (viewport enter) | Hidden (`opacity: 0`, `translateY(24px)`) | Visible (`.in`: `opacity: 1`, `translateY(0)`) | 0.6s cubic-bezier ease entrance | `IntersectionObserver` threshold `0.12` | Unobserves element once revealed |
| **Marquee Retailer Ticker** | Hover | Scrolling | Paused or slowed | Smooth infinite CSS transform loop | Decorative, `aria-hidden="true"` | None |
| **How It Works Steps** | Hover | Rest | Lifted | `translateY(-4px)` with `--shadow-md` elevation | Semantic heading structure | None |
| **Feature Cards** | Hover | Rest | Lifted | `translateY(-4px)` with `--shadow-md` elevation | Semantic heading structure | None |
| **Vibe Badges (`.vibe`)** | Hover | Rest | Tilted & Lifted | `translateY(-4px) rotate(-1deg)` | Semantic card layout | None |
| **Screenshot Gallery** | Drag / Swipe / Scroll | Resting scroll | Shifted scroll | Touch inertia, smooth scroll snap to center | Keyboard left/right scrollable | None |
| **FAQ Accordions (`details`)** | Click on summary | Closed | Open | `::after` `+` indicator smoothly rotates 45° to `×`; paragraph unfolds with box shadow expansion | Native accessible `<details>` / `<summary>` | Native browser state toggle |

---

## 2. Authentication & Onboarding Interactions

| Flow / Component | Trigger | Input / Event | State Changes & Validation | Visual Feedback | API / Backend Mutation |
|---|---|---|---|---|---|
| **Registration Form** | Submit button | Name, Email, Password, Terms checkbox | Client Zod validation: email format, min 8-char password, required terms check. | Button enters loading spinner; field errors highlighted with red border and message. | `POST /api/v1/auth/register` -> sets HTTP-only JWT cookie, redirects to `/onboarding`. |
| **Login Form** | Submit button | Email, Password | Client validation: email & password presence. | Loading state on button; invalid credentials toast / alert banner. | `POST /api/v1/auth/login` -> sets cookie, redirects to `/app/plan`. |
| **Supermarket Selection** | Select card / dropdown | Choose retailer (e.g. Aldi) | Active card receives green 2px border and checkmark. | Subtle pulse animation on selected card. | Stored in onboarding wizard draft state. |
| **Household Size Stepper** | Click `[-]` or `[+]` | Decrement / Increment | Value constrained between 1 and 10. | Animated number counter transition; `-` disabled if count == 1. | Stored in wizard state; updates ingredient scaling preview. |
| **Cooking Days Pills** | Click Day Pill (Mon-Sun) | Toggle day | Day toggles active/inactive. Must have at least 1 day selected. | Active pills get `#9ED034` border and bold text. | Stored in wizard state. |
| **Vibes Picker (Onboarding)** | Click Vibe Card | Max 3 choices | Allows max 3; clicking a 4th prompts user to deselect one first. | Green outline border on selected cards; counter displays "X/3 selected". | Stored in wizard state. |
| **Dietary & Allergen Exclusions** | Checkbox / Chip | Select / Deselect | Selecting "None" unchecks others. Selecting allergens flags items. | Highlighted chip with exclusion icon; allergen warning box appears. | Stored in wizard state; passed to backend recipe engine. |
| **Complete Onboarding** | Click "Get My Plan" | Submit all preferences | Full form validation. | Button shows "Building your weekly plan..."; splash loading animation. | `POST /api/v1/preferences` followed by `POST /api/v1/plan/generate`. Redirects to `/app/plan`. |

---

## 3. Meal Planning Dashboard Interactions

| Action / Component | Trigger | Feedback & UI Transition | Backend Endpoint & Cache Invalidation |
|---|---|---|---|
| **View Plan Overview** | Page load / navigation | Skeleton loaders on cards; smoothly transitions into day-by-day dinner cards with greeting and budget meter. | `GET /api/v1/plan/current` |
| **Meal Card Click** | Click dinner card | Opens modal or navigates to `/app/recipes/:id` with recipe details. | `GET /api/v1/recipes/:id` |
| **Swap Single Meal** | Click "Swap Meal" button on Day card | Opens recipe replacement modal showing compliant alternatives. Selecting replacement swaps card with flip transition. | `PUT /api/v1/plan/swap-meal` -> recalculates est. cost & shopping list. |
| **Regenerate Whole Week** | Click "Regenerate Plan" button | Confirmation modal: "Regenerate this week's plan?"; on confirm, cards reload with fresh recipe set. | `POST /api/v1/plan/generate` -> refreshes plan and resets shopping list items. |
| **Grocery List Shortcut Card** | Click "Grocery list" card | Navigates to `/app/grocery-list` with active items counter. | Client router transition to `/app/grocery-list`. |

---

## 4. Recipe Detail Interactions

| Component | Trigger | Visual & State Transition | API / Data Effect |
|---|---|---|---|
| **Back Button** | Click circular top-left arrow | Slides back to referring plan or explore view. | Browser navigation history back. |
| **Favorite Heart Button** | Click circular top-right heart | Heart toggles from white stroke to red/green filled heart with spring bounce. | `POST /api/v1/recipes/:id/favorite` -> updates user favorite list. |
| **Thumbs Up / Down** | Click thumb icon | Selected thumb turns solid color; alternative thumb dims. | `POST /api/v1/recipes/:id/reaction` -> records feedback. |
| **Servings Scaler** | Change serving stepper | Ingredient quantities recalculate dynamically in real time. | Recalculates client display values based on ratio. |
| **Add to Plan Action** | Click "Add to this week's plan" | Dropdown prompts to pick which day (Mon-Sun) to assign recipe to. | `PUT /api/v1/plan/swap-meal`. |

---

## 5. Smart Grocery List Interactions

| Component | Trigger | Visual & State Transition | API / Data Effect |
|---|---|---|---|
| **Item Checkbox** | Click / Tap item row | Checkbox marks checked; text gets strikethrough with muted color; progress bar advances. | `PATCH /api/v1/shopping-list/item/:id` -> persists checked state in MongoDB. |
| **Filter by Aisle** | Tap category pill (Produce, Meat, etc.) | Smooth list filter showing only items in selected aisle. | Client state filter. |
| **Copy List to Clipboard** | Click "Copy List" | Button briefly flashes "Copied to clipboard! ✓" with green checkmark. | `navigator.clipboard.writeText(...)` with formatted categorized list. |
| **Clear Checked Items** | Click "Reset / Uncheck All" | Confirmation dialog; unchecks all items and resets counter to `0 / N items bought`. | `POST /api/v1/shopping-list/reset`. |

---

## 6. Error Handling & Edge Case Matrix

| Scenario | System State | User Feedback / UI Indicator | Recovery Action |
|---|---|---|---|
| **Network Failure during Plan Generation** | API returns 500 or timeout | Error toast: *"Couldn't generate plan. Check your internet connection."* | "Retry" button rendered inside empty plan state. |
| **Strict Filter Leaves Too Few Recipes** | User selected very strict diet + 5 allergens | Alert banner: *"We couldn't find enough recipes matching all exclusions. Try relaxing one allergy filter."* | Suggests relaxing filters or displays available safe subset. |
| **Allergy Safety Notice** | Any recipe view or preference change | Persistent amber badge: *"Always check package labels. Mise cannot guarantee allergen safety."* | Unobtrusive, dismissible banner with link to Terms Section 4. |
| **Unauthenticated Route Access** | User visits `/app/plan` without token | Automatically redirected to `/auth/login?redirect=/app/plan`. | Logs user in and redirects back to target route. |
