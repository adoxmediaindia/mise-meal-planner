# Mise Meal Planner — Design System & Style Guide

This document captures the design tokens, typography, color palettes, responsive layouts, components, and animations directly audited from `reference_styles.css`, `reference_index.html`, and the mobile app screens.

---

## 1. Color Palette & Design Tokens

### Core Colors
```css
:root {
  /* Surfaces & Backgrounds */
  --bg: #fafaf8;            /* Warm off-white page background */
  --surface: #ffffff;       /* Pure white card and container surface */
  --phone-frame: #1a1a1a;   /* Dark graphite phone bezel & store badge bg */

  /* Brand Accents */
  --primary: #9ed034;       /* Mise Lime / Vibrant chartreuse green */
  --primary-dark: #8bc020;  /* Deeper green for hover states & eyebrow text */
  --primary-tint: rgba(158, 208, 52, 0.16); /* Eyebrow & badge background */
  --primary-glow: rgba(158, 208, 52, 0.45); /* Primary button drop shadow */

  /* Typography */
  --text: #2a2a2a;          /* Charcoal dark body & heading text */
  --muted: #6b6b6b;         /* Neutral gray secondary text & captions */
  --muted-light: #9a9a94;   /* Light gray for marquee text */
  --border-light: rgba(42, 42, 42, 0.08); /* Subtle container borders */

  /* Decorative Accents & Blobs */
  --blob-green: rgba(158, 208, 52, 0.35);  /* Top hero floating blur */
  --blob-yellow: rgba(255, 230, 120, 0.45); /* Bottom hero floating blur */
  --list-bubble: #ddf4ff;                  /* Light blue chip / grocery card */
  --star-yellow: #f4b740;                  /* Star rating review gold */
}
```

### Feature Pastel Colors (Icons & Badges)
| Category / Feature | Background Hex | Emoji / Icon | Visual Contrast |
|---|---|---|---|
| Speedy Meals / Weekly Plans | `#E0D4FF` | ⚡ / 🗓️ | Soft Lavender |
| One Smart List / Low Calorie | `#DDF4FF` or `#7DD3FC` | 🛒 / ⚖️ | Sky Blue |
| Budget-aware / Family Favs | `#FFE0BC` | 💷 / 👨‍👩‍👧 | Warm Peach |
| Diet & Allergy / Healthy Comfort | `#9BD88F` | 🥗 | Fresh Sage Green |
| Swap & Regenerate / Protein Packed | `#FFA8BC` | 🔄 / 💪 | Rose Pink |
| Cooks for Kitchen / Gut Friendly | `#5EEAD4` | 🍳 / 💚 | Fresh Mint Teal |
| Fakeaway | `#FF9F68` | 🍔 | Apricot Coral |
| Explore by Cuisine / British Staples | `#A8B8E8` | 🌍 / 🇬🇧 | Periwinkle Blue |
| Less Food Waste | `#7DD3FC` | ♻️ | Cyan Blue |
| Made for Households | `#FFD966` | 👨‍👩‍👧 | Sunflower Yellow |

---

## 2. Typography

```css
:root {
  /* Font Stacks */
  --serif: Georgia, "Times New Roman", Times, serif;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

### Hierarchy & Scale

| Token / Element | Font Family | Size (Desktop / Mobile) | Weight | Line Height | Tracking |
|---|---|---|---|---|---|
| **Hero H1** | `var(--serif)` | `clamp(44px, 6.6vw, 76px)` / `clamp(34px, 9.5vw, 42px)` | 600 | 1.08 | -0.02em |
| **Section Head H2** | `var(--serif)` | `clamp(30px, 4.5vw, 46px)` / `clamp(26px, 7vw, 34px)` | 600 | 1.15 | -0.015em |
| **Card H3** | `var(--serif)` | `21px - 22px` | 600 | 1.25 | -0.01em |
| **Eyebrow Pill** | `var(--sans)` | `13px` | 700 | 1.0 | +0.08em (Uppercase) |
| **Hero Subtitle** | `var(--sans)` | `20px` / `17px` | 400 | 1.6 / 1.55 | Normal |
| **Body Paragraph** | `var(--sans)` | `16px - 18px` | 400 | 1.6 | Normal |
| **Buttons & Badges**| `var(--sans)` | `16px` | 700 | 1.1 | Normal |
| **Stat Numbers** | `var(--serif)` | `clamp(32px, 4vw, 46px)` | 600 | 1.1 | -0.02em |
| **Marquee Retailers**| `var(--serif)` | `22px` | 600 | 1.0 | Normal |

---

## 3. Spacing, Geometry & Shadows

```css
:root {
  /* Border Radii */
  --radius-pill: 999px;   /* Pills, CTA buttons, badges */
  --radius-card: 24px;    /* Cards, steps, reviews, vibe blocks */
  --radius-sm: 16px;      /* FAQ items, modals, dropdown menus */
  --radius-phone: 46px;   /* Simulated mobile device mockup bezel */

  /* Container & Layout */
  --maxw: 1120px;         /* Max container width */

  /* Elevation Shadows */
  --shadow-sm: 0 4px 16px rgba(42, 42, 42, 0.06);
  --shadow-md: 0 12px 32px rgba(42, 42, 42, 0.10);
  --shadow-lg: 0 24px 60px rgba(42, 42, 42, 0.14);
}
```

### Spacing Scale
- Section Padding: `96px 0` (Desktop), `56px 0` (Mobile), `64px 0` (Tight section)
- Container Gutter: `24px` (Desktop), `20px` (Mobile)
- Card Inner Padding: `32px 28px` (Features), `40px 32px` (Stats), `26px 22px` (Vibes)

---

## 4. UI Components

### 4.1 Primary Pill Button (`.btn--primary`)
- Background: `var(--primary)` (`#9ED034`)
- Text: `#1f2a06` (High-contrast dark forest green)
- Padding: `15px 26px`
- Border-radius: `var(--radius-pill)`
- Box-shadow: `0 8px 22px rgba(158, 208, 52, 0.45)`
- Hover: `transform: translateY(-2px)`, Background `var(--primary-dark)` (`#8BC020`)

### 4.2 App Store & Google Play Badges (`.store-badge`)
- Background: `var(--phone-frame)` (`#1a1a1a`)
- Text: White (`#ffffff`)
- Border-radius: `14px`
- Layout: SVG Icon (26x26px) + 2-line column (`badge-small` at 11px uppercase, `badge-big` at 18px bold)
- Hover: `transform: translateY(-2px)`, `box-shadow: var(--shadow-md)`

### 4.3 Interactive Phone Mockup (`.phone`)
- Frame: Width `300px` (desktop hero) / `252px` (side phones) / `260px` (gallery)
- Border-radius: `46px` (desktop) / `38px` (mobile)
- Background: `#1a1a1a`
- Padding: `12px` (inner screen corner radius `34px`)
- Dynamic Notch: `::before` pseudo-element (width `110px`, height `26px`, border-radius `0 0 16px 16px`, centered top)
- Side Perspectives:
  - Left phone: `transform: rotate(-9deg); bottom: 18px; left: -28px;`
  - Right phone: `transform: rotate(9deg); bottom: 18px; right: -28px;`
- Floating animation on center phone: `animation: float 6s ease-in-out infinite`

### 4.4 Supermarket Marquee (`.marquee`)
- Mask: `-webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)`
- Track: `animation: scroll-x 32s linear infinite`
- Typography: 22px serif in `#9A9A94`, flex row with `gap: 46px`

### 4.5 Vibe Cards (`.vibe`)
- Layout: 4-column grid (desktop), 3-column (tablet), 2-column (mobile)
- Height: Min `132px`
- Shape: Rounded `24px` card
- Hover: `transform: translateY(-4px) rotate(-1deg)`
- Text: 20px Georgia serif, `#1f2a06`
- Emoji: 30px centered icon

### 4.6 Accordion FAQ (`details`)
- Background: `var(--surface)` with `var(--shadow-sm)`
- Border radius: `16px`
- Padding: `4px 24px`
- Indicator: `::after` content `"+"` rotating `45deg` on open
- Smooth transition on content reveal

---

## 5. Animations & Keyframes

```css
/* Floating device & badge bobbing */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

/* Continuous marquee translation */
@keyframes scroll-x {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* Scroll reveal transition */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.in {
  opacity: 1;
  transform: none;
}
```

---

## 6. Responsive Breakpoints

| Breakpoint | Target Screen | Key Structural Adjustments |
|---|---|---|
| `> 960px` | Desktop | 2-column hero grid, 4-column stats, 4-column steps, 3-column features, 4-column vibes, 3-column reviews, 4-column footer. |
| `641px - 960px` | Tablet | 1-column hero (centered), 2-column stats, 2-column steps, 2-column features, 3-column vibes, 2-column reviews, 2-column footer. |
| `<= 640px` | Mobile Phone | Full-width hamburger drawer navigation, stacked store badges, scaled hero typography (`34px - 42px`), side hero phones hidden or tuck beneath, 1-column features & steps, 2-column vibes, 1-column reviews, centered footer. |
