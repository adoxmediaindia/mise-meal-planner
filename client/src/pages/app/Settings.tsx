import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { usePlan } from '../../context/PlanContext.js';
import { api } from '../../services/api.js';
import { Button } from '../../components/common/Button.js';
import { User, ShieldCheck, Download, LogOut, CheckCircle2, Crown } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { plan, preferences, shoppingList } = usePlan();
  const navigate = useNavigate();

  const [subData, setSubData] = useState<any>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState('');

  useEffect(() => {
    api
      .getSubscriptionStatus()
      .then((res) => {
        setSubData(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

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

      {/* Subscription Card */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(42,42,42,0.06)] border border-[#2a2a2a]/6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h3 className="font-sans font-black text-base text-[#2a2a2a]">Subscription</h3>
          </div>
          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
              user?.subscriptionTier === 'pro'
                ? 'bg-[#9ed034]/20 text-[#1f2a06] border border-[#9ed034]'
                : 'bg-gray-100 text-[#6b6b6b]'
            }`}
          >
            {user?.subscriptionTier === 'pro' ? 'Pro Member' : 'Free Trial'}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#6b6b6b] leading-relaxed">
          {user?.subscriptionTier === 'pro'
            ? 'Your Pro Chef membership unlocks unlimited recipe generation, dietary filters, and smart grocery consolidation.'
            : 'You are on the free starter plan. Upgrade to unlock the full weekly meal planner engine.'}
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleToggleSubscription}
            disabled={isUpgrading}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border border-[#2a2a2a]/15 hover:border-[#8bc020] hover:bg-[#9ed034]/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isUpgrading
              ? 'Updating tier...'
              : user?.subscriptionTier === 'pro'
              ? 'Switch to Free Tier (Simulate Downgrade)'
              : 'Upgrade to Mise Pro ($4.99/mo Simulation)'}
          </button>
        </div>
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
