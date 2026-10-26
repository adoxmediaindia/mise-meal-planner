import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { usePlan } from '../../context/PlanContext.js';
import { api } from '../../services/api.js';
import { Button } from '../../components/common/Button.js';
import {
  User,
  ShieldCheck,
  Download,
  LogOut,
  CheckCircle2,
  Crown,
  Users,
  UserPlus,
  Mail,
  Copy,
  Trash2,
  Check,
  X,
  AlertCircle,
  Home,
  CreditCard,
  FileText,
  Sparkles,
} from 'lucide-react';
import { IHousehold, IHouseholdInvitation } from '../../types/index.js';

export const Settings: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { plan, preferences, shoppingList } = usePlan();
  const navigate = useNavigate();

  const [subData, setSubData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState('');

  // Household state
  const [household, setHousehold] = useState<IHousehold | null>(null);
  const [pendingInvites, setPendingInvites] = useState<IHouseholdInvitation[]>([]);
  const [loadingHousehold, setLoadingHousehold] = useState(true);
  const [householdError, setHouseholdError] = useState<string | null>(null);
  const [householdSuccess, setHouseholdSuccess] = useState<string | null>(null);

  // Household forms
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [joinTokenInput, setJoinTokenInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const fetchHousehold = async () => {
    setLoadingHousehold(true);
    try {
      const [hhRes, invRes] = await Promise.all([
        api.getMyHousehold().catch(() => ({ success: false, data: null })),
        api.getPendingHouseholdInvitations().catch(() => ({ success: false, data: [] })),
      ]);
      setHousehold(hhRes.data || null);
      setPendingInvites(invRes.data || []);
    } catch (err: any) {
      console.error('Failed to load household data:', err);
    } finally {
      setLoadingHousehold(false);
    }
  };

  const fetchSubscriptionData = async () => {
    try {
      const [statusRes, invRes] = await Promise.all([
        api.getSubscriptionStatus().catch(() => ({ success: false, data: null })),
        api.getInvoices().catch(() => ({ success: false, data: [] })),
      ]);
      setSubData(statusRes.data || null);
      setInvoices(invRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
    fetchHousehold();
  }, []);

  const handleUpgradeSubscription = async (cycle: 'monthly' | 'yearly') => {
    setIsUpgrading(true);
    try {
      const planId = cycle === 'yearly' ? 'mise_pro_yearly' : 'mise_pro_monthly';
      const res = await api.upgradeSubscription(planId);
      await refreshUser();
      await fetchSubscriptionData();
      setCopiedMsg(res.message);
      setTimeout(() => setCopiedMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating subscription');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (confirm('Cancel your Pro renewal? You will retain all Pro features until your current billing period ends.')) {
      try {
        const res = await api.cancelSubscription();
        await fetchSubscriptionData();
        setCopiedMsg(res.message);
        setTimeout(() => setCopiedMsg(''), 4000);
      } catch (err: any) {
        alert(err.message || 'Error canceling subscription');
      }
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const res = await api.reactivateSubscription();
      await fetchSubscriptionData();
      setCopiedMsg(res.message);
      setTimeout(() => setCopiedMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error reactivating subscription');
    }
  };

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseholdName.trim()) return;
    setIsCreatingHousehold(true);
    setHouseholdError(null);
    try {
      const res = await api.createHousehold(newHouseholdName.trim());
      setHousehold(res.data);
      setHouseholdSuccess(res.message);
      setNewHouseholdName('');
      setTimeout(() => setHouseholdSuccess(null), 4000);
    } catch (err: any) {
      setHouseholdError(err.message || 'Failed to create household');
    } finally {
      setIsCreatingHousehold(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setHouseholdError(null);
    try {
      const res = await api.inviteHouseholdMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setGeneratedInviteLink(res.inviteLink || `Token: ${res.data.inviteToken}`);
      setHouseholdSuccess('Invitation created! Copy and send the link to your member.');
      setInviteEmail('');
      await fetchHousehold();
    } catch (err: any) {
      setHouseholdError(err.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleAcceptInvite = async (token: string) => {
    try {
      const res = await api.acceptHouseholdInvitation(token);
      setHousehold(res.data);
      setHouseholdSuccess(res.message);
      setTimeout(() => setHouseholdSuccess(null), 4000);
      await fetchHousehold();
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation');
    }
  };

  const handleRejectInvite = async (token: string) => {
    try {
      await api.rejectHouseholdInvitation(token);
      await fetchHousehold();
    } catch (err: any) {
      alert(err.message || 'Failed to decline invitation');
    }
  };

  const handleJoinWithToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinTokenInput.trim()) return;
    setIsJoining(true);
    setHouseholdError(null);
    try {
      const res = await api.acceptHouseholdInvitation(joinTokenInput.trim());
      setHousehold(res.data);
      setHouseholdSuccess(res.message);
      setJoinTokenInput('');
      setTimeout(() => setHouseholdSuccess(null), 4000);
      await fetchHousehold();
    } catch (err: any) {
      setHouseholdError(err.message || 'Failed to join household');
    } finally {
      setIsJoining(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (confirm(`Remove ${memberName} from this household?`)) {
      try {
        const res = await api.removeHouseholdMember(memberUserId);
        setHousehold(res.data);
        setHouseholdSuccess(res.message);
        setTimeout(() => setHouseholdSuccess(null), 4000);
      } catch (err: any) {
        alert(err.message || 'Failed to remove member');
      }
    }
  };

  const handleLeaveHousehold = async () => {
    if (confirm('Are you sure you want to leave this household?')) {
      try {
        await api.leaveHousehold();
        setHousehold(null);
        setHouseholdSuccess('You have left the household.');
        setTimeout(() => setHouseholdSuccess(null), 4000);
        await fetchHousehold();
      } catch (err: any) {
        alert(err.message || 'Failed to leave household');
      }
    }
  };

  const handleToggleSubscription = async () => {
    setIsUpgrading(true);
    try {
      const res = await api.mockUpgradeSubscription();
      await refreshUser();
      const statusRes = await api.getSubscriptionStatus();
      setSubData(statusRes.data);
      setCopiedMsg(res.message);
      setTimeout(() => setCopiedMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating subscription');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleExportData = () => {
    const exportObject = {
      user: { name: user?.name, email: user?.email },
      preferences,
      plan,
      shoppingList,
      exportDate: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mise-data-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-14">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#9a9a94]">
          Account &amp; Membership
        </span>
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#2a2a2a] mt-0.5">
          settings
        </h1>
      </div>

      {copiedMsg && (
        <div className="p-3 bg-[#9ed034]/20 border border-[#9ed034] rounded-xl text-xs font-bold text-[#1f2a06] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#8bc020]" />
          <span>{copiedMsg}</span>
        </div>
      )}

      {/* User Card */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#9ed034] text-[#1f2a06] font-extrabold text-xl flex items-center justify-center flex-shrink-0">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-sans font-black text-base text-[#2a2a2a] truncate">{user?.name}</h3>
          <p className="text-xs text-[#6b6b6b] truncate">{user?.email}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-[#8bc020]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified MERN Account</span>
          </div>
        </div>
      </div>

      {/* Subscription & Entitlement Usage Card */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h3 className="font-sans font-black text-base text-[#2a2a2a]">Subscription &amp; Plans</h3>
          </div>
          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
              user?.subscriptionTier === 'pro'
                ? 'bg-[#9ed034]/20 text-[#1f2a06] border border-[#9ed034]'
                : 'bg-gray-100 text-[#6b6b6b]'
            }`}
          >
            {user?.subscriptionTier === 'pro'
              ? subData?.cancelAtPeriodEnd
                ? 'Pro (Cancels at end)'
                : 'Pro Member'
              : 'Free Starter'}
          </span>
        </div>

        {/* Current Plan Overview */}
        <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Plan</span>
            <span className="text-xs font-bold text-[#1f2a06]">
              {subData?.price || (user?.subscriptionTier === 'pro' ? '$4.99 / month' : 'Free Trial')}
            </span>
          </div>
          <div className="text-base font-black text-[#2a2a2a]">
            {subData?.planDetails?.name || (user?.subscriptionTier === 'pro' ? 'Mise Pro' : 'Mise Starter')}
          </div>
          {subData?.currentPeriodEnd && user?.subscriptionTier === 'pro' && (
            <p className="text-[11px] text-gray-500">
              {subData.cancelAtPeriodEnd ? 'Access ends on: ' : 'Renews on: '}
              <strong>{new Date(subData.currentPeriodEnd).toLocaleDateString()}</strong>
            </p>
          )}
        </div>

        {/* Live Entitlement Usage Meters */}
        {subData?.usage && (
          <div className="space-y-2.5 pt-1">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Your Resource Entitlements
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Weekly Plans */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                <div className="text-gray-500 text-[11px]">Weekly Plan Generations</div>
                <div className="font-bold text-[#2a2a2a]">
                  {subData.usage.weeklyGenerations.count} /{' '}
                  {subData.usage.weeklyGenerations.limit === -1 ? '∞' : subData.usage.weeklyGenerations.limit}
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8bc020] rounded-full"
                    style={{
                      width:
                        subData.usage.weeklyGenerations.limit === -1
                          ? '10%'
                          : `${Math.min(100, (subData.usage.weeklyGenerations.count / subData.usage.weeklyGenerations.limit) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Pantry Items */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                <div className="text-gray-500 text-[11px]">Pantry Staples Tracked</div>
                <div className="font-bold text-[#2a2a2a]">
                  {subData.usage.pantry.count} /{' '}
                  {subData.usage.pantry.limit === -1 ? '∞' : subData.usage.pantry.limit}
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8bc020] rounded-full"
                    style={{
                      width:
                        subData.usage.pantry.limit === -1
                          ? '10%'
                          : `${Math.min(100, (subData.usage.pantry.count / subData.usage.pantry.limit) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Household Members */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                <div className="text-gray-500 text-[11px]">Household Members</div>
                <div className="font-bold text-[#2a2a2a]">
                  {subData.usage.household.membersCount} / {subData.usage.household.limit}
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8bc020] rounded-full"
                    style={{
                      width: `${Math.min(100, (subData.usage.household.membersCount / subData.usage.household.limit) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade / Billing Selection (if Free tier) */}
        {user?.subscriptionTier !== 'pro' ? (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-gray-700">Choose your Pro membership tier:</div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedCycle('monthly')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedCycle === 'monthly'
                    ? 'border-[#8bc020] bg-[#9ed034]/10 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-bold text-gray-500">Monthly Plan</div>
                <div className="text-base font-black text-[#2a2a2a]">$4.99 <span className="text-[10px] font-normal">/ mo</span></div>
                <div className="text-[10px] text-gray-500 mt-0.5">Flexible monthly billing</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCycle('yearly')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  selectedCycle === 'yearly'
                    ? 'border-[#8bc020] bg-[#9ed034]/10 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="absolute -top-2 right-2 text-[9px] font-black bg-[#1f2a06] text-white px-1.5 py-0.2 rounded-full">
                  Save 17%
                </span>
                <div className="text-xs font-bold text-gray-500">Annual Plan</div>
                <div className="text-base font-black text-[#2a2a2a]">$49.99 <span className="text-[10px] font-normal">/ yr</span></div>
                <div className="text-[10px] text-gray-500 mt-0.5">$4.16 / month equivalent</div>
              </button>
            </div>

            <Button
              onClick={() => handleUpgradeSubscription(selectedCycle)}
              isLoading={isUpgrading}
              className="w-full py-3"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-white" />
              Upgrade to Mise Pro ({selectedCycle === 'yearly' ? '$49.99/yr' : '$4.99/mo'})
            </Button>
          </div>
        ) : (
          /* Pro actions: Cancel or Reactivate */
          <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs">
            {subData?.cancelAtPeriodEnd ? (
              <button
                type="button"
                onClick={handleReactivateSubscription}
                className="px-3 py-1.5 bg-[#1f2a06] text-white font-bold rounded-xl hover:bg-[#2e3e09] cursor-pointer"
              >
                Resume Pro Auto-Renewal
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelSubscription}
                className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
              >
                Cancel Subscription Renewal
              </button>
            )}

            <button
              type="button"
              onClick={() => handleUpgradeSubscription(subData?.billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              disabled={isUpgrading}
              className="text-xs font-bold text-gray-600 hover:text-black underline cursor-pointer"
            >
              Switch to {subData?.billingCycle === 'monthly' ? 'Annual ($49.99/yr)' : 'Monthly ($4.99/mo)'}
            </button>
          </div>
        )}

        {/* Invoices & Payment History */}
        {invoices.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
            <div className="font-bold text-gray-600 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Billing History &amp; Invoices</span>
            </div>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white">
              {invoices.map((inv) => (
                <div key={inv._id || inv.invoiceNumber} className="p-2.5 px-3 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-[#2a2a2a]">{inv.invoiceNumber}</div>
                    <div className="text-[11px] text-gray-400">
                      {inv.planName} • {new Date(inv.paidAt || inv.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#2a2a2a]">${inv.amount.toFixed(2)}</div>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded uppercase bg-emerald-100 text-emerald-800">
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Mode Disclaimer */}
        <p className="text-[11px] text-gray-400 italic pt-1 border-t border-gray-100">
          ℹ️ Payments are operating in test/provider-independent mode. Live payment processing is ready pending production Stripe API keys.
        </p>
      </div>

      {/* Household & Family Sharing Card */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8bc020]" />
            <h3 className="font-sans font-black text-base text-[#2a2a2a]">Household &amp; Sharing</h3>
          </div>
          {household && (
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#9ed034]/20 text-[#1f2a06] border border-[#9ed034]">
              {household.members.find((m) => (m.user._id || m.user.id) === user?.id)?.role?.toUpperCase() || 'MEMBER'}
            </span>
          )}
        </div>

        {householdError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{householdError}</span>
          </div>
        )}

        {householdSuccess && (
          <div className="p-3 bg-[#9ed034]/20 border border-[#9ed034] rounded-xl text-xs text-[#1f2a06] font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8bc020] flex-shrink-0" />
            <span>{householdSuccess}</span>
          </div>
        )}

        {/* Pending Invitations Banner (if any invitations exist for current user's email) */}
        {pendingInvites.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-600" />
              <span>You have {pendingInvites.length} pending household invitation{pendingInvites.length > 1 ? 's' : ''}!</span>
            </div>
            {pendingInvites.map((inv) => (
              <div
                key={inv._id}
                className="bg-white rounded-xl p-3 border border-amber-100 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-[#2a2a2a]">
                    Join "{inv.household.name}" as {inv.role}
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    Invited by {inv.invitedBy.name} ({inv.invitedBy.email})
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAcceptInvite(inv.inviteToken)}
                    className="px-2.5 py-1 bg-[#1f2a06] text-white font-bold rounded-lg hover:bg-[#2e3e09] transition-all cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectInvite(inv.inviteToken)}
                    className="px-2.5 py-1 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Household Display */}
        {loadingHousehold ? (
          <div className="text-center py-4 text-xs text-gray-400">Loading household status...</div>
        ) : household ? (
          <div className="space-y-4">
            <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Household Name</div>
              <div className="text-base font-black text-[#2a2a2a] mt-0.5">{household.name}</div>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-medium text-emerald-800">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100">Meal Plan Shared</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100">Grocery List Shared</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100">Pantry Shared</span>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Members ({household.members.length})
              </div>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white">
                {household.members.map((member) => {
                  const memberId = member.user._id || member.user.id || '';
                  const isCurrent = memberId === user?.id;
                  const isOwner = (household.owner._id || household.owner.id) === user?.id;

                  return (
                    <div
                      key={memberId}
                      className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[#2a2a2a] truncate">
                          {member.user.name} {isCurrent && '(You)'}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">{member.user.email}</div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                            member.role === 'owner'
                              ? 'bg-amber-100 text-amber-800'
                              : member.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {member.role}
                        </span>

                        {isOwner && !isCurrent && member.role !== 'owner' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(memberId, member.user.name)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invite Form (only for owner/admin) */}
            <form onSubmit={handleInviteMember} className="space-y-2.5 pt-2 border-t border-gray-100">
              <div className="text-xs font-bold text-[#2a2a2a]">Invite a family or household member</div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="family.member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#2a2a2a] focus:outline-none focus:border-[#9ed034]"
                  required
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-xs font-bold text-[#2a2a2a] focus:outline-none focus:border-[#9ed034]"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <Button type="submit" isLoading={isInviting}>
                  Invite
                </Button>
              </div>

              {/* Shareable Invite Link Output */}
              {generatedInviteLink && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs">
                  <div className="font-bold text-[#2a2a2a] flex items-center justify-between">
                    <span>Shareable Invitation Link / Token:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedInviteLink);
                        alert('Invitation link copied to clipboard!');
                      }}
                      className="text-xs text-[#8bc020] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <div className="font-mono text-[11px] bg-white p-2 rounded border border-gray-200 break-all select-all">
                    {generatedInviteLink}
                  </div>
                  <p className="text-[10px] text-gray-500 italic">
                    ℹ️ Note: Since automated email delivery is not configured, share this link or token directly with your household member.
                  </p>
                </div>
              )}
            </form>

            {/* Leave Household button (if not sole owner) */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={handleLeaveHousehold}
                className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
              >
                Leave Household
              </button>
            </div>
          </div>
        ) : (
          /* User has no household yet */
          <div className="space-y-4">
            <p className="text-xs text-[#6b6b6b] leading-relaxed">
              Create a shared household to plan meals, manage pantry staples, and shop for groceries together with your family or housemates.
            </p>

            {/* Create Household Form */}
            <form onSubmit={handleCreateHousehold} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., The Miller Family"
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#2a2a2a] focus:outline-none focus:border-[#9ed034]"
                required
              />
              <Button type="submit" isLoading={isCreatingHousehold}>
                Create
              </Button>
            </form>

            {/* Or Join with Token */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="text-xs font-bold text-[#6b6b6b]">Received an invitation token?</div>
              <form onSubmit={handleJoinWithToken} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste invite token..."
                  value={joinTokenInput}
                  onChange={(e) => setJoinTokenInput(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-[#2a2a2a] focus:outline-none focus:border-[#9ed034]"
                  required
                />
                <Button type="submit" isLoading={isJoining}>
                  Join
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Data Export & Account Actions */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-3">
        <h3 className="font-sans font-black text-sm uppercase tracking-wider text-[#9a9a94]">
          Data &amp; Privacy (GDPR)
        </h3>

        <button
          type="button"
          onClick={handleExportData}
          className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-gray-50 flex items-center justify-between text-xs sm:text-sm font-bold text-[#2a2a2a] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-[#8bc020]" />
            <span>Export my meal plans and shopping list (JSON)</span>
          </div>
          <span className="text-xs text-gray-400">Download</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-red-50 flex items-center justify-between text-xs sm:text-sm font-bold text-red-600 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Sign out of mise</span>
          </div>
          <span className="text-xs text-red-400">Logout</span>
        </button>
      </div>
    </div>
  );
};
