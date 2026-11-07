import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const SLIDE_WIDTH = Math.min(screenWidth - 48, 300);

export const WelcomeCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SLIDE_WIDTH);
    if (page !== activeIndex && page >= 0 && page < 3) {
      setActiveIndex(page);
    }
  };

  const scrollToPage = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SLIDE_WIDTH, animated: true });
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* 3-Screen Scroll View */}
      <View style={styles.carouselWrapper}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          decelerationRate="fast"
          snapToInterval={SLIDE_WIDTH}
          snapToAlignment="center"
          contentContainerStyle={styles.scrollContent}
        >
          {/* SLIDE 1: Weekly Plan Preview */}
          <View style={[styles.phoneFrame, { width: SLIDE_WIDTH }]}>
            <View style={styles.innerScreen}>
              {/* Speaker Notch */}
              <View style={styles.notchContainer}>
                <View style={styles.notch} />
              </View>

              <Text style={styles.phoneHeader}>Chef!</Text>

              {/* Summary Stats Row */}
              <View style={styles.summaryRow}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>EST. COST</Text>
                  <Text style={styles.summaryValue}>
                    29.90 <Text style={styles.summarySub}>/ 40</Text>
                  </Text>
                  <View style={styles.progressTrack}>
                    <View style={styles.progressFill} />
                  </View>
                </View>

                <View style={styles.groceryBox}>
                  <Text style={styles.groceryLabel}>TAP TO VIEW</Text>
                  <Text style={styles.groceryTitle}>Grocery list</Text>
                  <Text style={styles.grocerySub}>0/34 items bought</Text>
                </View>
              </View>

              {/* Dinners List */}
              <View style={styles.dinnersList}>
                <View style={styles.dinnerCard}>
                  <Text style={styles.dinnerEmoji}>🍝</Text>
                  <View style={styles.dinnerInfo}>
                    <Text style={styles.dinnerDay}>MONDAY</Text>
                    <Text style={styles.dinnerTitle} numberOfLines={1}>
                      Spaghetti Bolognese
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, styles.badgeOrange]}>
                        <Text style={styles.badgeTextOrange}>Family Favs</Text>
                      </View>
                      <Text style={styles.metaText}>⏱ 45m  👤 2</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.dinnerCard}>
                  <Text style={styles.dinnerEmoji}>🍜</Text>
                  <View style={styles.dinnerInfo}>
                    <Text style={styles.dinnerDay}>TUESDAY</Text>
                    <Text style={styles.dinnerTitle} numberOfLines={1}>
                      Crispy Pork Noodles
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, styles.badgePurple]}>
                        <Text style={styles.badgeTextPurple}>Speedy Meals</Text>
                      </View>
                      <Text style={styles.metaText}>⏱ 30m  👤 2</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.dinnerCard}>
                  <Text style={styles.dinnerEmoji}>🍣</Text>
                  <View style={styles.dinnerInfo}>
                    <Text style={styles.dinnerDay}>WEDNESDAY</Text>
                    <Text style={styles.dinnerTitle} numberOfLines={1}>
                      Teriyaki Salmon
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, styles.badgePurple]}>
                        <Text style={styles.badgeTextPurple}>Speedy Meals</Text>
                      </View>
                      <Text style={styles.metaText}>⏱ 35m  👤 2</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.dinnerCard}>
                  <Text style={styles.dinnerEmoji}>🥘</Text>
                  <View style={styles.dinnerInfo}>
                    <Text style={styles.dinnerDay}>THURSDAY</Text>
                    <Text style={styles.dinnerTitle} numberOfLines={1}>
                      Butter Bean Carbonara
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, styles.badgePink]}>
                        <Text style={styles.badgeTextPink}>Protein Packed</Text>
                      </View>
                      <Text style={styles.metaText}>⏱ 35m  👤 2</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Bottom Mock Tab Bar */}
              <View style={styles.tabBarMock}>
                <Text style={styles.tabActive}>📋</Text>
                <Text style={styles.tabInactive}>🍽️</Text>
                <Text style={styles.tabInactive}>⚙️</Text>
                <Text style={styles.tabInactive}>👤</Text>
              </View>
            </View>
          </View>

          {/* SLIDE 2: Recipe Detail Preview */}
          <View style={[styles.phoneFrame, { width: SLIDE_WIDTH }]}>
            <View style={styles.innerScreen}>
              <View style={styles.notchContainer}>
                <View style={styles.notch} />
              </View>
              <Text style={styles.phoneHeader}>Recipe Detail</Text>
              <View style={styles.recipePreview}>
                <View style={styles.recipeBanner}>
                  <Text style={{ fontSize: 44 }}>🍜</Text>
                </View>
                <Text style={styles.recipeTitle}>Crispy Pork Noodles</Text>
                <View style={styles.macrosRow}>
                  <View style={styles.macroPill}>
                    <Text style={styles.macroValue}>770</Text>
                    <Text style={styles.macroLabel}>kcal</Text>
                  </View>
                  <View style={styles.macroPill}>
                    <Text style={styles.macroValue}>65g</Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroPill}>
                    <Text style={styles.macroValue}>42g</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                </View>

                <View style={styles.ingredientsBox}>
                  <Text style={styles.sectionTitle}>Key Ingredients</Text>
                  <Text style={styles.ingredientLine}>• Minced Pork (250g)</Text>
                  <Text style={styles.ingredientLine}>• Egg Noodles (200g)</Text>
                  <Text style={styles.ingredientLine}>• Soy Sauce, Garlic &amp; Greens</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SLIDE 3: Smart Grocery List Preview */}
          <View style={[styles.phoneFrame, { width: SLIDE_WIDTH }]}>
            <View style={styles.innerScreen}>
              <View style={styles.notchContainer}>
                <View style={styles.notch} />
              </View>
              <Text style={styles.phoneHeader}>Smart Grocery List</Text>
              <View style={styles.groceryPreview}>
                <View style={styles.storeBanner}>
                  <Text style={styles.storeTitle}>Aldi Aisles</Text>
                  <Text style={styles.storeSavings}>Saved $14.50</Text>
                </View>
                <View style={styles.aisleGroup}>
                  <Text style={styles.aisleHeader}>PRODUCE</Text>
                  <Text style={styles.groceryLine}>✓ Broccoli florets (300g)</Text>
                  <Text style={styles.groceryLine}>○ Spring onions (1 bunch)</Text>
                </View>
                <View style={styles.aisleGroup}>
                  <Text style={styles.aisleHeader}>MEAT &amp; SEAFOOD</Text>
                  <Text style={styles.groceryLine}>○ Lean Minced Pork (500g)</Text>
                  <Text style={styles.groceryLine}>○ Salmon Fillets (2 pack)</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* 3 Pagination Dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => scrollToPage(idx)}
            style={[
              styles.dot,
              idx === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  carouselWrapper: {
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'center',
  },
  phoneFrame: {
    height: 370,
    backgroundColor: '#1A1A1A',
    borderRadius: 36,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  innerScreen: {
    flex: 1,
    backgroundColor: '#FAF9F5',
    borderRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  notchContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  notch: {
    width: 60,
    height: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
  },
  phoneHeader: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F0EFEA',
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#8C8C88',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  summarySub: {
    fontSize: 9,
    color: '#8C8C88',
    fontWeight: '500',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#F0EFEA',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#9ED034',
  },
  groceryBox: {
    flex: 1,
    backgroundColor: '#DDF4FF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#BEE7FF',
  },
  groceryLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#0369A1',
  },
  groceryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0C4A6E',
  },
  grocerySub: {
    fontSize: 8,
    color: '#0369A1',
  },
  dinnersList: {
    gap: 6,
  },
  dinnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F0EFEA',
  },
  dinnerEmoji: {
    fontSize: 20,
  },
  dinnerInfo: {
    flex: 1,
  },
  dinnerDay: {
    fontSize: 7,
    fontWeight: '800',
    color: '#8C8C88',
  },
  dinnerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeOrange: {
    backgroundColor: '#FFEDD5',
  },
  badgeTextOrange: {
    fontSize: 7,
    fontWeight: '700',
    color: '#C2410C',
  },
  badgePurple: {
    backgroundColor: '#F3E8FF',
  },
  badgeTextPurple: {
    fontSize: 7,
    fontWeight: '700',
    color: '#7E22CE',
  },
  badgePink: {
    backgroundColor: '#FCE7F3',
  },
  badgeTextPink: {
    fontSize: 7,
    fontWeight: '700',
    color: '#BE185D',
  },
  metaText: {
    fontSize: 8,
    color: '#8C8C88',
  },
  tabBarMock: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#EAEAE6',
    paddingTop: 4,
  },
  tabActive: {
    fontSize: 12,
    color: '#0D5C3A',
  },
  tabInactive: {
    fontSize: 12,
    opacity: 0.4,
  },
  recipePreview: {
    paddingVertical: 6,
  },
  recipeBanner: {
    height: 80,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  recipeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  macroPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAE6',
  },
  macroValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  macroLabel: {
    fontSize: 7,
    color: '#8C8C88',
  },
  ingredientsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EAEAE6',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ingredientLine: {
    fontSize: 9,
    color: '#4B5563',
    lineHeight: 14,
  },
  groceryPreview: {
    paddingVertical: 6,
  },
  storeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#DDF4FF',
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  storeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  storeSavings: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D5C3A',
  },
  aisleGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EAEAE6',
  },
  aisleHeader: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8C8C88',
    marginBottom: 4,
  },
  groceryLine: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 14,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 12,
    backgroundColor: '#1A1A1A',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },
});
