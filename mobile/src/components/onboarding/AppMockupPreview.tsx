import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AppMockupPreviewProps {
  supermarket?: string;
  currencySymbol?: string;
  estimatedCost?: number;
  userName?: string;
  recipes?: Array<{ title: string; cookTime?: number; emoji?: string }>;
}

export const AppMockupPreview: React.FC<AppMockupPreviewProps> = ({
  supermarket = 'Aldi',
  currencySymbol = '$',
  estimatedCost = 38.5,
  userName = 'Chef!',
  recipes = [
    { title: 'Spicy Sausage & Tomato Rigatoni', cookTime: 25, emoji: '🍝' },
    { title: 'Crispy Lemon Garlic Chicken', cookTime: 30, emoji: '🍗' },
    { title: 'Sesame Ginger Beef Stir-fry', cookTime: 20, emoji: '🥢' },
    { title: 'Creamy Spinach & Feta Orzo', cookTime: 25, emoji: '🥣' },
  ],
}) => {
  return (
    <View style={styles.phoneOuter}>
      {/* Notch */}
      <View style={styles.notch}>
        <View style={styles.cameraDot} />
      </View>

      {/* Screen Body */}
      <View style={styles.screen}>
        {/* Status bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusTime}>13:02</Text>
          <View style={styles.statusIcons}>
            <Text style={styles.statusSignal}>5G</Text>
            <View style={styles.batteryIcon}>
              <View style={styles.batteryFill} />
            </View>
          </View>
        </View>

        {/* Greeting Header */}
        <View style={styles.header}>
          <Text style={styles.greetingEyebrow}>GOOD AFTERNOON</Text>
          <Text style={styles.greetingTitle}>{userName}</Text>
          <View style={styles.supermarketBadge}>
            <Text style={styles.badgeText}>🛒 planned for {supermarket}</Text>
          </View>
        </View>

        {/* Metric Cards Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>EST. COST</Text>
            <Text style={styles.metricValue}>
              {currencySymbol}{estimatedCost.toFixed(2)}
            </Text>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>TAP TO VIEW</Text>
            <Text style={styles.metricValueBold} numberOfLines={1}>
              Grocery list
            </Text>
            <Text style={styles.metricSub}>0/18 items bought</Text>
          </View>
        </View>

        {/* Recipe Cards */}
        <View style={styles.recipesContainer}>
          {recipes.slice(0, 4).map((recipe, index) => (
            <View key={index} style={styles.recipeCard}>
              <View style={styles.recipeEmojiBox}>
                <Text style={styles.recipeEmojiText}>{recipe.emoji || '🥘'}</Text>
              </View>
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle} numberOfLines={1}>
                  {recipe.title}
                </Text>
                <Text style={styles.recipeMeta}>
                  ⏱️ {recipe.cookTime || 25}m • Dinner
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Mini Tab Bar */}
        <View style={styles.tabBar}>
          <View style={styles.tabItemActive}>
            <Text style={styles.tabEmoji}>📋</Text>
            <Text style={styles.tabLabelActive}>plan</Text>
          </View>
          <View style={styles.tabItem}>
            <Text style={styles.tabEmoji}>❤️</Text>
            <Text style={styles.tabLabel}>favourites</Text>
          </View>
          <View style={styles.tabItem}>
            <Text style={styles.tabEmoji}>⚙️</Text>
            <Text style={styles.tabLabel}>settings</Text>
          </View>
        </View>

        {/* Home Indicator */}
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  phoneOuter: {
    width: 260,
    backgroundColor: '#2d2538',
    borderRadius: 36,
    padding: 8,
    alignSelf: 'center',
    shadowColor: '#2d2538',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#3f354f',
    position: 'relative',
  },
  notch: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    width: 76,
    height: 14,
    backgroundColor: '#000000',
    borderRadius: 7,
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  cameraDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1c1c28',
  },
  screen: {
    backgroundColor: '#fbfbf9',
    borderRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#222222',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusSignal: {
    fontSize: 9,
    fontWeight: '700',
    color: '#222222',
  },
  batteryIcon: {
    width: 14,
    height: 8,
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 2,
    padding: 1,
  },
  batteryFill: {
    width: '70%',
    height: '100%',
    backgroundColor: '#222222',
    borderRadius: 1,
  },
  header: {
    marginBottom: 8,
  },
  greetingEyebrow: {
    fontSize: 8,
    fontWeight: '700',
    color: '#8c8c88',
    letterSpacing: 0.5,
  },
  greetingTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1a1a1a',
    marginTop: 1,
  },
  supermarketBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef7db',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(158, 208, 52, 0.4)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#5c8511',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: '#eaeae6',
  },
  metricLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#8c8c88',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1a1a1a',
    marginTop: 2,
  },
  metricValueBold: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 1,
  },
  metricSub: {
    fontSize: 7.5,
    color: '#6b6b6b',
    marginTop: 1,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: '#f0f0ec',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#9ed034',
  },
  recipesContainer: {
    gap: 5,
    marginBottom: 8,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: '#c4e377',
    gap: 6,
  },
  recipeEmojiBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f4f7ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeEmojiText: {
    fontSize: 14,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  recipeMeta: {
    fontSize: 7.5,
    color: '#6f9d13',
    fontWeight: '600',
    marginTop: 1,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eaeae6',
    paddingTop: 4,
    marginBottom: 2,
  },
  tabItem: {
    alignItems: 'center',
  },
  tabItemActive: {
    alignItems: 'center',
  },
  tabEmoji: {
    fontSize: 10,
  },
  tabLabel: {
    fontSize: 7,
    color: '#8c8c88',
    fontWeight: '600',
  },
  tabLabelActive: {
    fontSize: 7,
    color: '#6f9d13',
    fontWeight: '800',
  },
  homeIndicator: {
    width: 60,
    height: 3,
    backgroundColor: '#d0d0cc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 3,
  },
});
