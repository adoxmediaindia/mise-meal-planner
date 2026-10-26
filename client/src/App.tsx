import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';

// Marketing pages
import { Home } from './pages/marketing/Home.js';
import { Support } from './pages/marketing/Support.js';
import { Privacy } from './pages/marketing/Privacy.js';
import { Terms } from './pages/marketing/Terms.js';

// Auth pages
import { Login } from './pages/auth/Login.js';
import { Register } from './pages/auth/Register.js';
import { ForgotPassword } from './pages/auth/ForgotPassword.js';

// App pages
import { AppShell } from './components/app/AppShell.js';
import { PlanOverview } from './pages/app/PlanOverview.js';
import { RecipeDetail } from './pages/app/RecipeDetail.js';
import { GroceryList } from './pages/app/GroceryList.js';
import { Pantry } from './pages/app/Pantry.js';
import { Explore } from './pages/app/Explore.js';
import { Preferences } from './pages/app/Preferences.js';
import { Settings } from './pages/app/Settings.js';
import { Onboarding } from './pages/app/Onboarding.js';
import { AdminDashboard } from './pages/admin/AdminDashboard.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] text-[#6b6b6b] text-sm">
        Authenticating...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Marketing Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/support" element={<Support />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      {/* 2. Authentication Routes */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ForgotPassword defaultMode="reset" />} />

      {/* 3. Onboarding Wizard */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* 4. Protected Web Application Shell */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/plan" replace />} />
        <Route path="plan" element={<PlanOverview />} />
        <Route path="pantry" element={<Pantry />} />
        <Route path="recipes/:id" element={<RecipeDetail />} />
        <Route path="grocery-list" element={<GroceryList />} />
        <Route path="explore" element={<Explore />} />
        <Route path="preferences" element={<Preferences />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
