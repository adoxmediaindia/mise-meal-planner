import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { IAdminMetrics, IRecipe } from '../../types/index.js';
import { Button } from '../../components/common/Button.js';
import {
  ShieldAlert,
  Users,
  DollarSign,
  TrendingUp,
  BookOpen,
  Calendar,
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Edit2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'recipes'>('metrics');

  // Metrics State
  const [metrics, setMetrics] = useState<IAdminMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userTierFilter, setUserTierFilter] = useState<string>('all');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Recipes State
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipePage, setRecipePage] = useState(1);
  const [recipeTotalPages, setRecipeTotalPages] = useState(1);

  // Add Recipe Modal State
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeDesc, setRecipeDesc] = useState('');
  const [recipeImage, setRecipeImage] = useState('');
  const [recipeCuisine, setRecipeCuisine] = useState<any>('Mediterranean');
  const [recipePrep, setRecipePrep] = useState(15);
  const [recipeCook, setRecipeCook] = useState(20);
  const [recipeServings, setRecipeServings] = useState(2);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [recipeModalError, setRecipeModalError] = useState<string | null>(null);

  // General Notification Banner
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Access check
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-[28px] max-w-md shadow-xl border border-red-100 space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="font-serif font-bold text-2xl text-[#2a2a2a]">Access Denied</h2>
          <p className="text-xs text-[#6b6b6b] leading-relaxed">
            Administrator privileges are required to access this system portal. Your current account ({user.email}) does not have admin rights.
          </p>
          <Link
            to="/app/plan"
            className="inline-block mt-2 px-6 py-2.5 rounded-full bg-[#1f2a06] text-white text-xs font-bold hover:bg-[#2e3e09]"
          >
            ← Return to Meal Planner
          </Link>
        </div>
      </div>
    );
  }

  // Load Metrics
  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await api.getAdminMetrics();
      setMetrics(res.data);
    } catch (err: any) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Load Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.getAdminUsers({
        search: userSearch || undefined,
        tier: userTierFilter !== 'all' ? userTierFilter : undefined,
        page: userPage,
        limit: 15,
      });
      setUsers(res.data);
      setUserTotalPages(res.pagination.totalPages || 1);
      setTotalUsersCount(res.pagination.total || 0);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load Recipes
  const fetchRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const res = await api.getAdminRecipes({
        search: recipeSearch || undefined,
        page: recipePage,
        limit: 15,
      });
      setRecipes(res.data);
      setRecipeTotalPages(res.pagination.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoadingRecipes(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, userSearch, userTierFilter, userPage]);

  useEffect(() => {
    if (activeTab === 'recipes') {
      fetchRecipes();
    }
  }, [activeTab, recipeSearch, recipePage]);

  // Adjust User Tier
  const handleToggleTier = async (userId: string, currentTier: string, email: string) => {
    const nextTier = currentTier === 'pro' ? 'free' : 'pro';
    if (confirm(`Change tier for ${email} from ${currentTier.toUpperCase()} to ${nextTier.toUpperCase()}?`)) {
      try {
        await api.updateAdminUserTier(userId, nextTier);
        setActionMessage(`Updated ${email} to ${nextTier.toUpperCase()}`);
        setTimeout(() => setActionMessage(null), 4000);
        await fetchUsers();
        await fetchMetrics();
      } catch (err: any) {
        alert(err.message || 'Failed to update user tier');
      }
    }
  };

  // Submit New Recipe
  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeTitle.trim() || !recipeDesc.trim()) {
      setRecipeModalError('Title and description are required.');
      return;
    }

    setIsSavingRecipe(true);
    setRecipeModalError(null);

    try {
      await api.createAdminRecipe({
        title: recipeTitle.trim(),
        description: recipeDesc.trim(),
        image: recipeImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        cuisine: recipeCuisine,
        vibes: ['Speedy Meals', 'Healthy Comfort'],
        prepTimeMinutes: Number(recipePrep) || 15,
        cookTimeMinutes: Number(recipeCook) || 20,
        servings: Number(recipeServings) || 2,
        calories: 520,
        carbsGrams: 45,
        proteinGrams: 30,
        fatGrams: 18,
        ingredients: [
          {
            name: 'Primary Protein / Base',
            quantity: 300,
            unit: 'g',
            aisle: 'Fresh Produce',
            estimatedCost: 3.5,
          },
          {
            name: 'Olive Oil',
            quantity: 15,
            unit: 'ml',
            aisle: 'Pantry & Grains',
            estimatedCost: 0.5,
          },
        ],
        instructions: [
          'Prepare all ingredients fresh.',
          'Cook according to optimal temperature.',
          'Serve warm with your favorite garnish.',
        ],
        dietaryTags: ['None'],
        allergens: [],
        equipmentNeeded: ['Hob Only'],
      });

      setIsAddRecipeOpen(false);
      setRecipeTitle('');
      setRecipeDesc('');
      setRecipeImage('');
      setActionMessage('New recipe created and added to global catalogue.');
      setTimeout(() => setActionMessage(null), 4000);
      await fetchRecipes();
      await fetchMetrics();
    } catch (err: any) {
      setRecipeModalError(err.message || 'Failed to create recipe');
    } finally {
      setIsSavingRecipe(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/app/plan"
            className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#2a2a2a] shadow-xs hover:border-[#8bc020] transition-colors"
            title="Return to App"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#1f2a06] text-white">
                Admin Console
              </span>
              <span className="text-xs text-gray-500 font-medium">Mise SaaS Engine</span>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#2a2a2a] mt-0.5">
              Administration Dashboard
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchMetrics();
            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'recipes') fetchRecipes();
          }}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-black shadow-xs hover:border-[#8bc020] transition-all cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-[#9ed034]/20 border border-[#9ed034] rounded-2xl text-xs font-bold text-[#1f2a06] flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-[#8bc020] flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-white/70 backdrop-blur-xs p-1 rounded-2xl border border-[#2a2a2a]/6 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'metrics'
              ? 'bg-[#1f2a06] text-white shadow-xs'
              : 'text-[#6b6b6b] hover:text-[#2a2a2a]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Metrics &amp; MRR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#1f2a06] text-white shadow-xs'
              : 'text-[#6b6b6b] hover:text-[#2a2a2a]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users ({metrics?.users?.total || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recipes')}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'recipes'
              ? 'bg-[#1f2a06] text-white shadow-xs'
              : 'text-[#6b6b6b] hover:text-[#2a2a2a]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Recipe Library</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: METRICS & REVENUE OVERVIEW                    */}
      {/* ==================================================== */}
      {activeTab === 'metrics' && (
        <div className="space-y-5">
          {loadingMetrics ? (
            <div className="text-center py-12 text-sm text-[#6b6b6b]">Loading system metrics...</div>
          ) : metrics ? (
            <>
              {/* Financial & User KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {/* Total Users */}
                <div className="bg-white rounded-[22px] p-4 border border-[#2a2a2a]/6 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#9a9a94]">
                      Total Users
                    </span>
                    <Users className="w-4 h-4 text-[#8bc020]" />
                  </div>
                  <div className="text-2xl font-black text-[#2a2a2a]">{metrics.users.total}</div>
                  <div className="text-[11px] text-gray-500">
                    {metrics.users.conversionRate}% Pro conversion
                  </div>
                </div>

                {/* Estimated MRR */}
                <div className="bg-white rounded-[22px] p-4 border border-[#2a2a2a]/6 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#9a9a94]">
                      Est. MRR
                    </span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    ${metrics.subscriptions.estimatedMRR.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-gray-500">Monthly Run Rate</div>
                </div>

                {/* Paid Subscribers */}
                <div className="bg-white rounded-[22px] p-4 border border-[#2a2a2a]/6 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#9a9a94]">
                      Pro Subscribers
                    </span>
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-[#2a2a2a]">
                    {metrics.subscriptions.activePaid}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {metrics.subscriptions.monthly} mo • {metrics.subscriptions.yearly} yr
                  </div>
                </div>

                {/* Invoices Paid */}
                <div className="bg-white rounded-[22px] p-4 border border-[#2a2a2a]/6 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#9a9a94]">
                      Invoices Paid
                    </span>
                    <CheckCircle className="w-4 h-4 text-[#8bc020]" />
                  </div>
                  <div className="text-2xl font-black text-[#2a2a2a]">
                    {metrics.subscriptions.totalInvoicesPaid}
                  </div>
                  <div className="text-[11px] text-gray-500">Successful checkouts</div>
                </div>
              </div>

              {/* System Volume Row */}
              <div className="bg-white rounded-[24px] p-5 border border-[#2a2a2a]/6 shadow-xs space-y-4">
                <h3 className="font-sans font-bold text-sm text-[#2a2a2a] uppercase tracking-wider">
                  Platform Usage &amp; Content Volume
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-xl font-black text-[#2a2a2a]">{metrics.system.totalRecipes}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Active Recipes</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-xl font-black text-[#2a2a2a]">{metrics.system.totalMealPlans}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Meal Plans Created</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-xl font-black text-[#2a2a2a]">{metrics.system.totalPantryItems}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Pantry Items Tracked</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-xl font-black text-[#2a2a2a]">{metrics.system.totalHouseholds}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Shared Households</div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: USER MANAGEMENT                               */}
      {/* ==================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#2a2a2a] focus:outline-none focus:border-[#9ed034] shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={userTierFilter}
                onChange={(e) => {
                  setUserTierFilter(e.target.value);
                  setUserPage(1);
                }}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#2a2a2a] shadow-xs"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free Starter</option>
                <option value="pro">Pro Member</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          {loadingUsers ? (
            <div className="text-center py-12 text-sm text-[#6b6b6b]">Loading users...</div>
          ) : users.length > 0 ? (
            <div className="bg-white rounded-[24px] border border-[#2a2a2a]/6 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5 pl-4">User</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Tier</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Joined</th>
                      <th className="p-3.5 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3.5 pl-4">
                          <div className="font-bold text-[#2a2a2a]">{u.name}</div>
                          <div className="text-[11px] text-gray-500">{u.email}</div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                              u.subscriptionTier === 'pro'
                                ? 'bg-[#9ed034]/20 text-[#1f2a06] border border-[#9ed034]'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {u.subscriptionTier}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-[11px] text-gray-600 capitalize">
                            {u.subscriptionStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-500 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleTier(u._id, u.subscriptionTier, u.email)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-gray-200 hover:border-[#8bc020] hover:bg-[#9ed034]/10 transition-colors cursor-pointer"
                          >
                            Switch to {u.subscriptionTier === 'pro' ? 'Free' : 'Pro'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 px-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing {users.length} of {totalUsersCount} users
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-bold text-[#2a2a2a]">
                    Page {userPage} of {userTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={userPage >= userTotalPages}
                    onClick={() => setUserPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl text-center text-xs text-gray-500">
              No users matching search query.
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: RECIPE LIBRARY                                */}
      {/* ==================================================== */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search recipe library..."
                value={recipeSearch}
                onChange={(e) => {
                  setRecipeSearch(e.target.value);
                  setRecipePage(1);
                }}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#2a2a2a] focus:outline-none focus:border-[#9ed034] shadow-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAddRecipeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1f2a06] text-white text-xs font-bold hover:bg-[#2e3e09] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Recipe</span>
            </button>
          </div>

          {/* Recipes List */}
          {loadingRecipes ? (
            <div className="text-center py-12 text-sm text-[#6b6b6b]">Loading recipe catalogue...</div>
          ) : recipes.length > 0 ? (
            <div className="bg-white rounded-[24px] border border-[#2a2a2a]/6 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 pl-4">Dish</th>
                      <th className="p-3">Cuisine</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Servings</th>
                      <th className="p-3">Calories</th>
                      <th className="p-3 pr-4 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recipes.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3 pl-4 flex items-center gap-2.5">
                          {r.image && (
                            <img
                              src={r.image}
                              alt={r.title}
                              className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-[#2a2a2a] truncate max-w-[200px]">{r.title}</div>
                            <div className="text-[11px] text-gray-400 line-clamp-1">{r.description}</div>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-gray-600">{r.cuisine}</td>
                        <td className="p-3 text-gray-600">{r.prepTimeMinutes + r.cookTimeMinutes}m</td>
                        <td className="p-3 text-gray-600">{r.servings}</td>
                        <td className="p-3 font-mono text-gray-600">{r.calories} kcal</td>
                        <td className="p-3 pr-4 text-right">
                          <Link
                            to={`/app/recipes/${r._id}`}
                            className="text-[#8bc020] hover:underline font-bold"
                          >
                            Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 px-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Total recipes: {metrics?.system?.totalRecipes || recipes.length}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={recipePage <= 1}
                    onClick={() => setRecipePage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-bold text-[#2a2a2a]">
                    Page {recipePage} of {recipeTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={recipePage >= recipeTotalPages}
                    onClick={() => setRecipePage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl text-center text-xs text-gray-500">
              No recipes found.
            </div>
          )}
        </div>
      )}

      {/* CREATE RECIPE MODAL */}
      {isAddRecipeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl animate-scaleUp space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-xl text-[#2a2a2a]">Add Global Recipe</h3>
              <button
                type="button"
                onClick={() => setIsAddRecipeOpen(false)}
                className="p-1 text-gray-400 hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {recipeModalError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">
                {recipeModalError}
              </div>
            )}

            <form onSubmit={handleCreateRecipe} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Recipe Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Creamy Garlic Tuscan Salmon"
                  value={recipeTitle}
                  onChange={(e) => setRecipeTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#9ed034]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Description *</label>
                <textarea
                  placeholder="Brief description of flavors, texture, and appeal..."
                  value={recipeDesc}
                  onChange={(e) => setRecipeDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#9ed034] h-16"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={recipeImage}
                  onChange={(e) => setRecipeImage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#9ed034]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Cuisine</label>
                  <select
                    value={recipeCuisine}
                    onChange={(e) => setRecipeCuisine(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-xs font-bold"
                  >
                    <option value="Italian">Italian</option>
                    <option value="Asian">Asian</option>
                    <option value="Mexican">Mexican</option>
                    <option value="Indian">Indian</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="British">British</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Servings</label>
                  <input
                    type="number"
                    min="1"
                    value={recipeServings}
                    onChange={(e) => setRecipeServings(parseInt(e.target.value, 10) || 2)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={recipePrep}
                    onChange={(e) => setRecipePrep(parseInt(e.target.value, 10) || 15)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Cook Time (mins)</label>
                  <input
                    type="number"
                    min="0"
                    value={recipeCook}
                    onChange={(e) => setRecipeCook(parseInt(e.target.value, 10) || 20)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddRecipeOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-100"
                >
                  Cancel
                </button>
                <Button type="submit" isLoading={isSavingRecipe}>
                  Save Recipe
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
