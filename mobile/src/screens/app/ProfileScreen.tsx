import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { mobileApi } from '../../services/api';
import { Button } from '../../components/common/Button';

export const ProfileScreen: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [upgrading, setUpgrading] = useState(false);

  const handleToggleSubscription = async () => {
    setUpgrading(true);
    try {
      const res = await mobileApi.mockUpgradeSubscription();
      if (res.success) {
        await refreshUser();
        Alert.alert(
          'Subscription Updated',
          `Your account is now on the ${res.data.tier.toUpperCase()} tier! This change is immediately synchronized with your web session.`
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update subscription');
    } finally {
      setUpgrading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const isPro = user?.subscriptionTier === 'pro';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* User Card */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </Text>
        </View>

        <Text style={styles.name}>{user?.name || 'Mise Cook'}</Text>
        <Text style={styles.email}>{user?.email || 'cook@example.com'}</Text>

        <View style={[styles.tierBadge, isPro ? styles.tierPro : styles.tierFree]}>
          <Text style={[styles.tierText, isPro ? styles.tierTextPro : styles.tierTextFree]}>
            {isPro ? '★ MISE PRO CHEF' : '○ FREE STARTER (TRIAL)'}
          </Text>
        </View>
      </View>

      {/* Subscription Management */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Subscription & Membership</Text>
        <Text style={styles.sectionDesc}>
          {isPro
            ? 'You have unlimited weekly planning, priority meal swaps, and real-time supermarket sync.'
            : 'Upgrade to Mise Pro for unlimited dinner swaps, automated multi-store comparisons, and advanced macro tracking.'}
        </Text>

        <Button
          title={isPro ? 'Downgrade to Free Tier' : '★ Upgrade to Pro ($4.99/mo)'}
          onPress={handleToggleSubscription}
          loading={upgrading}
          variant={isPro ? 'secondary' : 'primary'}
          style={styles.subBtn}
        />
      </View>

      {/* Cross-Device Sync Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Cross-Device Synchronization</Text>
        <View style={styles.syncRow}>
          <Text style={styles.syncIcon}>☁️</Text>
          <View style={styles.syncMeta}>
            <Text style={styles.syncHeading}>Unified Database Connected</Text>
            <Text style={styles.syncDesc}>
              Any changes made here (swapped meals, grocery checkoffs, preferences) immediately reflect when you log into misemealplanner.com on your desktop or tablet.
            </Text>
          </View>
        </View>
      </View>

      {/* App Version Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Mise Meal Planner Mobile • Version 1.0.0</Text>
        <Text style={styles.infoSub}>Single Authoritative Backend Architecture</Text>
      </View>

      {/* Sign Out Button */}
      <Button
        title="Sign Out"
        onPress={handleLogout}
        variant="danger"
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  scroll: {
    padding: 18,
    paddingBottom: 50,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0D5C3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  email: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12,
  },
  tierBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tierFree: {
    backgroundColor: '#F3F4F6',
  },
  tierPro: {
    backgroundColor: '#DEF7EC',
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tierTextFree: {
    color: '#4B5563',
  },
  tierTextPro: {
    color: '#03543F',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 14,
  },
  subBtn: {
    marginTop: 4,
  },
  syncRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  syncIcon: {
    fontSize: 24,
  },
  syncMeta: {
    flex: 1,
  },
  syncHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D5C3A',
  },
  syncDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginTop: 2,
  },
  infoCard: {
    alignItems: 'center',
    marginVertical: 14,
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  infoSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 6,
  },
});
