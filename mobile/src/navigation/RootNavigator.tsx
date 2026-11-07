import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { IRecipe } from '../types';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// App Screens
import { PlanScreen } from '../screens/app/PlanScreen';
import { PantryScreen } from '../screens/app/PantryScreen';
import { GroceryScreen } from '../screens/app/GroceryScreen';
import { ExploreScreen } from '../screens/app/ExploreScreen';
import { PreferencesScreen } from '../screens/app/PreferencesScreen';
import { ProfileScreen } from '../screens/app/ProfileScreen';
import { RecipeDetailScreen } from '../screens/app/RecipeDetailScreen';
import { LoadingState } from '../components/common/LoadingState';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { isLocalDemoMode } from '../demo/demoMode';

type AuthRoute = 'ONBOARDING' | 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';
type TabRoute = 'PLAN' | 'PANTRY' | 'GROCERY' | 'EXPLORE' | 'PROFILE';
type ProfileRoute = 'PROFILE' | 'PREFERENCES';

const TABS: { route: TabRoute; label: string; icon: string }[] = [
  { route: 'PLAN', label: 'Plan', icon: '▦' },
  { route: 'PANTRY', label: 'Pantry', icon: '◉' },
  { route: 'GROCERY', label: 'Grocery', icon: '✓' },
  { route: 'EXPLORE', label: 'Explore', icon: '⌕' },
  { route: 'PROFILE', label: 'Profile', icon: '●' },
];

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { shoppingList } = usePlan();

  // Navigation state: starts with Onboarding per Batch 1 requirements
  const [authRoute, setAuthRoute] = useState<AuthRoute>('ONBOARDING');
  const [activeTab, setActiveTab] = useState<TabRoute>('PLAN');
  const [profileRoute, setProfileRoute] = useState<ProfileRoute>('PROFILE');
  const [visitedProfilePreferences, setVisitedProfilePreferences] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<TabRoute[]>(['PLAN']);
  const [selectedRecipe, setSelectedRecipe] = useState<IRecipe | null>(null);

  const navigateToTab = (tab: TabRoute) => {
    setActiveTab(tab);
    setVisitedTabs((visited) => (visited.includes(tab) ? visited : [...visited, tab]));
    if (tab === 'PROFILE') setProfileRoute('PROFILE');
  };

  const navigateToPreferences = () => {
    setProfileRoute('PREFERENCES');
    setVisitedProfilePreferences(true);
    setActiveTab('PROFILE');
    setVisitedTabs((visited) => (visited.includes('PROFILE') ? visited : [...visited, 'PROFILE']));
  };

  if (authLoading) {
    return <LoadingState message="Connecting to Meltto Backend..." />;
  }

  // Unauthenticated Auth / Onboarding Flow
  if (!isAuthenticated) {
    if (authRoute === 'ONBOARDING') {
      return (
        <SafeAreaView style={styles.container}>
          <OnboardingScreen
            onFinishBatch1={() => setAuthRoute('REGISTER')}
            onNavigateToAuth={() => setAuthRoute('LOGIN')}
          />
        </SafeAreaView>
      );
    }
    if (authRoute === 'REGISTER') {
      return (
        <SafeAreaView style={styles.container}>
          <RegisterScreen onNavigateToLogin={() => setAuthRoute('LOGIN')} />
        </SafeAreaView>
      );
    }
    if (authRoute === 'FORGOT_PASSWORD') {
      return (
        <SafeAreaView style={styles.container}>
          <ForgotPasswordScreen onNavigateToLogin={() => setAuthRoute('LOGIN')} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.container}>
        <LoginScreen
          onNavigateToRegister={() => setAuthRoute('REGISTER')}
          onNavigateToForgotPassword={() => setAuthRoute('FORGOT_PASSWORD')}
          onNavigateToOnboarding={() => setAuthRoute('ONBOARDING')}
        />
      </SafeAreaView>
    );
  }

  // Active Recipe Detail Screen Modal/View
  if (selectedRecipe) {
    return (
      <SafeAreaView style={styles.container}>
        <RecipeDetailScreen
          recipe={selectedRecipe}
          onBack={() => setSelectedRecipe(null)}
        />
      </SafeAreaView>
    );
  }

  // Main Authenticated Tab Navigation
  const remainingGroceryCount = shoppingList
    ? Math.max(0, shoppingList.totalItemsCount - shoppingList.itemsBoughtCount)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {isLocalDemoMode() ? (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>DEMO MODE · LOCAL DATA ONLY</Text>
        </View>
      ) : null}
      <View style={styles.content}>
        {visitedTabs.includes('PLAN') && (
          <View style={[styles.screen, activeTab !== 'PLAN' && styles.hiddenScreen]}>
          <PlanScreen
            onSelectRecipe={setSelectedRecipe}
            onNavigateToPreferences={navigateToPreferences}
            onNavigateToGrocery={() => navigateToTab('GROCERY')}
            onNavigateToPantry={() => navigateToTab('PANTRY')}
          />
          </View>
        )}
        {visitedTabs.includes('PANTRY') && (
          <View style={[styles.screen, activeTab !== 'PANTRY' && styles.hiddenScreen]}>
          <PantryScreen onSelectRecipe={setSelectedRecipe} />
          </View>
        )}
        {visitedTabs.includes('GROCERY') && (
          <View style={[styles.screen, activeTab !== 'GROCERY' && styles.hiddenScreen]}>
          <GroceryScreen onNavigateToPlan={() => setActiveTab('PLAN')} />
          </View>
        )}
        {visitedTabs.includes('EXPLORE') && (
          <View style={[styles.screen, activeTab !== 'EXPLORE' && styles.hiddenScreen]}>
          <ExploreScreen onSelectRecipe={setSelectedRecipe} />
          </View>
        )}
        {visitedTabs.includes('PROFILE') && (
          <View style={[styles.screen, activeTab !== 'PROFILE' && styles.hiddenScreen]}>
            <View style={[styles.screen, profileRoute !== 'PROFILE' && styles.hiddenScreen]}>
              <ProfileScreen onNavigateToPreferences={() => {
                setProfileRoute('PREFERENCES');
                setVisitedProfilePreferences(true);
              }} />
            </View>
            {visitedProfilePreferences ? (
              <View style={[styles.screen, profileRoute !== 'PREFERENCES' && styles.hiddenScreen]}>
                <PreferencesScreen onBackToProfile={() => setProfileRoute('PROFILE')} />
              </View>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.tabBar}>
        {TABS.map(({ route, label, icon }) => {
          const isActive = activeTab === route;
          return (
            <TouchableOpacity
              key={route}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={styles.tabItem}
              onPress={() => navigateToTab(route)}
            >
              <View style={styles.tabIconWrap}>
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{icon}</Text>
                {route === 'GROCERY' && remainingGroceryCount > 0 ? (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {remainingGroceryCount > 99 ? '99+' : remainingGroceryCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  demoBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D5C3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  demoBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  screen: {
    flex: 1,
  },
  hiddenScreen: {
    display: 'none',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECE7',
    paddingTop: 7,
    paddingBottom: Platform.OS === 'ios' ? 12 : 7,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 48,
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabIcon: {
    color: '#809087',
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '700',
    opacity: 0.6,
  },
  tabIconActive: {
    color: '#0D5C3A',
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#748078',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#0D5C3A',
    fontWeight: '800',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -13,
    backgroundColor: '#E97456',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
});
