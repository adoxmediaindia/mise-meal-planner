# Meltto — Native Mobile Application (Expo & React Native)

This directory contains the production-ready React Native + Expo TypeScript client for **Meltto**, designed to run natively on iOS and Android devices, as well as web preview.

---

## 1. Architectural Philosophy

1. **Single Authoritative Backend & Database**:
   The mobile application connects directly to the same Node.js + Express backend and MongoDB Atlas production database used by the public web application (`meltto.com`). There is no mobile-specific database and zero business logic duplication.
2. **Hardware-Backed Secure Authentication**:
   Authentication tokens are kept in secure hardware storage using `expo-secure-store` (`Keychain` on iOS, `KeyStore` with EncryptedSharedPreferences on Android). Insecure plaintext storage (`AsyncStorage`) is strictly prohibited.
3. **Cross-Device Synchronization**:
   All mutations (updating dietary preferences, swapping meals, checking off supermarket ingredients) immediately commit to the shared MongoDB cluster.
4. **Resilient Offline Grocery Mode**:
   When shopping in supermarket basements or poor connectivity areas, checklist toggles are optimistically applied to the UI and queued in `offlineSyncQueue`. Once connection is restored, the client flushes queued actions via `PATCH /shopping-list/item/:itemId` to reconcile state on the server without overwriting fresh data.

---

## 2. Directory Structure

```
mobile/
├── App.tsx                     # Top-level root component wrapping Auth & Plan providers
├── app.json                    # Expo application metadata (bundle ID, permissions, assets)
├── package.json                # React Native & Expo dependencies
├── tsconfig.json               # TypeScript strict configuration
└── src/
    ├── config/
    │   └── env.ts              # API base URL configuration (EXPO_PUBLIC_API_URL / fallback)
    ├── types/
    │   └── index.ts            # Shared domain types matching backend & client
    ├── services/
    │   ├── api.ts              # Authenticated REST API client (Bearer auth injection)
    │   ├── secureStorage.ts    # Hardware secure storage wrapper (expo-secure-store)
    │   └── offlineSync.ts      # Offline mutation queue for grocery checkoffs
    ├── context/
    │   ├── AuthContext.tsx     # Mobile auth state (login, register, forgot/reset password, logout)
    │   └── PlanContext.tsx     # Plan state, meal swapping, preferences, grocery checklist
    ├── navigation/
    │   └── RootNavigator.tsx   # First-launch flow, auth navigation & five-tab application shell
    ├── components/
    │   ├── common/             # Button, Card, Badge, EmptyState, ErrorState, LoadingState
    │   ├── plan/               # DinnerCard, SwapModal
    │   └── grocery/            # GroceryItemRow, AisleSection
    └── screens/
        ├── onboarding/         # Resumable, one-question-at-a-time meal preference setup
        ├── auth/               # LoginScreen, RegisterScreen, ForgotPasswordScreen
        └── app/                # Plan, Pantry, Grocery, Explore, Profile, preferences & recipe detail
```

New users see a short welcome followed by nine focused preference questions. Answers and
progress are saved securely between launches; finishing the questions continues through
account registration, then creates the first personalized plan. The main navigation keeps
Plan, Pantry, Grocery, Explore and Profile visible, with meal preferences available from
Profile. Visited tabs remain mounted so each tab retains its own scroll position.

---

## 3. Environment Variables

Create `.env` in `mobile/` or set variables in your build environment:

```env
# Optional: URL of deployed backend on Render (defaults to http://localhost:5000 in dev)
EXPO_PUBLIC_API_URL=https://mise-meal-planner-api.onrender.com
```

---

## 4. Running Locally

```bash
# Navigate to mobile directory
cd mobile

# Start Expo dev server
npx expo start

# Run on Android Emulator
npx expo start --android

# Run on iOS Simulator (macOS only)
npx expo start --ios

# Run on Web browser preview
npx expo start --web
```

---

## 5. Building for Production (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure build profiles
eas build:configure

# Build Android APK / AAB
eas build --platform android --profile production

# Build iOS IPA
eas build --platform ios --profile production
```
