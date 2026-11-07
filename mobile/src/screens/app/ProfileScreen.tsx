import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Share,
  Switch,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';
import { mobileApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { IHousehold, IHouseholdInvitation, IInvoice } from '../../types';
import { isLocalDemoMode } from '../../demo/demoMode';

interface ProfileScreenProps {
  onNavigateToPreferences: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigateToPreferences }) => {
  const { user, logout, refreshUser } = useAuth();
  const { plan, shoppingList, preferences } = usePlan();

  const [weeklyReminderEnabled, setWeeklyReminderEnabled] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const [upgrading, setUpgrading] = useState(false);
  const [household, setHousehold] = useState<IHousehold | null>(null);
  const [loadingHousehold, setLoadingHousehold] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<IHouseholdInvitation[]>([]);
  const [invoices, setInvoices] = useState<IInvoice[]>([]);

  // Usage stats state
  const [aiUsage, setAiUsage] = useState<{ used: number; limit: number } | null>(null);

  // Household Modals state
  const [isCreateHouseholdOpen, setIsCreateHouseholdOpen] = useState(false);
  const [householdNameInput, setHouseholdNameInput] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [inviteRoleInput, setInviteRoleInput] = useState<'admin' | 'member'>('member');
  const [inviteResult, setInviteResult] = useState<{ token: string; link: string } | null>(null);
  const [joinTokenInput, setJoinTokenInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false);

  const fetchHouseholdData = async () => {
    setLoadingHousehold(true);
    try {
      const res = await mobileApi.getMyHousehold();
      if (res.success && res.data) {
        setHousehold(res.data);
        const invitesRes = await mobileApi.getPendingHouseholdInvitations();
        if (invitesRes.success && invitesRes.data) {
          setPendingInvites(invitesRes.data);
        }
      } else {
        setHousehold(null);
      }
    } catch {
      setHousehold(null);
    } finally {
      setLoadingHousehold(false);
    }
  };

  const fetchUsageAndInvoices = async () => {
    try {
      const usageRes = await mobileApi.getUsageStats();
      if (usageRes.success && usageRes.data) {
        setAiUsage({
          used: usageRes.data.aiQuotaUsed ?? usageRes.data.aiUsed ?? 0,
          limit: usageRes.data.aiQuotaLimit ?? (user?.subscriptionTier === 'pro' ? 50 : 5),
        });
      }
    } catch {
      setAiUsage({
        used: 0,
        limit: user?.subscriptionTier === 'pro' ? 50 : 5,
      });
    }

    try {
      const invRes = await mobileApi.getInvoices();
      if (invRes.success && invRes.data) {
        setInvoices(invRes.data);
      }
    } catch {
      // Invoices not available or free user
    }
  };

  useEffect(() => {
    fetchHouseholdData();
    fetchUsageAndInvoices();
  }, []);

  const handleCreateHousehold = async () => {
    if (!householdNameInput.trim()) {
      Alert.alert('Required', 'Please enter a household name');
      return;
    }
    setIsCreatingHousehold(true);
    try {
      await mobileApi.createHousehold(householdNameInput.trim());
      setIsCreateHouseholdOpen(false);
      setHouseholdNameInput('');
      await fetchHouseholdData();
      Alert.alert('Created', 'Your household was created successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create household');
    } finally {
      setIsCreatingHousehold(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!joinTokenInput.trim()) {
      Alert.alert('Required', 'Please enter an invitation token');
      return;
    }
    setIsJoining(true);
    try {
      await mobileApi.acceptHouseholdInvitation(joinTokenInput.trim());
      setJoinTokenInput('');
      await fetchHouseholdData();
      Alert.alert('Joined', 'You have successfully joined the household!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Invalid or expired invitation token');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmailInput.trim()) {
      Alert.alert('Required', 'Please enter an email address');
      return;
    }
    try {
      const res = await mobileApi.inviteHouseholdMember({
        email: inviteEmailInput.trim(),
        role: inviteRoleInput,
      });
      setInviteResult({
        token: res.data?.inviteToken || '',
        link: res.inviteLink || '',
      });
      setInviteEmailInput('');
      await fetchHouseholdData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send invitation');
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    try {
      await mobileApi.revokeHouseholdInvitation(id);
      await fetchHouseholdData();
      Alert.alert('Revoked', 'Household invitation revoked.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to revoke invitation');
    }
  };

  const handleLeaveHousehold = () => {
    Alert.alert(
      'Leave Household',
      'Are you sure you want to leave this household? You will stop sharing your meal plans and pantry inventory.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await mobileApi.leaveHousehold();
              await fetchHouseholdData();
              Alert.alert('Left Household', 'You are no longer in this household.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to leave household');
            }
          },
        },
      ]
    );
  };

  const handleToggleSubscription = async () => {
    setUpgrading(true);
    try {
      const res = await mobileApi.mockUpgradeSubscription();
      if (res.success) {
        await refreshUser();
        await fetchUsageAndInvoices();
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

  const handleExportData = async () => {
    const exportObject = {
      app: 'Meltto Meal Planner',
      exportDate: new Date().toISOString(),
      user: {
        name: user?.name,
        email: user?.email,
        tier: user?.subscriptionTier,
      },
      preferences,
      currentPlan: plan,
      shoppingList,
    };

    const jsonString = JSON.stringify(exportObject, null, 2);

    try {
      await Share.share({
        message: jsonString,
        title: `meltto-data-export-${new Date().toISOString().slice(0, 10)}.json`,
      });
    } catch {
      Alert.alert('Data Export (JSON)', `Exported ${jsonString.length} bytes of user data.`);
    }
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate Meltto',
      'Enjoying Meltto? Rating our app helps home cooks discover affordable meal planning and reduce kitchen food waste.',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Rate 5 Stars ★',
          onPress: () => Alert.alert('Thank You!', 'We deeply appreciate your support for Meltto!'),
        },
      ]
    );
  };

  const handleRequestFeature = () => {
    Alert.alert(
      'Request a Feature',
      'Have an idea for Chef Meltto AI, smart grocery aisles, or new recipes? We would love to hear from you!',
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Send Feedback',
          onPress: () => Alert.alert('Feedback Sent', 'Your request has been forwarded to the Meltto product team.'),
        },
      ]
    );
  };

  const handleResetSavedMeals = () => {
    Alert.alert(
      'Reset Saved Meals',
      'Are you sure you want to clear your saved favorites and pinned recipes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => Alert.alert('Reset Complete', 'Your saved meal favorites have been cleared.'),
        },
      ]
    );
  };

  const handleResetSuggestedHistory = () => {
    Alert.alert(
      'Reset Suggested Meal History',
      'This will clear previously recommended recipes so Chef Meltto AI can suggest them fresh.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset History',
          style: 'destructive',
          onPress: () => Alert.alert('Reset Complete', 'Suggested meal recommendation history has been reset.'),
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const isPro = user?.subscriptionTier === 'pro';
  const toggleSection = (section: string) => {
    setExpandedSections((expanded) => ({ ...expanded, [section]: !expanded[section] }));
  };
  const sectionHeader = (title: string, key: string, description: string) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ expanded: Boolean(expandedSections[key]) }}
      onPress={() => toggleSection(key)}
      style={styles.accordionHeader}
    >
      <View style={styles.accordionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.accordionDescription}>{description}</Text>
      </View>
      <Text style={styles.accordionChevron}>{expandedSections[key] ? '−' : '+'}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Profile summary */}
      <View style={styles.header}>
        <Text style={styles.headerOverline}>YOUR MELTTO</Text>
        <Text style={styles.headerTitle}>profile</Text>
      </View>

      {/* User Card matching Screenshot 5: Hi, Name / Shopping at Supermarket */}
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.name}>Hi, {user?.name || 'Meltto Cook'}</Text>
              <Text style={styles.editPencil}>✏️</Text>
            </View>
            <Text style={styles.supermarketLabel}>
              Shopping at {preferences?.supermarket || 'Aldi'}
            </Text>
            <Text style={styles.email}>{user?.email || 'cook@example.com'}</Text>
          </View>
        </View>

        <View style={[styles.tierBadge, isPro ? styles.tierPro : styles.tierFree]}>
          <Text style={[styles.tierText, isPro ? styles.tierTextPro : styles.tierTextFree]}>
            {isPro
              ? '★ MELTTO PRO CHEF'
              : user?.subscriptionStatus === 'cancelled'
              ? '○ FREE STARTER (Trial Concluded)'
              : '○ FREE STARTER'}
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <TouchableOpacity style={styles.settingRow} onPress={onNavigateToPreferences}>
          <View style={styles.settingRowLeft}>
            <Text style={styles.settingRowIcon}>🍽️</Text>
            <View>
              <Text style={styles.settingRowText}>Meal preferences</Text>
              <Text style={styles.settingRowSub}>Budget, cooking days and dietary needs</Text>
            </View>
          </View>
          <Text style={styles.settingRowChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        {sectionHeader('App settings', 'app', 'Language and saved items')}
        {expandedSections.app ? (
          <>

        <TouchableOpacity style={styles.settingRow} onPress={handleRateApp}>
          <View style={styles.settingRowLeft}>
            <Text style={styles.settingRowIcon}>⭐</Text>
            <Text style={styles.settingRowText}>Rate Meltto</Text>
          </View>
          <Text style={styles.settingRowChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow} onPress={handleRequestFeature}>
          <View style={styles.settingRowLeft}>
            <Text style={styles.settingRowIcon}>💡</Text>
            <Text style={styles.settingRowText}>Request a feature</Text>
          </View>
          <Text style={styles.settingRowChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.settingRow}>
          <View style={styles.settingRowLeft}>
            <Text style={styles.settingRowIcon}>🌐</Text>
            <Text style={styles.settingRowText}>Language</Text>
          </View>
          <Text style={styles.settingRowValue}>
            {user?.preferredLanguage?.toUpperCase() || 'EN'} (English)
          </Text>
        </View>

        <TouchableOpacity style={styles.settingRow} onPress={handleResetSavedMeals}>
          <View style={styles.settingRowLeft}>
            <Text style={styles.settingRowIcon}>🔄</Text>
            <Text style={styles.settingRowText}>Reset saved meals</Text>
          </View>
          <Text style={styles.settingRowChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingRow, styles.settingRowLast]} onPress={handleResetSuggestedHistory}>
          <View style={styles.settingRowLeft}>
            <Text style={styles.settingRowIcon}>🗑️</Text>
            <Text style={styles.settingRowText}>Reset suggested meal history</Text>
          </View>
          <Text style={styles.settingRowChevron}>›</Text>
        </TouchableOpacity>
          </>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        {sectionHeader('Notifications', 'notifications', 'Weekly plan reminders')}

        {expandedSections.notifications ? (
          <View style={[styles.settingRow, styles.settingRowLast]}>
          <View style={styles.settingRowLeft}>
            <Text style={styles.settingRowIcon}>🔔</Text>
            <View>
              <Text style={styles.settingRowText}>Weekly plan reminder</Text>
              <Text style={styles.settingRowSub}>Sunday at 10:00 — plan your week</Text>
            </View>
          </View>
          <Switch
            value={weeklyReminderEnabled}
            onValueChange={setWeeklyReminderEnabled}
            trackColor={{ false: '#D1D5DB', true: '#0D5C3A' }}
            thumbColor="#FFFFFF"
          />
          </View>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ expanded: Boolean(expandedSections.household) }}
            onPress={() => toggleSection('household')}
            style={styles.accordionCopy}
          >
            <Text style={styles.sectionTitle}>Household</Text>
            <Text style={styles.accordionDescription}>Members, invitations and shared planning</Text>
          </TouchableOpacity>
          {household && (
            <TouchableOpacity
              style={styles.inviteSmallBtn}
              onPress={() => {
                setInviteResult(null);
                setIsInviteModalOpen(true);
              }}
            >
              <Text style={styles.inviteSmallBtnText}>+ Invite</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.accordionChevron}>{expandedSections.household ? '−' : '+'}</Text>
        </View>

        {expandedSections.household ? (loadingHousehold ? (
          <ActivityIndicator color="#0D5C3A" style={{ marginVertical: 14 }} />
        ) : household ? (
          <View>
            <View style={styles.householdBanner}>
              <Text style={styles.householdName}>🏡 {household.name}</Text>
              <Text style={styles.householdOwner}>
                Created by {household.owner?.name || 'Owner'}
              </Text>
            </View>

            <Text style={styles.subsectionLabel}>Members ({household.members?.length || 0}):</Text>
            <View style={styles.membersList}>
              {household.members?.map((m, idx) => (
                <View key={m.user?._id || idx} style={styles.memberRow}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{m.user?.name || 'Household Member'}</Text>
                    <Text style={styles.memberEmail}>{m.user?.email || ''}</Text>
                  </View>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{m.role.toUpperCase()}</Text>
                  </View>
                </View>
              ))}
            </View>

            {pendingInvites.length > 0 && (
              <View style={styles.pendingSection}>
                <Text style={styles.subsectionLabel}>Pending Invites:</Text>
                {pendingInvites.map((inv) => (
                  <View key={inv._id} style={styles.pendingInviteRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pendingEmail}>{inv.inviteeEmail}</Text>
                      <Text style={styles.pendingToken}>Token: {inv.inviteToken}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.revokeBtn}
                      onPress={() => handleRevokeInvitation(inv._id!)}
                    >
                      <Text style={styles.revokeBtnText}>Revoke</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.leaveHouseholdBtn} onPress={handleLeaveHousehold}>
              <Text style={styles.leaveHouseholdBtnText}>Leave Household</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionDesc}>
              Collaborate on meal plans, grocery checklists, and pantry inventory with family members.
            </Text>

            <View style={styles.householdActionsRow}>
              <TouchableOpacity
                style={styles.createHouseholdBtn}
                onPress={() => setIsCreateHouseholdOpen(true)}
              >
                <Text style={styles.createHouseholdBtnText}>Create Household</Text>
              </TouchableOpacity>
            </View>

            {/* Join with Invite Token */}
            <View style={styles.joinBox}>
              <Text style={styles.joinLabel}>Have an invitation token?</Text>
              <View style={styles.joinInputRow}>
                <TextInput
                  style={styles.joinInput}
                  placeholder="Paste invite token here"
                  placeholderTextColor="#9CA3AF"
                  value={joinTokenInput}
                  onChangeText={setJoinTokenInput}
                />
                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={handleJoinHousehold}
                  disabled={isJoining}
                >
                  <Text style={styles.joinBtnText}>{isJoining ? 'Joining...' : 'Join'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )) : null}
      </View>

      <View style={styles.sectionCard}>
        {sectionHeader(
          'Subscription',
          'subscription',
          `${isPro ? 'Meltto Pro' : 'Free plan'}${aiUsage ? ` · ${aiUsage.used}/${aiUsage.limit} AI requests` : ''}`
        )}
        {expandedSections.subscription ? (
          <>
        <Text style={styles.sectionDesc}>
          {isPro
            ? 'Your Pro Chef membership unlocks 50 Chef Meltto AI requests/week, unlimited pantry staples, and multi-member household sharing.'
            : 'Upgrade to Meltto Pro for 50 AI requests/week, unlimited pantry tracking, and family sharing.'}
        </Text>

        {/* AI Weekly Quota Meter */}
        {aiUsage && (
          <View style={styles.quotaBox}>
            <View style={styles.quotaHeader}>
              <Text style={styles.quotaLabel}>Chef Meltto AI Weekly Quota</Text>
              <Text style={styles.quotaVal}>
                {aiUsage.used} / {aiUsage.limit} requests
              </Text>
            </View>
            <View style={styles.quotaTrack}>
              <View
                style={[
                  styles.quotaFill,
                  {
                    width: `${Math.min(100, Math.round((aiUsage.used / aiUsage.limit) * 100))}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {!isPro ? (
          <View style={styles.upgradeChoices}>
            <Button
              title="Upgrade Monthly ($4.99/mo)"
              onPress={async () => {
                setUpgrading(true);
                try {
                  const res = await mobileApi.upgradeSubscription('mise_pro_monthly');
                  await refreshUser();
                  await fetchUsageAndInvoices();
                  Alert.alert('Subscribed!', res.message || 'You are now on Meltto Pro Monthly!');
                } catch (err: any) {
                  Alert.alert('Error', err.message);
                } finally {
                  setUpgrading(false);
                }
              }}
              loading={upgrading}
              variant="primary"
              style={styles.subBtn}
            />
            <Button
              title="Upgrade Annual ($49.99/yr — Save 17%)"
              onPress={async () => {
                setUpgrading(true);
                try {
                  const res = await mobileApi.upgradeSubscription('mise_pro_yearly');
                  await refreshUser();
                  await fetchUsageAndInvoices();
                  Alert.alert('Subscribed!', res.message || 'You are now on Meltto Pro Annual!');
                } catch (err: any) {
                  Alert.alert('Error', err.message);
                } finally {
                  setUpgrading(false);
                }
              }}
              loading={upgrading}
              variant="secondary"
              style={styles.subBtn}
            />
          </View>
        ) : (
          <Button
            title="Downgrade to Free Tier"
            onPress={handleToggleSubscription}
            loading={upgrading}
            variant="secondary"
            style={styles.subBtn}
          />
        )}

        {/* Past Invoices */}
        {invoices.length > 0 && (
          <View style={styles.invoicesSection}>
            <Text style={styles.subsectionLabel}>Billing Invoices:</Text>
            {invoices.map((inv) => (
              <View key={inv.id} style={styles.invoiceRow}>
                <Text style={styles.invoiceDate}>{new Date(inv.date).toLocaleDateString()}</Text>
                <Text style={styles.invoiceAmount}>
                  ${inv.amount.toFixed(2)} {inv.currency.toUpperCase()}
                </Text>
                <View style={styles.invoiceBadge}>
                  <Text style={styles.invoiceBadgeText}>{inv.status.toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.testModeNotice}>
          ℹ️ Payment processing runs in test/provider-independent mode. Live checkout integrates directly with Stripe.
        </Text>
          </>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        {sectionHeader('Privacy & data', 'privacy', 'Export or take a copy of your information')}
        {expandedSections.privacy ? (
          <>
        <Text style={styles.sectionDesc}>
          Download a complete JSON export of your profile, preferences, current meal plan, and shopping checklist.
        </Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExportData}>
          <Text style={styles.exportBtnText}>📤 Export My Data (JSON)</Text>
        </TouchableOpacity>
          </>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        {sectionHeader('Cloud sync', 'sync', 'Your Meltto account is connected')}
        {expandedSections.sync ? (
        <View style={styles.syncRow}>
          <Text style={styles.syncIcon}>☁️</Text>
          <View style={styles.syncMeta}>
            <Text style={styles.syncHeading}>Unified Meltto Cloud Connected</Text>
            <Text style={styles.syncDesc}>
              Any changes made here (swapped meals, grocery checkoffs, pantry ingredients, preferences) immediately reflect when you log into meltto.com on your desktop or tablet.
            </Text>
          </View>
        </View>
        ) : null}
      </View>

      {/* App Version Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Meltto Mobile • Version 1.0.0</Text>
        <Text style={styles.infoSub}>
          {isLocalDemoMode()
            ? 'Local web demo • Static sample data'
            : 'Production Android Build • Single Authoritative Cloud'}
        </Text>
      </View>

      {/* Sign Out Button */}
      <Button
        title="Sign Out"
        onPress={handleLogout}
        variant="danger"
        style={styles.logoutBtn}
      />

      {/* ==================================================== */}
      {/* CREATE HOUSEHOLD MODAL                               */}
      {/* ==================================================== */}
      <Modal visible={isCreateHouseholdOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSheetTitle}>Create New Household</Text>
              <TouchableOpacity onPress={() => setIsCreateHouseholdOpen(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Household Name (e.g. Miller Family)"
              placeholderTextColor="#9CA3AF"
              value={householdNameInput}
              onChangeText={setHouseholdNameInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsCreateHouseholdOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateHousehold}
                disabled={isCreatingHousehold}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {isCreatingHousehold ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* INVITE MEMBER MODAL                                  */}
      {/* ==================================================== */}
      <Modal visible={isInviteModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSheetTitle}>Invite Household Member</Text>
              <TouchableOpacity onPress={() => setIsInviteModalOpen(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {!inviteResult ? (
              <View>
                <Text style={styles.modalFieldLabel}>Member Email</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="family@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={inviteEmailInput}
                  onChangeText={setInviteEmailInput}
                />

                <Text style={styles.modalFieldLabel}>Role</Text>
                <View style={styles.roleToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.roleTogglePill,
                      inviteRoleInput === 'member' && styles.roleTogglePillActive,
                    ]}
                    onPress={() => setInviteRoleInput('member')}
                  >
                    <Text
                      style={[
                        styles.roleToggleText,
                        inviteRoleInput === 'member' && styles.roleToggleTextActive,
                      ]}
                    >
                      Member
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleTogglePill,
                      inviteRoleInput === 'admin' && styles.roleTogglePillActive,
                    ]}
                    onPress={() => setInviteRoleInput('admin')}
                  >
                    <Text
                      style={[
                        styles.roleToggleText,
                        inviteRoleInput === 'admin' && styles.roleToggleTextActive,
                      ]}
                    >
                      Admin
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setIsInviteModalOpen(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSubmitBtn}
                    onPress={handleSendInvitation}
                  >
                    <Text style={styles.modalSubmitBtnText}>Send Invitation</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.inviteSuccessBox}>
                  <Text style={styles.inviteSuccessTitle}>✓ Invitation Created!</Text>
                  <Text style={styles.inviteTokenText}>Token: {inviteResult.token}</Text>
                  <Text style={styles.inviteLinkText}>{inviteResult.link}</Text>
                </View>
                <TouchableOpacity
                  style={styles.shareInviteBtn}
                  onPress={() => {
                    Share.share({
                      message: `Join my household on Meltto Meal Planner using invite token: ${inviteResult.token}\nOr link: ${inviteResult.link}`,
                    });
                  }}
                >
                  <Text style={styles.shareInviteBtnText}>Share Invitation Link</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doneInviteBtn}
                  onPress={() => setIsInviteModalOpen(false)}
                >
                  <Text style={styles.doneInviteBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  header: {
    marginBottom: 16,
  },
  headerOverline: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0D5C3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  editPencil: {
    fontSize: 13,
  },
  supermarketLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D5C3A',
    marginTop: 2,
  },
  email: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingRowIcon: {
    fontSize: 18,
  },
  settingRowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  settingRowSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  settingRowChevron: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  settingRowValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tierBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tierPro: {
    backgroundColor: '#FEF3C7',
  },
  tierFree: {
    backgroundColor: '#F3F4F6',
  },
  tierText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tierTextPro: {
    color: '#B45309',
  },
  tierTextFree: {
    color: '#6B7280',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0ECE4',
  },
  accordionHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  accordionCopy: {
    flex: 1,
  },
  accordionDescription: {
    color: '#78827B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  accordionChevron: {
    color: '#0D5C3A',
    fontSize: 23,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  householdBanner: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  householdName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  householdOwner: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  subsectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  membersList: {
    gap: 8,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FAF9F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  memberEmail: {
    fontSize: 11,
    color: '#6B7280',
  },
  roleBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  pendingSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  pendingInviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    marginBottom: 6,
  },
  pendingEmail: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingToken: {
    fontSize: 10,
    color: '#B45309',
  },
  revokeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  revokeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  leaveHouseholdBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  leaveHouseholdBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  inviteSmallBtn: {
    backgroundColor: '#0D5C3A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  inviteSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  householdActionsRow: {
    marginBottom: 12,
  },
  createHouseholdBtn: {
    backgroundColor: '#0D5C3A',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  createHouseholdBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  joinBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  joinLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  joinInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  joinInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  joinBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quotaBox: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quotaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#581C87',
  },
  quotaVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7C3AED',
  },
  quotaTrack: {
    height: 6,
    backgroundColor: '#E9D5FF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  quotaFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 3,
  },
  upgradeChoices: {
    gap: 8,
    marginBottom: 10,
  },
  subBtn: {
    marginVertical: 2,
  },
  invoicesSection: {
    marginTop: 10,
    marginBottom: 8,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  invoiceDate: {
    fontSize: 12,
    color: '#4B5563',
  },
  invoiceAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  invoiceBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  invoiceBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  testModeNotice: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    lineHeight: 15,
  },
  exportBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  syncDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginTop: 2,
  },
  infoCard: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  infoSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 4,
    marginBottom: 20,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    padding: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  modalFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 6,
  },
  roleToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  roleTogglePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  roleTogglePillActive: {
    backgroundColor: '#0D5C3A',
  },
  roleToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  roleToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalSubmitBtn: {
    backgroundColor: '#0D5C3A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inviteSuccessBox: {
    backgroundColor: '#DEF7EC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  inviteSuccessTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#03543F',
    marginBottom: 4,
  },
  inviteTokenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#046C4E',
  },
  inviteLinkText: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 4,
  },
  shareInviteBtn: {
    backgroundColor: '#0D5C3A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  shareInviteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doneInviteBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  doneInviteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
});
