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
import { GroceryScreen } from '../screens/app/GroceryScreen';
import { ExploreScreen } from '../screens/app/ExploreScreen';
import { PreferencesScreen } from '../screens/app/PreferencesScreen';
import { ProfileScreen } from '../screens/app/ProfileScreen';
import { RecipeDetailScreen } from '../screens/app/RecipeDetailScreen';
import { LoadingState } from '../components/common/LoadingState';

type AuthRoute = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';
type TabRoute = 'PLAN' | 'GROCERY' | 'EXPLORE' | 'PREFS' | 'PROFILE';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { shoppingList } = usePlan();

  // Navigation state
  const [authRoute, setAuthRoute] = useState<AuthRoute>('LOGIN');
  const [activeTab, setActiveTab] = useState<TabRoute>('PLAN');
  const [selectedRecipe, setSelectedRecipe] = useState<IRecipe | null>(null);

  if (authLoading) {
    return <LoadingState message="Connecting to Mise Backend..." />;
  }

  // Unauthenticated Auth Flow
  if (!isAuthenticated) {
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
    ? shoppingList.totalItemsCount - shoppingList.itemsBoughtCount
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Content Area */}
      <View style={styles.content}>
        {activeTab === 'PLAN' && (
          <PlanScreen
            onSelectRecipe={setSelectedRecipe}
            onNavigateToPreferences={() => setActiveTab('PREFS')}
          />
        )}
        {activeTab === 'GROCERY' && (
          <GroceryScreen onNavigateToPlan={() => setActiveTab('PLAN')} />
        )}
        {activeTab === 'EXPLORE' && (
          <ExploreScreen onSelectRecipe={setSelectedRecipe} />
        )}
        {activeTab === 'PREFS' && <PreferencesScreen />}
        {activeTab === 'PROFILE' && <ProfileScreen />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('PLAN')}
        >
          <Text style={[styles.tabIcon, activeTab === 'PLAN' && styles.tabIconActive]}>
            🗓️
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'PLAN' && styles.tabLabelActive]}>
            Plan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('GROCERY')}
        >
          <View>
            <Text style={[styles.tabIcon, activeTab === 'GROCERY' && styles.tabIconActive]}>
              🛒
            </Text>
            {remainingGroceryCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {remainingGroceryCount > 99 ? '99+' : remainingGroceryCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.tabLabel, activeTab === 'GROCERY' && styles.tabLabelActive]}
          >
            Grocery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('EXPLORE')}
        >
          <Text
            style={[styles.tabIcon, activeTab === 'EXPLORE' && styles.tabIconActive]}
          >
            🔍
          </Text>
          <Text
            style={[styles.tabLabel, activeTab === 'EXPLORE' && styles.tabLabelActive]}
          >
            Explore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('PREFS')}
        >
          <Text style={[styles.tabIcon, activeTab === 'PREFS' && styles.tabIconActive]}>
            ⚙️
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'PREFS' && styles.tabLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('PROFILE')}
        >
          <Text
            style={[styles.tabIcon, activeTab === 'PROFILE' && styles.tabIconActive]}
          >
            👤
          </Text>
          <Text
            style={[styles.tabLabel, activeTab === 'PROFILE' && styles.tabLabelActive]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
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
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#0D5C3A',
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
