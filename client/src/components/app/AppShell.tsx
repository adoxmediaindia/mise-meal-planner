import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ClipboardList, Compass, Sliders, Settings as SettingsIcon, Smartphone, Monitor, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const AppShell: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [deviceFrameMode, setDeviceFrameMode] = useState(false);

  const tabs = [
    { to: '/app/plan', label: 'plan', icon: ClipboardList },
    { to: '/app/pantry', label: 'pantry', icon: Package },
    { to: '/app/explore', label: 'explore', icon: Compass },
    { to: '/app/preferences', label: 'preferences', icon: Sliders },
    { to: '/app/settings', label: 'settings', icon: SettingsIcon },
  ];

  // Hide bottom tab bar on recipe detail subpage
  const isRecipeDetailPage = location.pathname.startsWith('/app/recipes/');

  return (
    <div className="min-h-screen bg-[#f3f4f1] text-[#2a2a2a] flex flex-col items-center">
      {/* Top Desktop Helper Bar */}
      <header className="w-full bg-white border-b border-gray-200 py-2.5 px-4 sm:px-8 flex justify-between items-center text-xs text-[#6b6b6b]">
        <div className="flex items-center gap-3">
          <NavLink to="/" className="font-bold text-[#2a2a2a] hover:text-[#8bc020] transition-colors">
            ← Exit to Marketing Website
          </NavLink>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="hidden sm:inline">Logged in as: <strong>{user?.name}</strong> ({user?.subscriptionTier.toUpperCase()} TIER)</span>
          {user?.role === 'admin' && (
            <NavLink
              to="/app/admin"
              className="font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded-md transition-colors"
            >
              👑 Admin Console
            </NavLink>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline font-medium">View Mode:</span>
          <button
            type="button"
            onClick={() => setDeviceFrameMode(false)}
            className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
              !deviceFrameMode ? 'bg-[#9ed034]/20 text-[#1f2a06]' : 'text-gray-400 hover:text-gray-700'
            }`}
            title="Responsive Full Screen"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Fluid</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceFrameMode(true)}
            className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
              deviceFrameMode ? 'bg-[#9ed034]/20 text-[#1f2a06]' : 'text-gray-400 hover:text-gray-700'
            }`}
            title="Mobile iPhone Bezel Frame"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Phone Bezel</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <div
        className={`w-full flex-1 flex flex-col transition-all duration-300 ${
          deviceFrameMode
            ? 'max-w-[430px] my-6 bg-[#fafaf8] rounded-[48px] shadow-[0_24px_60px_rgba(42,42,42,0.2)] border-[12px] border-[#1a1a1a] overflow-hidden relative min-h-[850px]'
            : 'max-w-[620px] bg-[#fafaf8] shadow-sm min-h-screen relative'
        }`}
      >
        {/* Simulated iOS Status Bar */}
        <div className="w-full pt-3 px-7 pb-2 flex justify-between items-center text-xs font-semibold text-[#2a2a2a] select-none">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">5G</span>
            <span className="text-[10px]">100% 🔋</span>
          </div>
        </div>

        {/* Dynamic Nested Content */}
        <main className={`flex-1 overflow-y-auto px-5 sm:px-6 pt-2 pb-24`}>
          <Outlet />
        </main>

        {/* 4-Tab Bottom Navigation Bar */}
        {!isRecipeDetailPage && (
          <nav className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#2a2a2a]/8 px-4 py-2 flex justify-around items-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-1 px-3 text-xs font-semibold transition-colors ${
                      isActive ? 'text-[#8bc020] font-bold' : 'text-[#888] hover:text-[#2a2a2a]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="capitalize">{tab.label}</span>
                </NavLink>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};
