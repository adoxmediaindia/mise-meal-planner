import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { usePlan } from '../../context/PlanContext';
import { DinnerCard } from '../../components/plan/DinnerCard';
import { SwapModal } from '../../components/plan/SwapModal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { IRecipe } from '../../types';

interface PlanScreenProps {
  onSelectRecipe: (recipe: IRecipe) => void;
  onNavigateToPreferences: () => void;
}

export const PlanScreen: React.FC<PlanScreenProps> = ({
  onSelectRecipe,
  onNavigateToPreferences,
}) => {
  const {
    plan,
    isLoading,
    fetchPlan,
    regeneratePlan,
    swapMeal,
    toggleDinnerCooked,
  } = usePlan();

  const [refreshing, setRefreshing] = useState(false);
  const [activeSwapDay, setActiveSwapDay] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPlan();
    setRefreshing(false);
  };

  if (isLoading && !plan) {
    return <LoadingState message="Generating your personalized dinner plan..." />;
  }

  if (!plan || !plan.dinners || plan.dinners.length === 0) {
    return (
      <EmptyState
        icon="🍳"
        title="No meal plan found"
        description="Set up your household preferences to generate your first 7-day dinner plan."
        actionTitle="Configure Preferences"
        onAction={onNavigateToPreferences}
      />
    );
  }

  const isUnderBudget = plan.estimatedCost <= plan.budgetLimit;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0D5C3A']}
          />
        }
      >
        {/* Weekly Header Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryTitle}>Weekly Dinner Plan</Text>
              <Text style={styles.summarySub}>
                Family of {plan.householdSize} • {plan.dinners.length} meals planned
              </Text>
            </View>

            <TouchableOpacity
              onPress={regeneratePlan}
              style={styles.regenBtn}
            >
              <Text style={styles.regenBtnText}>✨ Regenerate</Text>
            </TouchableOpacity>
          </View>

          {/* Budget & Cost Tracker */}
          <View style={styles.budgetRow}>
            <View style={styles.costBox}>
              <Text style={styles.costLabel}>Est. Total Cost</Text>
              <Text style={styles.costValue}>${plan.estimatedCost.toFixed(2)}</Text>
            </View>

            <View style={styles.costBox}>
              <Text style={styles.costLabel}>Budget Limit</Text>
              <Text style={styles.costValue}>${plan.budgetLimit.toFixed(2)}</Text>
            </View>

            <View
              style={[
                styles.budgetStatusPill,
                isUnderBudget ? styles.pillUnder : styles.pillOver,
              ]}
            >
              <Text
                style={[
                  styles.budgetStatusText,
                  isUnderBudget ? styles.textUnder : styles.textOver,
                ]}
              >
                {isUnderBudget
                  ? `✓ $${(plan.budgetLimit - plan.estimatedCost).toFixed(2)} Under`
                  : `⚠️ $${(plan.estimatedCost - plan.budgetLimit).toFixed(2)} Over`}
              </Text>
            </View>
          </View>
        </View>

        {/* Dinners List */}
        <Text style={styles.sectionHeader}>Dinners this week</Text>
        {plan.dinners.map((slot) => (
          <DinnerCard
            key={slot.day}
            slot={slot}
            onPressRecipe={() => onSelectRecipe(slot.recipe)}
            onSwap={() => setActiveSwapDay(slot.day)}
            onToggleCooked={() => toggleDinnerCooked(slot.day)}
          />
        ))}
      </ScrollView>

      {/* Instant Swap Modal */}
      {activeSwapDay && (
        <SwapModal
          visible={!!activeSwapDay}
          day={activeSwapDay}
          onClose={() => setActiveSwapDay(null)}
          onConfirmSwap={swapMeal}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#0D5C3A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summarySub: {
    fontSize: 13,
    color: '#D1E7DD',
    marginTop: 2,
  },
  regenBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  regenBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
  },
  costBox: {
    gap: 2,
  },
  costLabel: {
    fontSize: 11,
    color: '#D1E7DD',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  costValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  budgetStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillUnder: {
    backgroundColor: '#DEF7EC',
  },
  pillOver: {
    backgroundColor: '#FEE2E2',
  },
  budgetStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textUnder: {
    color: '#03543F',
  },
  textOver: {
    color: '#991B1B',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
});
